/**
 * API route tests — POST /api/auth/logout  &  GET /api/auth/refresh
 * src/app/api/auth/logout/route.ts
 * src/app/api/auth/refresh/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Next.js stubs ─────────────────────────────────────────────────────────────

const mockCookiesSet = vi.fn()

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse',
      body,
      status: init?.status ?? 200,
      cookies: { set: mockCookiesSet },
    }),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(() => undefined) })),
}))

// ── Session / JWT stubs ───────────────────────────────────────────────────────

const mockGetSession    = vi.fn()
const mockSignToken     = vi.fn().mockResolvedValue('new.signed.token')

vi.mock('@/lib/auth/session', () => ({
  getSession:          (...a: unknown[]) => mockGetSession(...a),
  sessionCookieOptions: (token: string)  => ({ name: 'hrms_session', value: token }),
  clearCookieOptions:  ()                => ({ name: 'hrms_session', value: '', maxAge: 0 }),
}))

vi.mock('@/lib/auth/jwt', () => ({
  signToken:   (...a: unknown[]) => mockSignToken(...a),
  verifyToken: vi.fn(),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { GET  as refreshGET } from '@/app/api/auth/refresh/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockSignToken.mockResolvedValue('new.signed.token')
})

// ── Logout ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('returns 200 ok', async () => {
    const res = await logoutPOST() as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('clears the session cookie', async () => {
    await logoutPOST()
    expect(mockCookiesSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hrms_session', maxAge: 0 })
    )
  })
})

// ── Refresh ───────────────────────────────────────────────────────────────────

describe('GET /api/auth/refresh', () => {
  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await refreshGET() as any
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthenticated')
  })

  it('returns 200 when session is valid', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'user-1', email: 'a@b.com', role: 'tenant_user', tenantId: 't-1'
    })
    const res = await refreshGET() as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('re-signs token with same claims', async () => {
    const session = { sub: 'user-1', email: 'a@b.com', role: 'tenant_user' as const, tenantId: 't-1' }
    mockGetSession.mockResolvedValue(session)
    await refreshGET()
    expect(mockSignToken).toHaveBeenCalledWith(expect.objectContaining({ sub: 'user-1', email: 'a@b.com' }))
  })

  it('sets a new session cookie after refresh', async () => {
    mockGetSession.mockResolvedValue({ sub: 'u', email: 'e@e.com', role: 'tenant_user' as const })
    await refreshGET()
    expect(mockCookiesSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hrms_session', value: 'new.signed.token' })
    )
  })
})
