/**
 * API route tests — /api/tenant/salary-reviews and /api/tenant/salary-reviews/[id]
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
  ;['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset'].forEach(m => { c[m] = () => c })
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
  salaryReviews: {},
  employees:     {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), desc: vi.fn(), asc: vi.fn(),
}))

import { GET, POST } from '@/app/api/tenant/salary-reviews/route'
import { GET as GET_ONE, PATCH, DELETE } from '@/app/api/tenant/salary-reviews/[id]/route'
import { db } from '@/lib/db'

function makeReq(path: string, opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL(`http://localhost${path}`)
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'hr@acme.com', tenantId: 't-1', userRole: 'hr_officer' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }

const REVIEW = {
  id: 'sr-1', tenantId: 't-1', employeeId: 'e-1',
  reviewDate: '2024-07-01', previousSalary: '70000', newSalary: '75000',
  percentageIncrease: '7.14', status: 'approved',
}

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

// ── List ──────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/salary-reviews', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq('/api/tenant/salary-reviews')) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with salary reviews', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([REVIEW])
    const res = await GET(makeReq('/api/tenant/salary-reviews')) as any
    expect(res.status).toBe(200)
  })
})

// ── Create ────────────────────────────────────────────────────────────────────

describe('POST /api/tenant/salary-reviews', () => {
  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq('/api/tenant/salary-reviews', { body: {} })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([REVIEW])
    const res = await POST(makeReq('/api/tenant/salary-reviews', {
      body: {
        employeeId: 'e-1', reviewDate: '2024-07-01',
        previousSalary: '70000', newSalary: '75000',
      },
    })) as any
    expect(res.status).toBe(201)
  })
})

// ── Single record ─────────────────────────────────────────────────────────────

describe('GET /api/tenant/salary-reviews/[id]', () => {
  it('returns 404 when not found', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([])
    const res = await GET_ONE(makeReq('/api/tenant/salary-reviews/sr-1'), { params: Promise.resolve({ id: 'sr-1' }) }) as any
    expect(res.status).toBe(404)
  })

  it('returns 200 when found', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([REVIEW])
    const res = await GET_ONE(makeReq('/api/tenant/salary-reviews/sr-1'), { params: Promise.resolve({ id: 'sr-1' }) }) as any
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/tenant/salary-reviews/[id]', () => {
  it('returns 200 on successful update', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbUpdate.mockResolvedValue([{ ...REVIEW, status: 'approved' }])
    const res = await PATCH(makeReq('/api/tenant/salary-reviews/sr-1', { body: { status: 'approved' } }), { params: Promise.resolve({ id: 'sr-1' }) }) as any
    expect(res.status).toBe(200)
  })
})
