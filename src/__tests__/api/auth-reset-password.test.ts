/**
 * API route tests — GET & POST /api/auth/reset-password
 * src/app/api/auth/reset-password/route.ts
 *
 * GET  ?token=xxx  — validates token without consuming it
 * POST { token, password } — resets password; calls bcrypt.hash
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    _body: unknown
    constructor(url = 'https://app.test/') { this.nextUrl = new URL(url) }
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
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
  eq:  vi.fn(() => 'eq'),
  and: vi.fn(() => 'and'),
  gt:  vi.fn(() => 'gt'),
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-pw-abc') },
}))

import { GET, POST } from '@/app/api/auth/reset-password/route'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

const mockDb     = vi.mocked(db)
const mockBcrypt = vi.mocked(bcrypt)

function makePostReq(body: unknown) {
  const r = new NextRequest('https://app.test/api/auth/reset-password') as any
  r._body = body
  return r
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select = vi.fn(() => makeSelectChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain() as any)
  ;(mockBcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('hashed-pw-abc')
})

// ── GET — token validation (no DB side-effects) ────────────────────────────────

describe('GET /api/auth/reset-password', () => {
  it('returns { valid: false } when token param is absent', async () => {
    const req = new NextRequest('https://app.test/api/auth/reset-password') as any
    const res = await GET(req) as any
    expect(res.body.valid).toBe(false)
  })

  it('returns { valid: false } when token not found in DB', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const req = new NextRequest('https://app.test/api/auth/reset-password?token=badtoken') as any
    const res = await GET(req) as any
    expect(res.body.valid).toBe(false)
  })

  it('returns { valid: true } when a matching, non-expired token is found', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'user-1' }]) as any)
    const req = new NextRequest('https://app.test/api/auth/reset-password?token=validtoken') as any
    const res = await GET(req) as any
    expect(res.body.valid).toBe(true)
  })
})

// ── POST — password reset ──────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  it('returns 400 when token is missing', async () => {
    const res = await POST(makePostReq({ password: 'newpassword1' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makePostReq({ token: 'tok' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 422 when password is shorter than 8 characters', async () => {
    const res = await POST(makePostReq({ token: 'tok', password: 'short' })) as any
    expect(res.status).toBe(422)
  })

  it('returns 400 when token not found or expired', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await POST(makePostReq({ token: 'badtok', password: 'longpassword1' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid or has expired/i)
  })

  it('returns 403 when the user account is inactive', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'u1', isActive: false }]) as any)
    const res = await POST(makePostReq({ token: 'tok', password: 'longpassword1' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 200 and ok:true on success', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'u1', isActive: true }]) as any)
    const res = await POST(makePostReq({ token: 'validtok', password: 'newpassword1' })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('calls bcrypt.hash with the new password and cost 12', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'u1', isActive: true }]) as any)
    await POST(makePostReq({ token: 'validtok', password: 'newpassword1' }))
    expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword1', 12)
  })

  it('calls db.update to persist the hashed password and clear the token', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ id: 'u1', isActive: true }]) as any)
    await POST(makePostReq({ token: 'validtok', password: 'newpassword1' }))
    expect(mockDb.update).toHaveBeenCalled()
  })
})
