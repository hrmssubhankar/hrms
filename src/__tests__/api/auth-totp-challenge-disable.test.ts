/**
 * API route tests — TOTP challenge + disable
 * src/app/api/auth/totp/challenge/route.ts  (POST)
 * src/app/api/auth/totp/disable/route.ts    (POST)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    _body: unknown
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      body,
      status: init?.status ?? 200,
      cookies: { set: vi.fn() },
    }),
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession:           vi.fn(),
  sessionCookieOptions: vi.fn(() => ({ name: 'session', value: 'full-token', httpOnly: true })),
}))

vi.mock('@/lib/auth/jwt', () => ({
  verifyToken: vi.fn(),
  signToken:   vi.fn().mockResolvedValue('full-session-token'),
}))

vi.mock('otplib', () => ({
  verifySync: vi.fn(() => ({ valid: true })),
}))

function makeSelectChain(data: unknown) {
  const c: Record<string, unknown> = {}
  ;['from', 'where', 'limit'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

function makeUpdateChain() {
  const c: Record<string, unknown> = {}
  ;['set', 'where'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(undefined).then(resolve)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeSelectChain([])),
    update: vi.fn(() => makeUpdateChain()),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
}))

import { POST as challengePOST } from '@/app/api/auth/totp/challenge/route'
import { POST as disablePOST   } from '@/app/api/auth/totp/disable/route'
import { getSession }             from '@/lib/auth/session'
import { verifyToken, signToken } from '@/lib/auth/jwt'
import { verifySync }             from 'otplib'
import { db }                     from '@/lib/db'
import { NextRequest }            from 'next/server'

const mockGetSession  = vi.mocked(getSession)
const mockVerifyToken = vi.mocked(verifyToken)
const mockSignToken   = vi.mocked(signToken)
const mockVerifySync  = vi.mocked(verifySync)
const mockDb          = vi.mocked(db)

const TOTP_PAYLOAD = {
  sub:        'user-001',
  email:      'user@example.com',
  role:       'tenant_user' as const,
  tenantId:   'tid-001',
  userRole:   'director',
  phase:      'totp' as const,
}
const USER_WITH_TOTP = { id: 'user-001', totpSecret: 'MYSECRET', totpEnabled: true }
const FULL_SESSION   = {
  sub: 'user-001', email: 'user@example.com',
  role: 'tenant_user' as const, tenantId: 'tid-001', userRole: 'director',
}

function makeReq(body: unknown) {
  const r = new NextRequest() as any
  r._body = body
  return r
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select = vi.fn(() => makeSelectChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain() as any)
  mockVerifySync.mockReturnValue({ valid: true } as any)
  mockSignToken.mockResolvedValue('full-session-token')
})

// ── POST /api/auth/totp/challenge ──────────────────────────────────────────────

describe('POST /api/auth/totp/challenge', () => {
  it('returns 400 when tempToken is missing', async () => {
    const res = await challengePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 400 when code is missing', async () => {
    const res = await challengePOST(makeReq({ tempToken: 'tok' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 401 when verifyToken returns null (expired/invalid token)', async () => {
    mockVerifyToken.mockResolvedValue(null)
    const res = await challengePOST(makeReq({ tempToken: 'badtok', code: '123456' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 401 when token has no phase:totp claim', async () => {
    mockVerifyToken.mockResolvedValue({ ...TOTP_PAYLOAD, phase: undefined } as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when 2FA is not configured for the user', async () => {
    mockVerifyToken.mockResolvedValue(TOTP_PAYLOAD as any)
    // user found but totpEnabled=false
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'u1', totpSecret: null, totpEnabled: false }]) as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not configured/i)
  })

  it('returns 400 when user row not found', async () => {
    mockVerifyToken.mockResolvedValue(TOTP_PAYLOAD as any)
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 400 when TOTP code is invalid', async () => {
    mockVerifyToken.mockResolvedValue(TOTP_PAYLOAD as any)
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    mockVerifySync.mockReturnValue({ valid: false } as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '000000' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid code/i)
  })

  it('returns 200 with ok:true and redirectTo on success', async () => {
    mockVerifyToken.mockResolvedValue(TOTP_PAYLOAD as any)
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    mockVerifySync.mockReturnValue({ valid: true } as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(typeof res.body.redirectTo).toBe('string')
  })

  it('sets a session cookie on success', async () => {
    mockVerifyToken.mockResolvedValue(TOTP_PAYLOAD as any)
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.cookies.set).toHaveBeenCalled()
  })

  it('redirects super_admin to /super-admin', async () => {
    mockVerifyToken.mockResolvedValue({ ...TOTP_PAYLOAD, role: 'super_admin' } as any)
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    const res = await challengePOST(makeReq({ tempToken: 'tok', code: '123456' })) as any
    expect(res.body.redirectTo).toBe('/super-admin')
  })
})

// ── POST /api/auth/totp/disable ────────────────────────────────────────────────

describe('POST /api/auth/totp/disable', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(FULL_SESSION as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 401 when session still has phase:totp (not yet fully authenticated)', async () => {
    mockGetSession.mockResolvedValue({ ...FULL_SESSION, phase: 'totp' } as any)
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 403 for super_admin', async () => {
    mockGetSession.mockResolvedValue({ ...FULL_SESSION, role: 'super_admin' } as any)
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when code is missing', async () => {
    const res = await disablePOST(makeReq({})) as any
    expect(res.status).toBe(400)
  })

  it('returns 404 when user record not found', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(404)
  })

  it('returns 400 when 2FA is not enabled on the account', async () => {
    mockDb.select = vi.fn(() =>
      makeSelectChain([{ id: 'u1', totpSecret: null, totpEnabled: false }]) as any
    )
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not enabled/i)
  })

  it('returns 400 when the TOTP code is wrong', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    mockVerifySync.mockReturnValue({ valid: false } as any)
    const res = await disablePOST(makeReq({ code: '000000' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 200 and ok:true on success', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    mockVerifySync.mockReturnValue({ valid: true } as any)
    const res = await disablePOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('clears the TOTP secret from DB on success', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([USER_WITH_TOTP]) as any)
    await disablePOST(makeReq({ code: '123456' }))
    expect(mockDb.update).toHaveBeenCalled()
  })
})
