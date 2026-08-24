/**
 * API route tests — GET & POST /api/tenant/timesheets
 * src/app/api/tenant/timesheets/route.ts
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

const mockHasPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: (...a: unknown[]) => mockHasPermission(...a),
}))

// ── DB stubs ──────────────────────────────────────────────────────────────────

const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()

function makeSelectChain(): any {
  const chain: any = {}
  ;['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset'].forEach(m => {
    chain[m] = () => chain
  })
  chain.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return chain
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: mockDbInsert })),
    })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  timesheets:   {},
  employees:    {},
  shifts:       {},
  participants: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), or: vi.fn(),
  desc: vi.fn(), asc: vi.fn(),
  gte: vi.fn(), lte: vi.fn(),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { GET, POST } from '@/app/api/tenant/timesheets/route'
import { db } from '@/lib/db'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeReq(opts: {
  searchParams?: Record<string, string>
  body?: unknown
} = {}): any {
  const url = new URL('http://localhost/api/tenant/timesheets')
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const BASE_SESSION = {
  sub: 'u-1', email: 'mgr@acme.com',
  role: 'tenant_user' as const, tenantId: 't-1',
}

const GUARD_OK_MANAGER  = { error: null, session: { ...BASE_SESSION, userRole: 'director'  } }
const GUARD_OK_EMPLOYEE = { error: null, session: { ...BASE_SESSION, userRole: 'employee'  } }
const GUARD_401 = {
  error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 },
  session: null,
}

const TS_ROW = {
  id: 'ts-1', employeeId: 'e-1', shiftId: null,
  clockIn: new Date('2024-02-01T09:00:00Z'),
  clockOut: new Date('2024-02-01T17:00:00Z'),
  hoursWorked: '8.00', status: 'submitted',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(db.select).mockImplementation(() => makeSelectChain())
  vi.mocked(db.insert).mockImplementation(() => ({
    values: vi.fn(() => ({ returning: mockDbInsert })),
  }) as any)
  mockDbSelect.mockResolvedValue([])
  mockDbInsert.mockResolvedValue([])
})

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/timesheets', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with all timesheets for manager', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_MANAGER)
    mockHasPermission.mockReturnValue(true)      // isManager = true
    mockDbSelect.mockResolvedValueOnce([TS_ROW]) // main select (no employee lookup)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(res.body.timesheets).toEqual([TS_ROW])
  })

  it('returns 200 scoped to own employee for non-manager', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockHasPermission.mockReturnValue(false)          // isManager = false
    mockDbSelect
      .mockResolvedValueOnce([{ id: 'e-1' }])         // employee lookup
      .mockResolvedValueOnce([TS_ROW])                 // main select
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(res.body.timesheets).toEqual([TS_ROW])
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/tenant/timesheets', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when clockIn is missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    const res = await POST(makeReq({ body: { clockOut: '2024-02-01T17:00:00Z' } })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/clockIn/i)
  })

  it('returns 404 when no employee record linked to user', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockDbSelect.mockResolvedValueOnce([])   // employee lookup → not found
    const res = await POST(makeReq({ body: { clockIn: '2024-02-01T09:00:00Z' } })) as any
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/employee record/i)
  })

  it('returns 201 with submitted timesheet when clockOut provided', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockDbSelect.mockResolvedValueOnce([{ id: 'e-1' }])   // employee lookup
    mockDbInsert.mockResolvedValue([TS_ROW])
    const res = await POST(makeReq({
      body: {
        clockIn:  '2024-02-01T09:00:00Z',
        clockOut: '2024-02-01T17:00:00Z',
        breakMinutes: 30,
      },
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.timesheet).toEqual(TS_ROW)
  })
})
