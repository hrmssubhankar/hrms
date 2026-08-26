/**
 * API route tests — WHS incidents
 * src/app/api/tenant/whs/route.ts  (GET, POST, PATCH)
 *
 * The route fires async notifications (email + in-app) on POST/PATCH.
 * Those are fire-and-forget so we mock the helpers and don't await them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    _body: unknown
    constructor(url = 'https://app.test/') { this.nextUrl = new URL(url) }
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

vi.mock('@/lib/auth/apiGuard', () => ({
  apiGuard: vi.fn(),
  apiAuth:  vi.fn(),
}))

// Notification + email helpers (fire-and-forget — mock to no-ops)
vi.mock('@/lib/notifications/notify', () => ({
  notify:     vi.fn().mockResolvedValue(undefined),
  notifyRole: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/emailHelper', () => ({
  getTenantEmailCtx:   vi.fn().mockResolvedValue({ notify: { emailWhs: false }, orgName: 'Test Org', logoUrl: '', primaryColor: '#000', loginUrl: '' }),
  getTenantRoleEmails: vi.fn().mockResolvedValue([]),
  fireEmail:           vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/templates', () => ({
  whsIncidentReportedEmail: vi.fn(() => ({ subject: 'WHS', html: '<p>WHS</p>' })),
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
  eq:   vi.fn(() => 'eq'),
  and:  vi.fn(() => 'and'),
  desc: vi.fn(() => 'desc'),
}))

import { GET, POST, PATCH } from '@/app/api/tenant/whs/route'
import { apiGuard }          from '@/lib/auth/apiGuard'
import { db }                from '@/lib/db'
import { NextRequest }       from 'next/server'

const mockApiGuard = vi.mocked(apiGuard)
const mockDb       = vi.mocked(db)

const SESSION = {
  sub: 'u1', email: 'hr@test.com',
  tenantId: 'tid-001',
  role: 'tenant_user' as const,
  userRole: 'hr_officer',
}
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { body: { error: 'Unauthenticated' }, status: 401 }, session: null }
const GUARD_403 = { error: { body: { error: 'Forbidden' }, status: 403 }, session: null }

function makeReq(url: string, body?: unknown) {
  const r = new NextRequest(url) as any
  if (body !== undefined) r._body = body
  return r
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApiGuard.mockResolvedValue(GUARD_OK as any)
  // GET makes two db.select calls: records + all-incidents-for-stats
  mockDb.select = vi.fn()
    .mockReturnValue(makeSelectChain([]) as any)
  mockDb.insert = vi.fn(() => makeInsertChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain([]) as any)
})

// ── GET /api/tenant/whs ────────────────────────────────────────────────────────

describe('GET /api/tenant/whs', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await GET(makeReq('https://app.test/api/tenant/whs')) as any
    expect(res.status).toBe(401)
  })

  it('returns records array and stats object', async () => {
    const records = [
      { id: 'i1', type: 'near_miss', severity: 'low', status: 'open', description: 'Wet floor', location: 'Kitchen', employeeFirstName: 'Jane', employeeLastName: 'Smith' },
    ]
    const allStats = [
      { status: 'open', severity: 'low', type: 'near_miss' },
    ]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain(records) as any)   // records with leftJoin
      .mockReturnValueOnce(makeSelectChain(allStats) as any)  // all-for-stats
    const res = await GET(makeReq('https://app.test/api/tenant/whs')) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.records)).toBe(true)
    expect(res.body.records).toHaveLength(1)
    expect(res.body.stats).toBeDefined()
    expect(res.body.stats.total).toBe(1)
    expect(res.body.stats.open).toBe(1)
  })

  it('returns empty records when DB has nothing', async () => {
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([]) as any)
      .mockReturnValueOnce(makeSelectChain([]) as any)
    const res = await GET(makeReq('https://app.test/api/tenant/whs')) as any
    expect(res.body.records).toEqual([])
    expect(res.body.stats.total).toBe(0)
  })

  it('filters records by search term in-memory', async () => {
    const records = [
      { id: 'i1', description: 'Wet floor near sink', location: 'Kitchen', status: 'open', severity: 'low', type: 'near_miss', employeeFirstName: 'Jane', employeeLastName: 'Smith' },
      { id: 'i2', description: 'Trip hazard',          location: 'Office',  status: 'open', severity: 'low', type: 'hazard',    employeeFirstName: 'Bob',  employeeLastName: 'Jones' },
    ]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain(records) as any)
      .mockReturnValueOnce(makeSelectChain([]) as any)
    const res = await GET(makeReq('https://app.test/api/tenant/whs?search=kitchen')) as any
    expect(res.body.records).toHaveLength(1)
    expect(res.body.records[0].id).toBe('i1')
  })

  it('counts stats correctly across open/critical/high incidents', async () => {
    const allStats = [
      { status: 'open',    severity: 'critical', type: 'injury' },
      { status: 'open',    severity: 'high',     type: 'near_miss' },
      { status: 'closed',  severity: 'low',      type: 'hazard' },
      { status: 'investigating', severity: 'medium', type: 'injury' },
    ]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([]) as any)
      .mockReturnValueOnce(makeSelectChain(allStats) as any)
    const res = await GET(makeReq('https://app.test/api/tenant/whs')) as any
    expect(res.body.stats.open).toBe(2)
    expect(res.body.stats.closed).toBe(1)
    expect(res.body.stats.investigating).toBe(1)
    expect(res.body.stats.critical).toBe(1)
    expect(res.body.stats.high).toBe(1)
  })
})

// ── POST /api/tenant/whs ──────────────────────────────────────────────────────

describe('POST /api/tenant/whs', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await POST(makeReq('https://app.test/', { reportedBy: 'emp-1', type: 'injury', description: 'Fall', occurredAt: '2025-01-15T09:00:00Z' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeReq('https://app.test/', { type: 'injury', description: 'Fall' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 400 when reportedBy is missing', async () => {
    const res = await POST(makeReq('https://app.test/', { type: 'injury', description: 'Fall', occurredAt: '2025-01-15T09:00:00Z' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 with the created incident on success', async () => {
    const created = {
      id: 'i1', tenantId: 'tid-001', type: 'injury', severity: 'low',
      description: 'Slipped on wet floor', status: 'open',
      occurredAt: new Date('2025-01-15T09:00:00Z'),
      reportedBy: 'emp-1', employeeId: null, location: null, correctiveActions: [],
    }
    mockDb.insert = vi.fn(() => makeInsertChain([created]) as any)
    const res = await POST(makeReq('https://app.test/', {
      reportedBy:  'emp-1',
      type:        'injury',
      description: 'Slipped on wet floor',
      occurredAt:  '2025-01-15T09:00:00Z',
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.record.type).toBe('injury')
    expect(res.body.record.status).toBe('open')
  })

  it('defaults severity to low when not provided', async () => {
    const created = { id: 'i2', severity: 'low', type: 'near_miss', status: 'open', description: 'test', occurredAt: new Date(), reportedBy: 'emp-1' }
    mockDb.insert = vi.fn(() => makeInsertChain([created]) as any)
    const res = await POST(makeReq('https://app.test/', {
      reportedBy: 'emp-1', type: 'near_miss', description: 'test', occurredAt: '2025-01-15T09:00:00Z',
    })) as any
    expect(res.status).toBe(201)
    expect(res.body.record.severity).toBe('low')
  })
})

// ── PATCH /api/tenant/whs ─────────────────────────────────────────────────────

describe('PATCH /api/tenant/whs', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await PATCH(makeReq('https://app.test/', { id: 'i1', status: 'closed' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when id is missing', async () => {
    const res = await PATCH(makeReq('https://app.test/', { status: 'closed' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 200 with the updated record on success', async () => {
    const updated = { id: 'i1', status: 'closed', severity: 'low', correctiveActions: [], closedAt: new Date() }
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await PATCH(makeReq('https://app.test/', { id: 'i1', status: 'closed' })) as any
    expect(res.status).toBe(200)
    expect(res.body.record.status).toBe('closed')
  })

  it('returns 200 when updating severity', async () => {
    const updated = { id: 'i1', status: 'open', severity: 'critical', correctiveActions: [] }
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await PATCH(makeReq('https://app.test/', { id: 'i1', severity: 'critical' })) as any
    expect(res.status).toBe(200)
    expect(res.body.record.severity).toBe('critical')
  })

  it('calls db.update when patching an incident', async () => {
    mockDb.update = vi.fn(() => makeUpdateChain([{ id: 'i1', status: 'investigating' }]) as any)
    await PATCH(makeReq('https://app.test/', { id: 'i1', status: 'investigating' }))
    expect(mockDb.update).toHaveBeenCalled()
  })
})
