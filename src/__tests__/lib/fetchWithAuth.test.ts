/**
 * Unit tests — fetchWithAuth
 * src/lib/fetchWithAuth.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock window.location
const mockLocation = { href: '' }
vi.stubGlobal('window', { location: mockLocation })

// Mock document.cookie
Object.defineProperty(global, 'document', {
  value: { cookie: '' },
  writable: true,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockLocation.href = ''
  document.cookie   = ''
  // Reset module so refreshInFlight is cleared between tests
  vi.resetModules()
})

// Helper to build a mock Response
function mockResponse(status: number, ok: boolean = status >= 200 && status < 300): Response {
  return { status, ok } as Response
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('fetchWithAuth — successful request', () => {
  it('returns the response directly when status is not 401', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')
    const res = mockResponse(200)
    mockFetch.mockResolvedValueOnce(res)

    const result = await fetchWithAuth('/api/tenant/employees')

    expect(result).toBe(res)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('passes through non-401 error statuses without refresh', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')
    mockFetch.mockResolvedValueOnce(mockResponse(500))

    const result = await fetchWithAuth('/api/tenant/employees')

    expect(result.status).toBe(500)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('passes init options to fetch', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')
    mockFetch.mockResolvedValueOnce(mockResponse(200))

    const init: RequestInit = { method: 'POST', body: JSON.stringify({ x: 1 }) }
    await fetchWithAuth('/api/tenant/employees', init)

    expect(mockFetch).toHaveBeenCalledWith('/api/tenant/employees', init)
  })
})

describe('fetchWithAuth — 401 with successful refresh', () => {
  it('calls refresh endpoint on 401 then retries', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    mockFetch
      .mockResolvedValueOnce(mockResponse(401, false))   // original request → 401
      .mockResolvedValueOnce(mockResponse(200))           // refresh → ok
      .mockResolvedValueOnce(mockResponse(200))           // retry → ok

    const result = await fetchWithAuth('/api/tenant/employees')

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/auth/refresh', { method: 'GET' })
    expect(result.status).toBe(200)
  })

  it('retries original request with same init after refresh', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    const init: RequestInit = { method: 'DELETE' }
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, false))
      .mockResolvedValueOnce(mockResponse(200))
      .mockResolvedValueOnce(mockResponse(204))

    const result = await fetchWithAuth('/api/tenant/employees/1', init)

    expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/tenant/employees/1', init)
    expect(result.status).toBe(204)
  })
})

describe('fetchWithAuth — 401 with failed refresh', () => {
  it('returns the original 401 response when refresh fails', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    const original401 = mockResponse(401, false)
    mockFetch
      .mockResolvedValueOnce(original401)
      .mockResolvedValueOnce(mockResponse(401, false)) // refresh also fails

    const result = await fetchWithAuth('/api/tenant/employees')

    expect(result).toBe(original401)
  })

  it('redirects to /login when refresh fails and no tenant cookie', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    document.cookie = ''
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, false))
      .mockResolvedValueOnce(mockResponse(401, false))

    await fetchWithAuth('/api/tenant/employees')

    expect(mockLocation.href).toBe('/login')
  })

  it('redirects to /login?tenant=<slug> when tenant_slug cookie present', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    document.cookie = 'tenant_slug=acme-corp'
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, false))
      .mockResolvedValueOnce(mockResponse(401, false))

    await fetchWithAuth('/api/tenant/employees')

    expect(mockLocation.href).toBe('/login?tenant=acme-corp')
  })

  it('redirects to /login when fetch throws during refresh', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    document.cookie = ''
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, false))
      .mockRejectedValueOnce(new Error('network error'))

    await fetchWithAuth('/api/tenant/employees')

    expect(mockLocation.href).toBe('/login')
  })
})

describe('fetchWithAuth — refresh deduplication', () => {
  it('only fires one refresh when two requests 401 concurrently', async () => {
    const { fetchWithAuth } = await import('@/lib/fetchWithAuth')

    let refreshCallCount = 0
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/auth/refresh') {
        refreshCallCount++
        return Promise.resolve(mockResponse(200))
      }
      // first call per URL returns 401, retry returns 200
      return Promise.resolve(mockResponse(401, false))
    })

    // Two concurrent requests that both get 401
    const [r1, r2] = await Promise.all([
      fetchWithAuth('/api/a'),
      fetchWithAuth('/api/b'),
    ])

    // Only one refresh should have been fired
    expect(refreshCallCount).toBe(1)
  })
})
