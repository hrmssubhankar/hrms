/**
 * API route tests — POST /api/auth/refresh
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

// ── DB stub: each db.select().from().where() call resolves the next queued result ──

const mockWhere = vi.fn()
vi.mock('@/lib/db', () => ({
  db: { select: () => ({ from: () => ({ where: (...a: unknown[]) => mockWhere(...a) }) }) },
}))

vi.mock('@/lib/db/schema', () => ({
  superAdmins: {}, users: {}, tenants: {},
}))

vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }))

// ── Session / JWT stubs ───────────────────────────────────────────────────────

const mockGetSession = vi.fn()
const mockSignToken  = vi.fn()

vi.mock('@/lib/auth/session', () => ({
  SESSION_COOKIE:       'hrms_session',
  getSession:           () => mockGetSession(),
  sessionCookieOptions: (token: string) => ({ name: 'hrms_session', value: token }),
}))

vi.mock('@/lib/auth/jwt', () => ({
  signToken: (...a: unknown[]) => mockSignToken(...a),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from '@/app/api/auth/refresh/route'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_SESSION = {
  sub: 'u-1', email: 'dir@acme.com', role: 'tenant_user', tenantId: 't-1', userRole: 'director',
}
const ADMIN_SESSION = { sub: 'sa-1', email: 'admin@hrms.com', role: 'super_admin' }

const USER   = { id: 'u-1', email: 'dir@acme.com', role: 'director', isActive: true, tenantId: 't-1' }
const TENANT = { id: 't-1', slug: 'acme', isActive: true }
const ADMIN  = { id: 'sa-1', email: 'admin@hrms.com', name: 'Super Admin', isActive: true }

beforeEach(() => {
  vi.resetAllMocks()
  mockSignToken.mockResolvedValue('new-token-xyz')
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh — session checks', () => {
  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST() as any
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/no active session/i)
    expect(mockSignToken).not.toHaveBeenCalled()
  })

  it('refuses to refresh a TOTP challenge token', async () => {
    mockGetSession.mockResolvedValue({ ...TENANT_SESSION, phase: 'totp' })
    const res = await POST() as any
    expect(res.status).toBe(401)
    expect(mockSignToken).not.toHaveBeenCalled()
  })

  it('returns 401 for a tenant session with no tenantId', async () => {
    mockGetSession.mockResolvedValue({ sub: 'u-1', email: 'a@b.com', role: 'tenant_user' })
    const res = await POST() as any
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthenticated')
  })
})

describe('POST /api/auth/refresh — tenant user', () => {
  it('returns 200, re-signs from fresh DB data and sets session + tenant_slug cookies', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockResolvedValueOnce([USER]).mockResolvedValueOnce([TENANT])

    const res = await POST() as any

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(mockSignToken).toHaveBeenCalledWith(expect.objectContaining({
      sub: 'u-1', role: 'tenant_user', tenantId: 't-1', tenantSlug: 'acme', userRole: 'director',
    }))
    expect(mockCookiesSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hrms_session', value: 'new-token-xyz' }),
    )
    expect(mockCookiesSet).toHaveBeenCalledWith('tenant_slug', 'acme', expect.any(Object))
  })

  it('picks up a role change made since the token was issued', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...USER, role: 'hr_officer' }]).mockResolvedValueOnce([TENANT])
    await POST()
    expect(mockSignToken).toHaveBeenCalledWith(expect.objectContaining({ userRole: 'hr_officer' }))
  })

  it('returns 403 and clears the cookie when the user is deactivated', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...USER, isActive: false }]).mockResolvedValueOnce([TENANT])
    const res = await POST() as any
    expect(res.status).toBe(403)
    expect(mockSignToken).not.toHaveBeenCalled()
    expect(mockCookiesSet).toHaveBeenCalledWith('hrms_session', '', { maxAge: 0, path: '/' })
  })

  it('returns 403 when the tenant is deactivated', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockResolvedValueOnce([USER]).mockResolvedValueOnce([{ ...TENANT, isActive: false }])
    const res = await POST() as any
    expect(res.status).toBe(403)
    expect(mockSignToken).not.toHaveBeenCalled()
  })

  it('returns 403 when the user no longer exists', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockResolvedValueOnce([]).mockResolvedValueOnce([TENANT])
    const res = await POST() as any
    expect(res.status).toBe(403)
  })

  it('returns 500 when the database fails', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION)
    mockWhere.mockRejectedValue(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST() as any
    expect(res.status).toBe(500)
  })
})

describe('POST /api/auth/refresh — super admin', () => {
  it('returns 200 and re-signs a super_admin token', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockWhere.mockResolvedValueOnce([ADMIN])
    const res = await POST() as any
    expect(res.status).toBe(200)
    expect(mockSignToken).toHaveBeenCalledWith(expect.objectContaining({ sub: 'sa-1', role: 'super_admin' }))
    expect(mockCookiesSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hrms_session', value: 'new-token-xyz' }),
    )
  })

  it('returns 403 and clears the cookie when the admin is deactivated', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...ADMIN, isActive: false }])
    const res = await POST() as any
    expect(res.status).toBe(403)
    expect(mockSignToken).not.toHaveBeenCalled()
    expect(mockCookiesSet).toHaveBeenCalledWith('hrms_session', '', { maxAge: 0, path: '/' })
  })
})
