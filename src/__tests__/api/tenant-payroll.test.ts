/**
 * API route tests — GET, POST, PATCH /api/tenant/payroll
 * src/app/api/tenant/payroll/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Next.js stubs ─────────────────────────────────────────────────────────────

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

// ── Auth / guard stubs ────────────────────────────────────────────────────────

const mockApiGuard = vi.fn()
vi.mock('@/lib/auth/apiGuard', () => ({
  apiGuard: (...a: unknown[]) => mockApiGuard(...a),
}))

// ── Payroll calculator stub ───────────────────────────────────────────────────

const BREAKDOWN = {
  grossPay: 3000, paygWithholding: 600, medicareLevy: 60,
  superContribution: 330, netPay: 2010,
}

vi.mock('@/lib/payroll/calculator', () => ({
  calculatePayroll: vi.fn(() => BREAKDOWN),
  grossFromHours:   vi.fn((h: number, r: number) => h * r),
  grossFromSalary:  vi.fn((s: number) => s / 26),
}))

// ── Notification / email stubs ────────────────────────────────────────────────

vi.mock('@/lib/notifications/notify', () => ({
  notify:     vi.fn(),
  notifyRole: vi.fn(),
}))

vi.mock('@/lib/email/emailHelper', () => ({
  getTenantEmailCtx: vi.fn().mockResolvedValue({ notify: { emailPayroll: false } }),
  fireEmail:         vi.fn(),
}))

vi.mock('@/lib/email/templates', () => ({
  payslipReadyEmail: vi.fn().mockReturnValue({ subject: '', html: '' }),
}))

// ── DB stubs ──────────────────────────────────────────────────────────────────

const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()
const mockDbUpdateReturning = vi.fn()

function makeSelectChain(): any {
  const chain: any = {}
  ;['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset'].forEach(m => {
    chain[m] = () => chain
  })
  chain.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return chain
}

function makeUpdateChain(): any {
  return {
    set: vi.fn(() => ({
      where: vi.fn(() => ({ returning: mockDbUpdateReturning })),
    })),
  }
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: mockDbInsert })),
    })),
    update: vi.fn(() => makeUpdateChain()),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  payrollRecords: {},
  employees:      {},
  tenants:        {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), or: vi.fn(),
  desc: vi.fn(), asc: vi.fn(),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { GET, POST, PATCH } from '@/app/api/tenant/payroll/route'
import { db } from '@/lib/db'
import { calculatePayroll, grossFromHours, grossFromSalary } from '@/lib/payroll/calculator'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeReq(opts: {
  searchParams?: Record<string, string>
  body?: unknown
} = {}): any {
  const url = new URL('http://localhost/api/tenant/payroll')
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const BASE_SESSION = {
  sub: 'u-1', email: 'pay@acme.com',
  role: 'tenant_user' as const, tenantId: 't-1',
}

const GUARD_OK = { error: null, session: { ...BASE_SESSION, userRole: 'payroll_officer' } }
const GUARD_401 = {
  error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 },
  session: null,
}

const PAYROLL_ROW = {
  id: 'pr-1', employeeId: 'e-1',
  periodStart: '2024-02-01', periodEnd: '2024-02-14',
  grossPay: '3000.00', netPay: '2010.00',
  superContribution: '330.00', status: 'pending',
  exportedToXero: false,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(db.select).mockImplementation(() => makeSelectChain())
  vi.mocked(db.insert).mockImplementation(() => ({
    values: vi.fn(() => ({ returning: mockDbInsert })),
  }) as any)
  vi.mocked(db.update).mockImplementation(() => makeUpdateChain() as any)
  mockDbSelect.mockResolvedValue([])
  mockDbInsert.mockResolvedValue([])
  mockDbUpdateReturning.mockResolvedValue([])
  // Restore calculator mock implementations
  vi.mocked(calculatePayroll).mockReturnValue(BREAKDOWN as any)
  vi.mocked(grossFromHours).mockImplementation((h: number, r: number) => h * r)
  vi.mocked(grossFromSalary).mockImplementation((s: number) => s / 26)
})

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/payroll', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with records and computed stats', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValueOnce([PAYROLL_ROW])
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(res.body.records).toEqual([PAYROLL_ROW])
    expect(res.body.stats.total).toBe(1)
    expect(res.body.stats.pending).toBe(1)
    expect(typeof res.body.stats.totalGross).toBe('string')
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/tenant/payroll', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq({ body: { employeeId: 'e-1' } })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 400 when no gross pay source provided', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq({
      body: { employeeId: 'e-1', periodStart: '2024-02-01', periodEnd: '2024-02-14' },
    })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/grossPay/i)
  })

  it('returns 201 using hoursWorked + hourlyRate', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([PAYROLL_ROW])
    const res = await POST(makeReq({
      body: {
        employeeId: 'e-1', periodStart: '2024-02-01', periodEnd: '2024-02-14',
        hoursWorked: 80, hourlyRate: 37.5,
      },
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.record).toEqual(PAYROLL_ROW)
    expect(res.body.breakdown).toEqual(BREAKDOWN)
  })

  it('returns 201 using annualSalary', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([PAYROLL_ROW])
    const res = await POST(makeReq({
      body: {
        employeeId: 'e-1', periodStart: '2024-02-01', periodEnd: '2024-02-14',
        annualSalary: 78000,
      },
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.record).toEqual(PAYROLL_ROW)
  })

  it('returns 201 using explicit grossPay', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([PAYROLL_ROW])
    const res = await POST(makeReq({
      body: {
        employeeId: 'e-1', periodStart: '2024-02-01', periodEnd: '2024-02-14',
        grossPay: 3000,
      },
    })) as any
    expect(res.status).toBe(201)
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/tenant/payroll', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await PATCH(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await PATCH(makeReq({ body: { status: 'approved' } })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/id/i)
  })

  it('returns 200 with updated record on status change', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbUpdateReturning.mockResolvedValue([{ ...PAYROLL_ROW, status: 'approved' }])
    const res = await PATCH(makeReq({ body: { id: 'pr-1', status: 'approved' } })) as any
    expect(res.status).toBe(200)
    expect(res.body.record.status).toBe('approved')
  })
})
