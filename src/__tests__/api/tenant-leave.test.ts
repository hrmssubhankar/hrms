/**
 * API route tests — GET, POST, PATCH /api/tenant/leave
 * src/app/api/tenant/leave/route.ts
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

// ── Notification / email stubs ────────────────────────────────────────────────

vi.mock('@/lib/notifications/notify', () => ({
  notify:     vi.fn(),
  notifyRole: vi.fn(),
}))

vi.mock('@/lib/email/emailHelper', () => ({
  getTenantEmailCtx:   vi.fn().mockResolvedValue({ notify: { emailPayroll: false } }),
  getTenantRoleEmails: vi.fn().mockResolvedValue([]),
  fireEmail:           vi.fn(),
}))

vi.mock('@/lib/email/templates', () => ({
  genericNotificationEmail: vi.fn().mockReturnValue({ subject: '', html: '' }),
}))

// ── DB stubs ──────────────────────────────────────────────────────────────────

const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()
const mockDbUpdate = vi.fn()

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
      where: vi.fn(() => mockDbUpdate()),
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
  leaveRequests: {},
  employees:     {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), or: vi.fn(),
  desc: vi.fn(), asc: vi.fn(),
  gte: vi.fn(), lte: vi.fn(),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { GET, POST, PATCH } from '@/app/api/tenant/leave/route'
import { db } from '@/lib/db'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeReq(opts: { body?: unknown } = {}): any {
  const url = new URL('http://localhost/api/tenant/leave')
  return {
    nextUrl: url,
    json: async () => opts.body ?? {},
  }
}

const BASE_SESSION = {
  sub: 'u-1', email: 'dir@acme.com',
  role: 'tenant_user' as const, tenantId: 't-1',
}

const GUARD_OK_DIRECTOR  = { error: null, session: { ...BASE_SESSION, userRole: 'director'  } }
const GUARD_OK_EMPLOYEE  = { error: null, session: { ...BASE_SESSION, userRole: 'employee'  } }
const GUARD_401 = {
  error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 },
  session: null,
}

const LEAVE_ROW = {
  id: 'lr-1', employeeId: 'e-1', leaveType: 'annual',
  startDate: '2024-02-01', endDate: '2024-02-05',
  totalDays: 5, status: 'pending',
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
  mockDbUpdate.mockResolvedValue(undefined)
})

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/tenant/leave', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns empty list for employee with no employee record', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockHasPermission.mockReturnValue(false)   // canApprove = false
    mockDbSelect.mockResolvedValueOnce([])     // employee lookup → not found
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(res.body.requests).toEqual([])
    expect(res.body.stats.total).toBe(0)
  })

  it('returns 200 with leave list for manager (sees all)', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    mockHasPermission.mockReturnValue(true)    // canApprove = true
    mockDbSelect
      .mockResolvedValueOnce([LEAVE_ROW])      // main select
      .mockResolvedValueOnce([{ status: 'pending', totalDays: 5 }]) // stats
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
    expect(res.body.requests).toEqual([LEAVE_ROW])
    expect(res.body.stats.pending).toBe(1)
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/tenant/leave', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    const res = await POST(makeReq({ body: { leaveType: 'annual' } })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 404 when employee has no linked employee record', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockHasPermission.mockReturnValue(false)  // !canApprove
    mockDbSelect.mockResolvedValueOnce([])    // employee lookup → not found
    const res = await POST(makeReq({
      body: { leaveType: 'annual', startDate: '2024-02-01', endDate: '2024-02-05', totalDays: 5 },
    })) as any
    expect(res.status).toBe(404)
  })

  it('returns 201 when employee submits own leave', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockHasPermission.mockReturnValue(false)  // !canApprove
    mockDbSelect.mockResolvedValueOnce([{ id: 'e-1' }])  // employee lookup
    mockDbInsert.mockResolvedValue([LEAVE_ROW])
    const res = await POST(makeReq({
      body: { leaveType: 'annual', startDate: '2024-02-01', endDate: '2024-02-05', totalDays: 5 },
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.request).toEqual(LEAVE_ROW)
  })

  it('returns 201 when manager submits on behalf of employee', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    mockHasPermission.mockReturnValue(true)   // canApprove
    mockDbInsert.mockResolvedValue([LEAVE_ROW])
    const res = await POST(makeReq({
      body: {
        employeeId: 'e-1', leaveType: 'annual',
        startDate: '2024-02-01', endDate: '2024-02-05', totalDays: 5,
      },
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.request).toEqual(LEAVE_ROW)
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/tenant/leave', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await PATCH(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when id or action is missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    const res = await PATCH(makeReq({ body: { id: 'lr-1' } })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 404 when leave request not found', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    mockHasPermission.mockReturnValue(true)
    mockDbSelect.mockResolvedValueOnce([])   // not found
    const res = await PATCH(makeReq({ body: { id: 'lr-x', action: 'approve' } })) as any
    expect(res.status).toBe(404)
  })

  it('returns 403 when employee tries to approve', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_EMPLOYEE)
    mockHasPermission.mockReturnValue(false)  // !canApprove
    mockDbSelect.mockResolvedValueOnce([LEAVE_ROW])
    const res = await PATCH(makeReq({ body: { id: 'lr-1', action: 'approve' } })) as any
    expect(res.status).toBe(403)
  })

  it('returns 409 when approving a non-pending request', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    mockHasPermission.mockReturnValue(true)
    mockDbSelect.mockResolvedValueOnce([{ ...LEAVE_ROW, status: 'approved' }])
    const res = await PATCH(makeReq({ body: { id: 'lr-1', action: 'approve' } })) as any
    expect(res.status).toBe(409)
  })

  it('returns 200 when manager approves a pending request', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK_DIRECTOR)
    mockHasPermission.mockReturnValue(true)
    mockDbSelect
      .mockResolvedValueOnce([LEAVE_ROW])               // existing lookup
      .mockResolvedValueOnce([{ userId: null }])         // employee for notification
    const res = await PATCH(makeReq({ body: { id: 'lr-1', action: 'approve' } })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
