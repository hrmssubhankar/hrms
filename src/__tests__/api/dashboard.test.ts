/**
 * API route tests — GET /api/tenant/dashboard
 * src/app/api/tenant/dashboard/route.ts
 *
 * Strategy:
 *  - Mock getSession to simulate an authenticated YPC director
 *  - Mock @/lib/db to return controlled fixture data
 *  - Verify the response shape and guard behaviour
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse',
      body,
      status: init?.status ?? 200,
    }),
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

// Build a chainable mock: db.select().from().where().orderBy().limit() etc.
const mockQueryResult = vi.fn()

const chainable = new Proxy({}, {
  get: () => (..._args: unknown[]) => chainable,
}) as Record<string, (...args: unknown[]) => unknown>

// db.select() ultimately awaits the chain — so make it thenable
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'where', 'leftJoin', 'orderBy', 'limit', 'offset']
  methods.forEach(m => {
    chain[m] = () => chain
  })
  // Make it awaitable
  chain.then = (resolve: (v: unknown) => void, _reject: unknown) => Promise.resolve(resolveWith).then(resolve)
  return chain
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain([])),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:    vi.fn((_a, _b) => 'eq'),
  and:   vi.fn((..._args) => 'and'),
  gte:   vi.fn((_a, _b) => 'gte'),
  lte:   vi.fn((_a, _b) => 'lte'),
  lt:    vi.fn((_a, _b) => 'lt'),
  gt:    vi.fn((_a, _b) => 'gt'),
  count: vi.fn(() => 'count'),
  sum:   vi.fn(() => 'sum'),
  sql:   Object.assign(vi.fn(() => 'sql'), { raw: vi.fn(() => 'sql') }),
}))

import { GET } from '@/app/api/tenant/dashboard/route'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

const mockGetSession = vi.mocked(getSession)
const mockDb = vi.mocked(db)

const YPC_SESSION = {
  sub:        'user-ypc-001',
  email:      'director@yahwehpc.com.au',
  role:       'tenant_user' as const,
  tenantId:   '00000000-0000-0000-0000-000000000002',
  tenantSlug: 'yahwehpc',
  userRole:   'director',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: all queries return empty arrays / empty aggregate rows
  mockDb.select = vi.fn(() => makeChain([]) as any)
})

// ── Guard tests ────────────────────────────────────────────────────────────────

describe('GET /api/tenant/dashboard — guards', () => {
  it('returns 401 when no session', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET() as any
    expect(res.status).toBe(401)
  })

  it('returns 403 when employee (no payroll:read)', async () => {
    mockGetSession.mockResolvedValue({ ...YPC_SESSION, userRole: 'employee' } as any)
    const res = await GET() as any
    expect(res.status).toBe(403)
  })

  it('returns 403 when hr_officer (no payroll:read)', async () => {
    mockGetSession.mockResolvedValue({ ...YPC_SESSION, userRole: 'hr_officer' } as any)
    const res = await GET() as any
    expect(res.status).toBe(403)
  })
})

// ── Shape tests ────────────────────────────────────────────────────────────────

describe('GET /api/tenant/dashboard — response shape', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(YPC_SESSION as any)
  })

  it('returns 200 with all top-level keys present', async () => {
    const res = await GET() as any
    expect(res.status).toBe(200)
    const body = res.body
    expect(body).toHaveProperty('headcount')
    expect(body).toHaveProperty('payroll')
    expect(body).toHaveProperty('leave')
    expect(body).toHaveProperty('holidays')
    expect(body).toHaveProperty('documents')
    expect(body).toHaveProperty('incidents')
    expect(body).toHaveProperty('compliance')
    expect(body).toHaveProperty('generatedAt')
  })

  it('headcount defaults to zeros when DB is empty', async () => {
    const res = await GET() as any
    expect(res.body.headcount.total).toBe(0)
    expect(res.body.headcount.active).toBe(0)
    expect(res.body.headcount.newThisMonth).toBe(0)
  })

  it('payroll defaults to zero strings when DB is empty', async () => {
    const res = await GET() as any
    expect(res.body.payroll.ytdGross).toBe('0.00')
    expect(res.body.payroll.ytdNet).toBe('0.00')
    expect(res.body.payroll.ytdSuper).toBe('0.00')
  })

  it('leave pendingCount defaults to 0 when DB is empty', async () => {
    const res = await GET() as any
    expect(res.body.leave.pendingCount).toBe(0)
  })

  it('generatedAt is a valid ISO date string', async () => {
    const res = await GET() as any
    expect(() => new Date(res.body.generatedAt)).not.toThrow()
    expect(new Date(res.body.generatedAt).toISOString()).toBe(res.body.generatedAt)
  })

  it('holidays.upcoming is an array', async () => {
    const res = await GET() as any
    expect(Array.isArray(res.body.holidays.upcoming)).toBe(true)
  })
})

// ── Payroll officer can also access dashboard ──────────────────────────────────

describe('GET /api/tenant/dashboard — payroll_officer access', () => {
  it('allows payroll_officer who has payroll:read', async () => {
    mockGetSession.mockResolvedValue({ ...YPC_SESSION, userRole: 'payroll_officer' } as any)
    const res = await GET() as any
    expect(res.status).toBe(200)
  })
})
