/**
 * API route tests — notifications, audit-logs, search
 * src/app/api/tenant/notifications/route.ts  (GET, DELETE, PATCH)
 * src/app/api/tenant/audit-logs/route.ts     (GET, POST)
 * src/app/api/tenant/search/route.ts         (GET)
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
}))

function makeSelectChain(data: unknown) {
  const c: Record<string, unknown> = {}
  ;['from', 'where', 'leftJoin', 'orderBy', 'limit', 'offset'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

function makeInsertChain(data: unknown = []) {
  const c: Record<string, unknown> = {}
  ;['values', 'returning'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

function makeUpdateChain() {
  const c: Record<string, unknown> = {}
  ;['set', 'where'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(undefined).then(resolve)
  return c
}

function makeDeleteChain() {
  const c: Record<string, unknown> = {}
  c['where'] = () => c
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(undefined).then(resolve)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select:         vi.fn(() => makeSelectChain([])),
    selectDistinct: vi.fn(() => makeSelectChain([])),
    insert:         vi.fn(() => makeInsertChain([])),
    update:         vi.fn(() => makeUpdateChain()),
    delete:         vi.fn(() => makeDeleteChain()),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:    vi.fn(() => 'eq'),
  and:   vi.fn(() => 'and'),
  or:    vi.fn(() => 'or'),
  desc:  vi.fn(() => 'desc'),
  gte:   vi.fn(() => 'gte'),
  ilike: vi.fn(() => 'ilike'),
}))

import { GET as notifGET, DELETE as notifDELETE, PATCH as notifPATCH } from '@/app/api/tenant/notifications/route'
import { GET as auditGET, POST as auditPOST }                          from '@/app/api/tenant/audit-logs/route'
import { GET as searchGET }                                             from '@/app/api/tenant/search/route'
import { apiGuard }  from '@/lib/auth/apiGuard'
import { db }        from '@/lib/db'
import { NextRequest } from 'next/server'

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
  mockDb.select         = vi.fn(() => makeSelectChain([]) as any)
  mockDb.selectDistinct = vi.fn(() => makeSelectChain([]) as any)
  mockDb.insert         = vi.fn(() => makeInsertChain([]) as any)
  mockDb.update         = vi.fn(() => makeUpdateChain() as any)
  mockDb.delete         = vi.fn(() => makeDeleteChain() as any)
})

// ── GET /api/tenant/notifications ─────────────────────────────────────────────

describe('GET /api/tenant/notifications', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await notifGET() as any
    expect(res.status).toBe(401)
  })

  it('returns notifications array', async () => {
    const items = [
      { id: 'n1', type: 'info', title: 'Leave approved', body: 'Your leave was approved', isRead: false, link: '/leave', createdAt: new Date() },
    ]
    mockDb.select = vi.fn(() => makeSelectChain(items) as any)
    const res = await notifGET() as any
    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(1)
    expect(res.body.notifications[0].title).toBe('Leave approved')
  })

  it('returns empty array when DB throws', async () => {
    mockDb.select = vi.fn(() => { throw new Error('DB error') })
    const res = await notifGET() as any
    expect(res.body.notifications).toEqual([])
  })
})

// ── DELETE /api/tenant/notifications ──────────────────────────────────────────

describe('DELETE /api/tenant/notifications', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await notifDELETE(makeReq('https://app.test/api/tenant/notifications')) as any
    expect(res.status).toBe(401)
  })

  it('deletes a single notification when ?id= is provided', async () => {
    const res = await notifDELETE(makeReq('https://app.test/api/tenant/notifications?id=n1')) as any
    expect(res.body.ok).toBe(true)
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('clears all notifications when no id is provided', async () => {
    const res = await notifDELETE(makeReq('https://app.test/api/tenant/notifications')) as any
    expect(res.body.ok).toBe(true)
    expect(mockDb.delete).toHaveBeenCalled()
  })
})

// ── PATCH /api/tenant/notifications ───────────────────────────────────────────

describe('PATCH /api/tenant/notifications', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await notifPATCH(makeReq('https://app.test/', {})) as any
    expect(res.status).toBe(401)
  })

  it('marks a single notification read when body.id is provided', async () => {
    const res = await notifPATCH(makeReq('https://app.test/', { id: 'n1' })) as any
    expect(res.body.ok).toBe(true)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('marks all notifications read when no body.id', async () => {
    const res = await notifPATCH(makeReq('https://app.test/', {})) as any
    expect(res.body.ok).toBe(true)
    expect(mockDb.update).toHaveBeenCalled()
  })
})

// ── GET /api/tenant/audit-logs ────────────────────────────────────────────────

describe('GET /api/tenant/audit-logs', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await auditGET(makeReq('https://app.test/api/tenant/audit-logs')) as any
    expect(res.status).toBe(403)
  })

  it('returns logs and resources arrays', async () => {
    const logs = [
      { id: 'al1', action: 'create', resource: 'employee', resourceId: 'e1', userEmail: 'hr@test.com', createdAt: new Date() },
    ]
    const resources = [{ resource: 'employee' }, { resource: 'leave' }]
    mockDb.select         = vi.fn(() => makeSelectChain(logs) as any)
    mockDb.selectDistinct = vi.fn(() => makeSelectChain(resources) as any)
    const res = await auditGET(makeReq('https://app.test/api/tenant/audit-logs')) as any
    expect(res.status).toBe(200)
    expect(res.body.logs).toHaveLength(1)
    expect(res.body.resources).toEqual(['employee', 'leave'])
  })

  it('returns empty arrays when no data', async () => {
    const res = await auditGET(makeReq('https://app.test/api/tenant/audit-logs')) as any
    expect(res.body.logs).toEqual([])
    expect(res.body.resources).toEqual([])
  })
})

// ── POST /api/tenant/audit-logs ───────────────────────────────────────────────

describe('POST /api/tenant/audit-logs', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await auditPOST(makeReq('https://app.test/', { action: 'create', resource: 'employee' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when action or resource is missing', async () => {
    const res = await auditPOST(makeReq('https://app.test/', { action: 'create' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 201 with the created record', async () => {
    const created = { id: 'al2', action: 'update', resource: 'leave', resourceId: 'lr-1', tenantId: 'tid-001' }
    mockDb.insert = vi.fn(() => makeInsertChain([created]) as any)
    const res = await auditPOST(makeReq('https://app.test/', { action: 'update', resource: 'leave', resourceId: 'lr-1' })) as any
    expect(res.status).toBe(201)
    expect(res.body.record.action).toBe('update')
    expect(res.body.record.resource).toBe('leave')
  })
})

// ── GET /api/tenant/search ────────────────────────────────────────────────────

describe('GET /api/tenant/search', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await searchGET(makeReq('https://app.test/api/tenant/search?q=jane')) as any
    expect(res.status).toBe(401)
  })

  it('returns empty arrays when query is shorter than 2 characters', async () => {
    const res = await searchGET(makeReq('https://app.test/api/tenant/search?q=j')) as any
    expect(res.body.employees).toEqual([])
    expect(res.body.documents).toEqual([])
    expect(res.body.participants).toEqual([])
  })

  it('returns employees, documents, and participants for a valid query', async () => {
    const empRows  = [{ id: 'e1', firstName: 'Jane', lastName: 'Smith', email: 'jane@t.com', employeeNumber: 'E001', isActive: true }]
    const docRows  = [{ id: 'd1', title: 'NDA', category: 'legal', status: 'active', employeeId: 'e1' }]
    const partRows = [{ id: 'p1', firstName: 'Alice', lastName: 'Brown', ndisNumber: 'N001', isActive: true }]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain(empRows)  as any)
      .mockReturnValueOnce(makeSelectChain(docRows)  as any)
      .mockReturnValueOnce(makeSelectChain(partRows) as any)
    const res = await searchGET(makeReq('https://app.test/api/tenant/search?q=jane')) as any
    expect(res.body.employees).toHaveLength(1)
    expect(res.body.documents).toHaveLength(1)
    expect(res.body.participants).toHaveLength(1)
  })

  it('restricts employee role from seeing employee and participant results', async () => {
    mockApiGuard.mockResolvedValue({ error: null, session: { ...SESSION, userRole: 'employee' } } as any)
    const docRows = [{ id: 'd1', title: 'Contract', category: 'legal', status: 'active', employeeId: 'e1' }]
    mockDb.select = vi.fn(() => makeSelectChain(docRows) as any)
    const res = await searchGET(makeReq('https://app.test/api/tenant/search?q=jane')) as any
    expect(res.body.employees).toEqual([])
    expect(res.body.participants).toEqual([])
    expect(res.body.documents).toHaveLength(1)
  })
})
