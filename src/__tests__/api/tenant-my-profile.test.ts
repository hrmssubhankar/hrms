/**
 * API route tests — GET & PATCH /api/tenant/my-profile
 * src/app/api/tenant/my-profile/route.ts
 *
 * Uses apiAuth() (authentication-only guard, no permission check).
 * All authenticated tenant users can view/edit their own profile.
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

vi.mock('@/lib/auth/apiGuard', () => ({
  apiAuth:  vi.fn(),
  apiGuard: vi.fn(),
}))

function makeSelectChain(data: unknown) {
  const c: Record<string, unknown> = {}
  ;['from', 'where', 'leftJoin', 'orderBy', 'limit'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

function makeUpdateChain(data: unknown = []) {
  const c: Record<string, unknown> = {}
  ;['set', 'where', 'returning'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeSelectChain([])),
    update: vi.fn(() => makeUpdateChain([])),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:  vi.fn(() => 'eq'),
  and: vi.fn(() => 'and'),
}))

import { GET, PATCH } from '@/app/api/tenant/my-profile/route'
import { apiAuth } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockApiAuth = vi.mocked(apiAuth)
const mockDb      = vi.mocked(db)

const SESSION = {
  sub: 'user-001', email: 'emp@test.com',
  role: 'tenant_user' as const,
  tenantId: 'tid-001', userRole: 'employee',
}

const GUARD_OK   = { error: null, session: SESSION }
const GUARD_401  = {
  error: { body: { error: 'Unauthenticated' }, status: 401 },
  session: null,
}

function makeReq(body: unknown) {
  const r = new NextRequest() as any
  r._body = body
  return r
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApiAuth.mockResolvedValue(GUARD_OK as any)
  mockDb.select = vi.fn(() => makeSelectChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain([]) as any)
})

// ── GET /api/tenant/my-profile ─────────────────────────────────────────────────

describe('GET /api/tenant/my-profile', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiAuth.mockResolvedValue(GUARD_401 as any)
    const res = await GET() as any
    expect(res.status).toBe(401)
  })

  it('returns employeeLinked:false when no employee record is linked to the account', async () => {
    // first select (employee lookup) → [], second (emergency contacts) is never reached
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await GET() as any
    expect(res.status).toBe(200)
    expect(res.body.employeeLinked).toBe(false)
    expect(res.body.profile).toBeNull()
  })

  it('returns profile and emergencyContacts when employee is found', async () => {
    const emp = { id: 'emp-1', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', isActive: true }
    const contacts = [{ id: 'ec-1', name: 'Dad', phone: '0411000000', relationship: 'Parent' }]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([emp]) as any)   // employee query
      .mockReturnValueOnce(makeSelectChain(contacts) as any) // emergency contacts
    const res = await GET() as any
    expect(res.status).toBe(200)
    expect(res.body.employeeLinked).toBe(true)
    expect(res.body.profile.firstName).toBe('Jane')
    expect(res.body.emergencyContacts).toHaveLength(1)
    expect(res.body.emergencyContacts[0].name).toBe('Dad')
  })
})

// ── PATCH /api/tenant/my-profile ──────────────────────────────────────────────

describe('PATCH /api/tenant/my-profile', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiAuth.mockResolvedValue(GUARD_401 as any)
    const res = await PATCH(makeReq({ phone: '0400000000' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 404 when no employee profile is linked to the account', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await PATCH(makeReq({ phone: '0412345678' })) as any
    expect(res.status).toBe(404)
  })

  it('returns 200 with the updated profile on success', async () => {
    const emp     = { id: 'emp-1' }
    const updated = { id: 'emp-1', phone: '0412345678', preferredName: 'Jay', address: null, photoUrl: null }
    mockDb.select = vi.fn(() => makeSelectChain([emp]) as any)
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await PATCH(makeReq({ phone: '0412345678', preferredName: 'Jay' })) as any
    expect(res.status).toBe(200)
    expect(res.body.profile.phone).toBe('0412345678')
    expect(res.body.profile.preferredName).toBe('Jay')
  })

  it('calls db.update to persist changes', async () => {
    const emp = { id: 'emp-1' }
    mockDb.select = vi.fn(() => makeSelectChain([emp]) as any)
    mockDb.update = vi.fn(() => makeUpdateChain([emp]) as any)
    await PATCH(makeReq({ phone: '0412345678' }))
    expect(mockDb.update).toHaveBeenCalled()
  })
})
