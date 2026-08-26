/**
 * API route tests — TOTP setup + status
 * src/app/api/auth/totp/setup/route.ts  (GET + POST)
 * src/app/api/auth/totp/status/route.ts (GET)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    _body: unknown
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }))

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

vi.mock('otplib', () => ({
  generateSecret: vi.fn(() => 'MOCKSECRETBASE32'),
  generateURI:    vi.fn(() => 'otpauth://totp/Yahweh%20HRMS:test@example.com?secret=MOCK'),
  verifySync:     vi.fn(() => ({ valid: true })),
}))

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,MOCKQR') },
}))

import { GET as setupGET, POST as setupPOST } from '@/app/api/auth/totp/setup/route'
import { GET as statusGET } from '@/app/api/auth/totp/status/route'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { verifySync } from 'otplib'
import { NextRequest } from 'next/server'

const mockGetSession  = vi.mocked(getSession)
const mockDb          = vi.mocked(db)
const mockVerifySync  = vi.mocked(verifySync)

const TENANT_SESSION = {
  sub: 'user-001', email: 'user@example.com',
  role: 'tenant_user' as const,
  tenantId: 'tid-001', userRole: 'director',
}
const SUPER_SESSION = {
  sub: 'sa-001', email: 'sa@yahweh.com',
  role: 'super_admin' as const,
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
})

// ── totp/setup — GET ───────────────────────────────────────────────────────────

describe('GET /api/auth/totp/setup', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await setupGET() as any
    expect(res.status).toBe(401)
  })

  it('returns 403 for super_admin (TOTP is tenant-only)', async () => {
    mockGetSession.mockResolvedValue(SUPER_SESSION as any)
    const res = await setupGET() as any
    expect(res.status).toBe(403)
  })

  it('returns secret and qrCodeDataUrl for an authenticated tenant user', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    const res = await setupGET() as any
    expect(res.status).toBe(200)
    expect(typeof res.body.secret).toBe('string')
    expect(res.body.qrCodeDataUrl).toMatch(/^data:image/)
  })
})

// ── totp/setup — POST ──────────────────────────────────────────────────────────

describe('POST /api/auth/totp/setup', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await setupPOST(makeReq({})) as any
    expect(res.status).toBe(401)
  })

  it('returns 403 for super_admin', async () => {
    mockGetSession.mockResolvedValue(SUPER_SESSION as any)
    const res = await setupPOST(makeReq({ secret: 'S', code: '123456' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when secret is missing', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    const res = await setupPOST(makeReq({ code: '123456' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 400 when code is missing', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    const res = await setupPOST(makeReq({ secret: 'MYSECRET' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 400 when TOTP code is invalid', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    mockVerifySync.mockReturnValue({ valid: false } as any)
    const res = await setupPOST(makeReq({ secret: 'SECRET', code: '000000' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid code/i)
  })

  it('returns 200 and ok:true when code verifies correctly', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    mockVerifySync.mockReturnValue({ valid: true } as any)
    const res = await setupPOST(makeReq({ secret: 'SECRET', code: '123456' })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('persists TOTP secret to DB on success', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    await setupPOST(makeReq({ secret: 'SECRET', code: '123456' }))
    expect(mockDb.update).toHaveBeenCalled()
  })
})

// ── totp/status — GET ─────────────────────────────────────────────────────────

describe('GET /api/auth/totp/status', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await statusGET() as any
    expect(res.status).toBe(401)
  })

  it('returns totpEnabled:false for super_admin (no TOTP column)', async () => {
    mockGetSession.mockResolvedValue(SUPER_SESSION as any)
    const res = await statusGET() as any
    expect(res.status).toBe(200)
    expect(res.body.totpEnabled).toBe(false)
  })

  it('returns totpEnabled:false when user has not set up 2FA', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    mockDb.select = vi.fn(() => makeSelectChain([{ totpEnabled: false }]) as any)
    const res = await statusGET() as any
    expect(res.body.totpEnabled).toBe(false)
  })

  it('returns totpEnabled:true when 2FA is active', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    mockDb.select = vi.fn(() => makeSelectChain([{ totpEnabled: true }]) as any)
    const res = await statusGET() as any
    expect(res.body.totpEnabled).toBe(true)
  })

  it('defaults to totpEnabled:false when user row is not found', async () => {
    mockGetSession.mockResolvedValue(TENANT_SESSION as any)
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await statusGET() as any
    expect(res.body.totpEnabled).toBe(false)
  })
})
