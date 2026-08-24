/**
 * Unit tests — fetchWithAuth (client-side auth-retry wrapper)
 * src/lib/fetchWithAuth.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Globals setup ─────────────────────────────────────────────────────────────
// fetchWithAuth reads document.cookie and window.location, so we need stubs.

Object.defineProperty(global, 'document', {
  value: { cookie: '' },
  writable: true,
})

Object.defineProperty(global, 'window', {
  value: { location: { href: '' } },
  writable: true,
})

// ── Import ────────────────────────────────────────────────────────────────────

import { fetchWithAuth } from '@/lib/fetchWithAuth'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResponse(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchWithAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.window.location.href = ''
    global.document.cookie = ''
  })

  it('returns response directly when not 401', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(makeResponse(200))

    const res = await fetchWithAuth('/api/tenant/employees')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('retries original request after successful refresh on 401', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(makeResponse(401))     // original request → 401
      .mockResolvedValueOnce(makeResponse(200))     // /api/auth/refresh → ok
      .mockResolvedValueOnce(makeResponse(200))     // retry → ok

    const res = await fetchWithAuth('/api/tenant/employees')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/refresh', { method: 'GET' })
  })

  it('redirects to /login when refresh fails on 401', async () => {
    vi.spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(makeResponse(401))   // original → 401
      .mockResolvedValueOnce(makeResponse(401))   // refresh → also fails

    await fetchWithAuth('/api/tenant/employees')
    expect(global.window.location.href).toBe('/login')
  })

  it('includes tenant slug in redirect URL when cookie is set', async () => {
    global.document.cookie = 'tenant_slug=acme-corp'
    vi.spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401))

    await fetchWithAuth('/api/tenant/employees')
    expect(global.window.location.href).toBe('/login?tenant=acme-corp')
  })

  it('passes original init options through to fetch', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(makeResponse(200))

    await fetchWithAuth('/api/tenant/employees', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/tenant/employees', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
    })
  })
})
