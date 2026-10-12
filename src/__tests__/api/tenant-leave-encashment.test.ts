/**
 * API route tests — GET & POST /api/tenant/separation/leave-encashment
 *
 * Tests focus on:
 *  - Auth guard (401/403)
 *  - Ineligible employment types (casual/contract)
 *  - Eligible employee: accrual calculation + payout
 *  - POST with confirm=true records an audit event
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
  },
}))

vi.mock('@/lib/db/schema', () => ({
  separationRecords: {},
  separationEvents:  {},
  employees:         {},
  leaveRequests:     {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), gte: vi.fn(), lte: vi.fn(), inArray: vi.fn(),
}))

import { GET, POST } from '@/app/api/tenant/separation/leave-encashment/route'
import { db } from '@/lib/db'

function makeReq(opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL('http://localhost/api/tenant/separation/leave-encashment')
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'hr@acme.com', tenantId: 't-1', userRole: 'hr_officer' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }

const SEP_RECORD = {
  id: 'sep-1', tenantId: 't-1', employeeId: 'e-1', lastWorkingDay: '2024-06-30',
}

const FT_EMPLOYEE = {
  id: 'e-1', firstName: 'Alice', lastName: 'Smith',
  employmentType: 'full_time', startDate: '2023-01-01',
  ordinaryHoursPerWeek: '38', hourlyRate: '30.00',
}

const CASUAL_EMPLOYEE = {
  id: 'e-2', firstName: 'Bob', lastName: 'Jones',
  employmentType: 'casual', startDate: '2023-06-01',
  ordinaryHoursPerWeek: '20', hourlyRate: '28.00',
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

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/separation/leave-encashment', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq({ searchParams: { separationId: 'sep-1' } })) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when separationId is missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/separationId/i)
  })

  it('returns 404 when separation record not found', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValueOnce([])  // separation lookup → empty
    const res = await GET(makeReq({ searchParams: { separationId: 'sep-999' } })) as any
    expect(res.status).toBe(404)
  })

  it('returns eligible=false for casual employee', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect
      .mockResolvedValueOnce([SEP_RECORD])        // separation record
      .mockResolvedValueOnce([CASUAL_EMPLOYEE])    // employee record
      .mockResolvedValueOnce([])                   // leave taken
    const res = await GET(makeReq({ searchParams: { separationId: 'sep-1' } })) as any
    expect(res.status).toBe(200)
    expect(res.body.eligible).toBe(false)
  })

  it('returns eligible=true with payout for full-time employee', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect
      .mockResolvedValueOnce([SEP_RECORD])
      .mockResolvedValueOnce([FT_EMPLOYEE])
      .mockResolvedValueOnce([])            // no leave taken
    const res = await GET(makeReq({ searchParams: { separationId: 'sep-1' } })) as any
    expect(res.status).toBe(200)
    expect(res.body.eligible).toBe(true)
    expect(typeof res.body.payoutAmount).toBe('number')
    expect(res.body.payoutAmount).toBeGreaterThan(0)
    // payout must include 17.5% loading: ordinaryPay × 1.175
    expect(res.body.loadingAmount).toBeGreaterThan(0)
  })

  it('payout is zero when all leave has been taken', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    // Simulate employee who has taken MORE leave than accrued
    mockDbSelect
      .mockResolvedValueOnce([SEP_RECORD])
      .mockResolvedValueOnce([FT_EMPLOYEE])
      .mockResolvedValueOnce([{ totalDays: 200 }])   // 200 days taken >> accrued
    const res = await GET(makeReq({ searchParams: { separationId: 'sep-1' } })) as any
    expect(res.body.eligible).toBe(true)
    expect(res.body.remainingHours).toBe(0)
    expect(res.body.payoutAmount).toBe(0)
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/tenant/separation/leave-encashment', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq({ body: { separationId: 'sep-1' } })) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when separationId is missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq({ body: {} })) as any
    expect(res.status).toBe(400)
  })

  it('returns 200 (preview) when confirm is false/absent', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect
      .mockResolvedValueOnce([SEP_RECORD])
      .mockResolvedValueOnce([FT_EMPLOYEE])
      .mockResolvedValueOnce([])
    const res = await POST(makeReq({ body: { separationId: 'sep-1' } })) as any
    expect(res.status).toBe(200)
    expect(res.body.confirmed).toBe(false)
    expect(res.body.eligible).toBe(true)
  })

  it('returns 201 and records audit event when confirm=true', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect
      .mockResolvedValueOnce([SEP_RECORD])
      .mockResolvedValueOnce([FT_EMPLOYEE])
      .mockResolvedValueOnce([])
    mockDbInsert.mockResolvedValue([{ id: 'ev-1' }])
    const res = await POST(makeReq({ body: { separationId: 'sep-1', confirm: true } })) as any
    expect(res.status).toBe(201)
    expect(res.body.confirmed).toBe(true)
    // Verify the insert was called (audit event)
    expect(db.insert).toHaveBeenCalled()
  })
})
