/**
 * API route tests — /api/tenant/superannuation and /api/tenant/superannuation/contributions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse', body, status: init?.status ?? 200,
    }),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(() => undefined) })),
}))

const mockApiGuard = vi.fn()
vi.mock('@/lib/auth/apiGuard', () => ({
  apiGuard: (...a: unknown[]) => mockApiGuard(...a),
}))

const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()

function makeChain(): any {
  const c: any = {}
  ;['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset'].forEach(m => { c[m] = () => c })
  c.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: mockDbInsert })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  superannuationRecords: {},
  superannuationContributions: {},
  employees: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), gte: vi.fn(), lte: vi.fn(),
  desc: vi.fn(), asc: vi.fn(), count: vi.fn(),
}))

import { GET, POST } from '@/app/api/tenant/superannuation/route'
import { GET as GET_CONTRIBUTIONS, POST as POST_CONTRIBUTIONS } from '@/app/api/tenant/superannuation/contributions/route'
import { db } from '@/lib/db'

function makeReq(path = '/api/tenant/superannuation', opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL(`http://localhost${path}`)
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'payroll@acme.com', tenantId: 't-1', userRole: 'payroll_officer' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }

const SUPER_ROW = {
  id: 's-1', tenantId: 't-1', employeeId: 'e-1',
  fundName: 'AustralianSuper', memberNumber: 'MBR001',
  tfn: '123456789', createdAt: new Date().toISOString(),
}

const CONTRIB_ROW = {
  id: 'c-1', tenantId: 't-1', employeeId: 'e-1',
  dueDate: '2024-07-28', sgRate: '0.11',
  sgAmount: '550.00', totalContribution: '550.00',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(db.select).mockImplementation(() => makeChain())
  vi.mocked(db.insert).mockImplementation(() => ({
    values: vi.fn(() => ({ returning: mockDbInsert })),
  }) as any)
  mockDbSelect.mockResolvedValue([])
  mockDbInsert.mockResolvedValue([])
})

// ── Superannuation records ────────────────────────────────────────────────────

describe('GET /api/tenant/superannuation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with superannuation records', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([SUPER_ROW])
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
  })
})

describe('POST /api/tenant/superannuation', () => {
  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq('/api/tenant/superannuation', { body: {} })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful record creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([SUPER_ROW])
    const res = await POST(makeReq('/api/tenant/superannuation', {
      body: { employeeId: 'e-1', fundName: 'AustralianSuper', memberNumber: 'MBR001' },
    })) as any
    expect(res.status).toBe(201)
  })
})

// ── Contributions ─────────────────────────────────────────────────────────────

describe('GET /api/tenant/superannuation/contributions', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET_CONTRIBUTIONS(makeReq('/api/tenant/superannuation/contributions')) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with contribution records', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([CONTRIB_ROW])
    const res = await GET_CONTRIBUTIONS(makeReq('/api/tenant/superannuation/contributions')) as any
    expect(res.status).toBe(200)
  })
})

describe('POST /api/tenant/superannuation/contributions', () => {
  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST_CONTRIBUTIONS(makeReq('/api/tenant/superannuation/contributions', { body: {} })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful contribution creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([CONTRIB_ROW])
    const res = await POST_CONTRIBUTIONS(makeReq('/api/tenant/superannuation/contributions', {
      body: { employeeId: 'e-1', dueDate: '2024-07-28', sgRate: '0.11', sgAmount: '550.00', totalContribution: '550.00' },
    })) as any
    expect(res.status).toBe(201)
  })
})
