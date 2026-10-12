/**
 * API route tests — /api/tenant/separation and /api/tenant/separation/leave-encashment
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
  ;['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset', 'set'].forEach(m => {
    c[m] = () => c
  })
  c.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: mockDbInsert })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: mockDbUpdate })),
    })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  separationRecords: {},
  separationEvents:  {},
  employees:         {},
  leaveRequests:     {},
  tenants:           {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), gte: vi.fn(), lte: vi.fn(), inArray: vi.fn(), desc: vi.fn(),
}))

import { GET, POST } from '@/app/api/tenant/separation/route'
import { db } from '@/lib/db'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeReq(opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL('http://localhost/api/tenant/separation')
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'hr@acme.com', tenantId: 't-1', userRole: 'hr_officer' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }

const SEP_ROW = {
  id: 'sep-1', tenantId: 't-1', employeeId: 'e-1',
  type: 'resignation', lastWorkingDay: '2024-06-30',
  status: 'pending', createdAt: new Date().toISOString(),
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
  mockDbUpdate.mockResolvedValue(undefined)
})

// ── GET /api/tenant/separation ────────────────────────────────────────────────

describe('GET /api/tenant/separation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 with separation records list', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([SEP_ROW])
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.records ?? res.body)).toBe(true)
  })
})

// ── POST /api/tenant/separation ───────────────────────────────────────────────

describe('POST /api/tenant/separation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq({ body: {} })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful separation record creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([SEP_ROW])
    const res = await POST(makeReq({
      body: {
        employeeId: 'e-1',
        type: 'resignation',
        lastWorkingDay: '2024-06-30',
      },
    })) as any
    expect(res.status).toBe(201)
  })
})
