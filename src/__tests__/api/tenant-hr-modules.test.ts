/**
 * API route tests — grouped HR module routes
 * Covers: supervision, toil, benefits, engagement, experience,
 *         referrals, workforce-planning, promotions, competencies
 *
 * Each module follows the same CRUD pattern so we test the common
 * auth / validation / success contract rather than repeating per-field logic.
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
const mockDbUpdate = vi.fn()

function makeChain(): any {
  const c: any = {}
  ;['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'limit', 'offset', 'set'].forEach(m => { c[m] = () => c })
  c.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: mockDbInsert })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: mockDbUpdate })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  supervisionRecords: {},
  toilEntries: {},
  toilBalances: {},
  employeeBenefits: {},
  surveys: {},
  surveyResponses: {},
  employeeExperience: {},
  referrals: {},
  headcountPlan: {},
  promotionRequests: {},
  promotionEvents: {},
  competencies: {},
  competencyAssessments: {},
  employees: {},
  departments: {},
  positions: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), gte: vi.fn(), lte: vi.fn(),
  desc: vi.fn(), asc: vi.fn(), count: vi.fn(), ilike: vi.fn(),
  sql: (..._args: any[]) => ({ as: () => null }),
}))

import { db } from '@/lib/db'

function makeReq(path: string, opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL(`http://localhost${path}`)
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, url: url.toString(), json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'hr@acme.com', tenantId: 't-1', userRole: 'hr_officer' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(db.select).mockImplementation(() => makeChain())
  vi.mocked(db.insert).mockImplementation(() => ({
    values: vi.fn(() => ({ returning: mockDbInsert })),
  }) as any)
  vi.mocked(db.update).mockImplementation(() => ({
    set: vi.fn(() => ({ where: mockDbUpdate })),
  }) as any)
  mockDbSelect.mockResolvedValue([])
  mockDbInsert.mockResolvedValue([])
  mockDbUpdate.mockResolvedValue([])
})

// ── Helper: test any GET list route ──────────────────────────────────────────

async function testGetList(importFn: () => Promise<{ GET: Function }>, path: string) {
  const { GET } = await importFn()

  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq(path)) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with data list', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([{ id: '1' }])
    const res = await GET(makeReq(path)) as any
    expect(res.status).toBe(200)
  })
}

// ── Supervision ───────────────────────────────────────────────────────────────

describe('GET /api/tenant/supervision', async () => {
  await testGetList(() => import('@/app/api/tenant/supervision/route'), '/api/tenant/supervision')
})

describe('POST /api/tenant/supervision', async () => {
  const { POST } = await import('@/app/api/tenant/supervision/route')

  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq('/api/tenant/supervision')) as any
    expect(res.status).toBe(401)
  })

  it('returns 201 on successful creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([{ id: 'sv-1' }])
    const res = await POST(makeReq('/api/tenant/supervision', {
      body: { employeeId: 'e-1', supervisorId: 'e-2', scheduledDate: '2024-08-01' },
    })) as any
    expect([200, 201]).toContain(res.status)
  })
})

// ── TOIL ──────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/toil', async () => {
  await testGetList(() => import('@/app/api/tenant/toil/route'), '/api/tenant/toil')
})

describe('POST /api/tenant/toil', async () => {
  const { POST } = await import('@/app/api/tenant/toil/route')

  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq('/api/tenant/toil')) as any
    expect(res.status).toBe(401)
  })

  it('returns 201 on successful TOIL request', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([{ id: 'toil-1' }])
    const res = await POST(makeReq('/api/tenant/toil', {
      body: { employeeId: 'e-1', hours: 4, workDate: '2024-07-20' },
    })) as any
    expect([200, 201]).toContain(res.status)
  })
})

// ── Benefits ──────────────────────────────────────────────────────────────────

describe('GET /api/tenant/benefits', async () => {
  await testGetList(() => import('@/app/api/tenant/benefits/route'), '/api/tenant/benefits')
})

// ── Engagement ────────────────────────────────────────────────────────────────

describe('GET /api/tenant/engagement', async () => {
  await testGetList(() => import('@/app/api/tenant/engagement/route'), '/api/tenant/engagement')
})

// ── Experience ────────────────────────────────────────────────────────────────

describe('GET /api/tenant/experience', async () => {
  await testGetList(() => import('@/app/api/tenant/experience/route'), '/api/tenant/experience')
})

// ── Referrals ─────────────────────────────────────────────────────────────────

describe('GET /api/tenant/referrals', async () => {
  await testGetList(() => import('@/app/api/tenant/referrals/route'), '/api/tenant/referrals')
})

// ── Workforce Planning ────────────────────────────────────────────────────────

describe('GET /api/tenant/workforce-planning', async () => {
  await testGetList(() => import('@/app/api/tenant/workforce-planning/route'), '/api/tenant/workforce-planning')
})

// ── Promotions ────────────────────────────────────────────────────────────────

describe('GET /api/tenant/promotions', async () => {
  await testGetList(() => import('@/app/api/tenant/promotions/route'), '/api/tenant/promotions')
})

describe('POST /api/tenant/promotions', async () => {
  const { POST } = await import('@/app/api/tenant/promotions/route')

  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq('/api/tenant/promotions')) as any
    expect(res.status).toBe(401)
  })

  it('returns 201 on successful promotion creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValueOnce([{ id: 'e-1', firstName: 'Alice', lastName: 'Smith' }])
    mockDbInsert.mockResolvedValue([{ id: 'promo-1' }])
    const res = await POST(makeReq('/api/tenant/promotions', {
      body: {
        employeeId: 'e-1', proposedTitle: 'Senior Dev',
        justification: 'Strong performance and team lead responsibilities',
      },
    })) as any
    expect([200, 201]).toContain(res.status)
  })
})

// ── Competencies ──────────────────────────────────────────────────────────────

describe('GET /api/tenant/competencies', async () => {
  await testGetList(() => import('@/app/api/tenant/competencies/route'), '/api/tenant/competencies')
})
