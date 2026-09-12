/**
 * API route tests — grievances, leave/types, leave/balance
 * src/app/api/tenant/grievances/route.ts      (GET, POST, PATCH)
 * src/app/api/tenant/leave/types/route.ts     (GET, PATCH)
 * src/app/api/tenant/leave/balance/route.ts   (GET)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    _body:   unknown
    constructor(url = 'https://app.test/') { this.nextUrl = new URL(url) }
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

vi.mock('@/lib/auth/apiGuard', () => ({ apiGuard: vi.fn() }))

vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: vi.fn(() => false),
}))

// Email mocks (fire-and-forget in grievances)
vi.mock('@/lib/email/emailHelper', () => ({
  getTenantEmailCtx:   vi.fn().mockResolvedValue({ notify: { emailGrievance: false }, orgName: 'Test Org', logoUrl: '', primaryColor: '#000', loginUrl: '' }),
  getTenantRoleEmails: vi.fn().mockResolvedValue([]),
  fireEmail:           vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/templates', () => ({
  grievanceSubmittedEmail: vi.fn(() => ({ subject: 'Grievance', html: '<p>G</p>' })),
  grievanceAlertEmail:     vi.fn(() => ({ subject: 'Alert', html: '<p>A</p>' })),
  grievanceResolvedEmail:  vi.fn(() => ({ subject: 'Resolved', html: '<p>R</p>' })),
}))

// Leave types helpers
vi.mock('@/lib/leave/types', () => ({
  DEFAULT_LEAVE_TYPES: [
    { key: 'annual', label: 'Annual Leave', isActive: true },
    { key: 'sick',   label: 'Sick Leave',   isActive: true },
  ],
  mergeLeaveTypes: vi.fn((_saved: unknown) => [
    { key: 'annual', label: 'Annual Leave', isActive: true,  maxDaysPerYear: 20 },
    { key: 'sick',   label: 'Sick Leave',   isActive: true,  maxDaysPerYear: 10 },
    { key: 'toil',   label: 'TOIL',         isActive: false, maxDaysPerYear: 5  },
  ]),
}))

function makeSelectChain(data: unknown) {
  const c: Record<string, unknown> = {}
  ;['from', 'where', 'leftJoin', 'orderBy', 'limit'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

function makeInsertChain(data: unknown = []) {
  const c: Record<string, unknown> = {}
  ;['values', 'returning'].forEach(m => { c[m] = () => c })
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
    insert: vi.fn(() => makeInsertChain([])),
    update: vi.fn(() => makeUpdateChain([])),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:      vi.fn(() => 'eq'),
  and:     vi.fn(() => 'and'),
  desc:    vi.fn(() => 'desc'),
  gte:     vi.fn(() => 'gte'),
  lte:     vi.fn(() => 'lte'),
  inArray: vi.fn(() => 'inArray'),
}))

import { GET as grievGET, POST as grievPOST, PATCH as grievPATCH } from '@/app/api/tenant/grievances/route'
import { GET as typesGET, PATCH as typesPATCH }                     from '@/app/api/tenant/leave/types/route'
import { GET as balanceGET }                                         from '@/app/api/tenant/leave/balance/route'
import { apiGuard }       from '@/lib/auth/apiGuard'
import { hasPermission }  from '@/lib/auth/permissions'
import { db }             from '@/lib/db'
import { NextRequest }    from 'next/server'

const mockApiGuard     = vi.mocked(apiGuard)
const mockHasPerm      = vi.mocked(hasPermission)
const mockDb           = vi.mocked(db)

const SESSION = {
  sub: 'u1', email: 'hr@test.com',
  tenantId: 'tid-001',
  role: 'tenant_user' as const,
  userRole: 'hr_officer',
}
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_403 = { error: { body: { error: 'Forbidden' }, status: 403 }, session: null }

function makeReq(url: string, body?: unknown) {
  const r = new NextRequest(url) as any
  if (body !== undefined) r._body = body
  return r
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApiGuard.mockResolvedValue(GUARD_OK as any)
  mockHasPerm.mockReturnValue(false)
  mockDb.select = vi.fn(() => makeSelectChain([]) as any)
  mockDb.insert = vi.fn(() => makeInsertChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain([]) as any)
})

// ── GET /api/tenant/grievances ────────────────────────────────────────────────

describe('GET /api/tenant/grievances', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await grievGET(makeReq('https://app.test/api/tenant/grievances')) as any
    expect(res.status).toBe(403)
  })

  it('returns records and stats', async () => {
    const records = [
      { id: 'g1', type: 'bullying', riskRating: 'high', status: 'new', description: 'Incident', createdAt: new Date() },
    ]
    const allStats = [
      { status: 'new',    riskRating: 'high' },
      { status: 'active', riskRating: 'medium' },
      { status: 'closed', riskRating: 'low' },
    ]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain(records) as any)
      .mockReturnValueOnce(makeSelectChain(allStats) as any)
    const res = await grievGET(makeReq('https://app.test/api/tenant/grievances')) as any
    expect(res.status).toBe(200)
    expect(res.body.records).toHaveLength(1)
    expect(res.body.stats.total).toBe(3)
    expect(res.body.stats.new).toBe(1)
    expect(res.body.stats.active).toBe(1)
    expect(res.body.stats.closed).toBe(1)
    expect(res.body.stats.high).toBe(1)
  })

  it('returns empty records and zero stats when no data', async () => {
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([]) as any)
      .mockReturnValueOnce(makeSelectChain([]) as any)
    const res = await grievGET(makeReq('https://app.test/api/tenant/grievances')) as any
    expect(res.body.records).toEqual([])
    expect(res.body.stats.total).toBe(0)
  })
})

// ── POST /api/tenant/grievances ───────────────────────────────────────────────

describe('POST /api/tenant/grievances', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await grievPOST(makeReq('https://app.test/', { type: 'bullying', description: 'Incident' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when type or description is missing', async () => {
    const res = await grievPOST(makeReq('https://app.test/', { type: 'bullying' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 201 with the created grievance and defaults status to new', async () => {
    const created = { id: 'g2', type: 'harassment', riskRating: 'medium', status: 'new', description: 'Test incident', isAnonymous: false, lodgedBy: null }
    mockDb.insert = vi.fn(() => makeInsertChain([created]) as any)
    const res = await grievPOST(makeReq('https://app.test/', { type: 'harassment', description: 'Test incident' })) as any
    expect(res.status).toBe(201)
    expect(res.body.record.status).toBe('new')
    expect(res.body.record.type).toBe('harassment')
  })
})

// ── PATCH /api/tenant/grievances ──────────────────────────────────────────────

describe('PATCH /api/tenant/grievances', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await grievPATCH(makeReq('https://app.test/', { id: 'g1', status: 'closed' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when id is missing', async () => {
    const res = await grievPATCH(makeReq('https://app.test/', { status: 'closed' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 200 with the updated grievance', async () => {
    const updated = { id: 'g1', status: 'closed', riskRating: 'high', closedAt: new Date(), isAnonymous: false, lodgedBy: null }
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await grievPATCH(makeReq('https://app.test/', { id: 'g1', status: 'closed' })) as any
    expect(res.status).toBe(200)
    expect(res.body.record.status).toBe('closed')
  })
})

// ── GET /api/tenant/leave/types ───────────────────────────────────────────────

describe('GET /api/tenant/leave/types', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await typesGET(makeReq('https://app.test/api/tenant/leave/types')) as any
    expect(res.status).toBe(403)
  })

  it('returns only active leave types by default', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ settings: {} }]) as any)
    const res = await typesGET(makeReq('https://app.test/api/tenant/leave/types')) as any
    expect(res.status).toBe(200)
    // mergeLeaveTypes mock returns annual(active), sick(active), toil(inactive)
    // default filter: isActive only
    const active = res.body.types.filter((t: any) => t.isActive)
    expect(res.body.types.length).toBe(active.length)
    expect(res.body.types.some((t: any) => t.key === 'annual')).toBe(true)
  })

  it('returns all types including inactive when ?all=1', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ settings: {} }]) as any)
    const res = await typesGET(makeReq('https://app.test/api/tenant/leave/types?all=1')) as any
    expect(res.body.types).toHaveLength(3) // annual + sick + toil
  })
})

// ── PATCH /api/tenant/leave/types ────────────────────────────────────────────

describe('PATCH /api/tenant/leave/types', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await typesPATCH(makeReq('https://app.test/', { types: [] })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when an unknown leave type key is provided', async () => {
    const res = await typesPATCH(makeReq('https://app.test/', { types: [{ key: 'space_leave', maxDaysPerYear: 99 }] })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/unknown/i)
  })

  it('returns 200 with merged types on success', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([{ settings: {} }]) as any)
    const res = await typesPATCH(makeReq('https://app.test/', { types: [{ key: 'annual', maxDaysPerYear: 25 }] })) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.types)).toBe(true)
    expect(mockDb.update).toHaveBeenCalled()
  })
})

// ── GET /api/tenant/leave/balance ─────────────────────────────────────────────

describe('GET /api/tenant/leave/balance', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await balanceGET(makeReq('https://app.test/api/tenant/leave/balance')) as any
    expect(res.status).toBe(403)
  })

  it('returns 404 when employee is not linked to the current user', async () => {
    // Non-manager role, no employee found
    mockHasPerm.mockReturnValue(false)
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)  // empty → no employee linked
    const res = await balanceGET(makeReq('https://app.test/api/tenant/leave/balance')) as any
    expect(res.status).toBe(404)
  })

  it('returns balance for a manager querying by employeeId param', async () => {
    mockHasPerm.mockReturnValue(true)  // manager
    const emp = { id: 'emp-1', firstName: 'Jane', lastName: 'Smith', startDate: '2022-01-01', ordinaryHoursPerWeek: '38', employmentType: 'full_time' }
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([emp]) as any)   // employee details
      .mockReturnValueOnce(makeSelectChain([]) as any)      // leave requests
    const res = await balanceGET(makeReq('https://app.test/api/tenant/leave/balance?employeeId=emp-1')) as any
    expect(res.status).toBe(200)
    expect(res.body.employeeId).toBe('emp-1')
    expect(res.body.annual).toBeDefined()
    expect(res.body.personal).toBeDefined()
    expect(res.body.longService).toBeDefined()
    expect(typeof res.body.longService.yearsOfService).toBe('number')
  })

  it('correctly sums used and pending leave days from approved/pending requests', async () => {
    mockHasPerm.mockReturnValue(true)
    const emp = { id: 'emp-1', firstName: 'Jane', lastName: 'Smith', startDate: '2022-01-01', ordinaryHoursPerWeek: '38', employmentType: 'full_time' }
    const requests = [
      { leaveType: 'annual', totalDays: '5', status: 'approved' },
      { leaveType: 'annual', totalDays: '3', status: 'pending' },
      { leaveType: 'sick',   totalDays: '2', status: 'approved' },
    ]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([emp]) as any)
      .mockReturnValueOnce(makeSelectChain(requests) as any)
    const res = await balanceGET(makeReq('https://app.test/api/tenant/leave/balance?employeeId=emp-1')) as any
    expect(res.body.annual.used).toBe(5)
    expect(res.body.annual.pending).toBe(3)
    expect(res.body.personal.used).toBe(2)
  })
})
