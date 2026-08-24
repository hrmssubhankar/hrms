/**
 * API route tests — GET /api/auth/refresh
 * src/app/api/auth/refresh/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Next.js stubs ─────────────────────────────────────────────────────────────

const mockCookiesSet = vi.fn()

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse', body, status: init?.status ?? 200,
      cookies: { set: mockCookiesSet },
    }),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(() => undefined) })),
}))

// ── Session / JWT stubs ───────────────────────────────────────────────────────

const mockGetSession = vi.fn()
const mockSignToken  = vi.fn()

vi.mock('@/lib/auth/session', () => ({
  getSession:           () => mockGetSession(),
  sessionCookieOptions: vi.fn((token: string) => ({ name: 'session', value: token })),
}))

vi.mock('@/lib/auth/jwt', () => ({
  signToken: (...a: unknown[]) => mockSignToken(...a),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET } from '@/app/api/auth/refresh/route'
import { sessionCookieOptions } from '@/lib/auth/session'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = {
  sub: 'u-1', email: 'dir@acme.com',
  role: 'tenant_user', tenantId: 't-1', userRole: 'director',
}

beforeEach(() => {
  vi.resetAllMocks()
  mockSignToken.mockResolvedValue('new-token-xyz')
  vi.mocked(sessionCookieOptions).mockImplementation((token: string) => ({ name: 'session', value: token }) as any)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/refresh', () => {
  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET() as any
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/unauthenticated/i)
  })

  it('returns 200 and sets a fresh session cookie', async () => {
    mockGetSession.mockResolvedValue(SESSION)
    const res = await GET() as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(mockSignToken).toHaveBeenCalledWith(expect.objectContaining({ sub: 'u-1' }))
    expect(mockCookiesSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'session', value: 'new-token-xyz' }),
    )
  })
})
