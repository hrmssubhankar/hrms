/**
 * API route tests — config, benefits, org-chart
 * src/app/api/tenant/config/route.ts    (GET, PATCH)
 * src/app/api/tenant/benefits/route.ts  (GET, POST, PATCH, DELETE)
 * src/app/api/tenant/org-chart/route.ts (GET)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    _body:   unknown
    headers = { get: (_: string) => null }
    constructor(url = 'https://app.test/') { this.nextUrl = new URL(url) }
    async json() { return this._body ?? {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }))

vi.mock('@/lib/auth/apiGuard', () => ({
  apiGuard: vi.fn(),
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

function makeDeleteChain() {
  const c: Record<string, unknown> = {}
  c['where'] = () => c
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(undefined).then(resolve)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeSelectChain([])),
    insert: vi.fn(() => makeInsertChain([])),
    update: vi.fn(() => makeUpdateChain([])),
    delete: vi.fn(() => makeDeleteChain()),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:     vi.fn(() => 'eq'),
  and:    vi.fn(() => 'and'),
  desc:   vi.fn(() => 'desc'),
  isNull: vi.fn(() => 'isNull'),
}))

import { GET as configGET, PATCH as configPATCH }     from '@/app/api/tenant/config/route'
import { GET as benefitsGET, POST as benefitsPOST,
         PATCH as benefitsPATCH, DELETE as benefitsDELETE } from '@/app/api/tenant/benefits/route'
import { GET as orgGET }                               from '@/app/api/tenant/org-chart/route'
import { getSession }  from '@/lib/auth/session'
import { apiGuard }    from '@/lib/auth/apiGuard'
import { db }          from '@/lib/db'
import { NextRequest } from 'next/server'

const mockGetSession = vi.mocked(getSession)
const mockApiGuard   = vi.mocked(apiGuard)
const mockDb         = vi.mocked(db)

const SESSION = {
  sub: 'u1', email: 'admin@test.com',
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
  mockGetSession.mockResolvedValue(SESSION as any)
  mockApiGuard.mockResolvedValue(GUARD_OK as any)
  mockDb.select = vi.fn(() => makeSelectChain([]) as any)
  mockDb.insert = vi.fn(() => makeInsertChain([]) as any)
  mockDb.update = vi.fn(() => makeUpdateChain([]) as any)
  mockDb.delete = vi.fn(() => makeDeleteChain() as any)
})

// ── GET /api/tenant/config ────────────────────────────────────────────────────

describe('GET /api/tenant/config', () => {
  it('returns 404 when tenant slug is not found', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await configGET(makeReq('https://app.test/api/tenant/config?slug=unknown')) as any
    expect(res.status).toBe(404)
  })

  it('returns 403 when tenant is inactive', async () => {
    const tenant = { id: 'tid-001', name: 'Test', slug: 'test', tier: 'starter', isActive: false, logoUrl: null, primaryColor: null, settings: {} }
    mockDb.select = vi.fn(() => makeSelectChain([tenant]) as any)
    const res = await configGET(makeReq('https://app.test/api/tenant/config?slug=test')) as any
    expect(res.status).toBe(403)
  })

  it('returns tenant config and enabledModules by slug', async () => {
    const tenant  = { id: 'tid-001', name: 'Test Org', slug: 'test-org', tier: 'pro', isActive: true, logoUrl: null, primaryColor: '#000', settings: {} }
    const modules = [{ moduleId: 'leave', moduleName: 'Leave', isEnabled: true }]
    mockDb.select = vi.fn()
      .mockReturnValueOnce(makeSelectChain([tenant])  as any)
      .mockReturnValueOnce(makeSelectChain(modules)   as any)
    const res = await configGET(makeReq('https://app.test/api/tenant/config?slug=test-org')) as any
    expect(res.status).toBe(200)
    expect(res.body.tenant.name).toBe('Test Org')
    expect(res.body.enabledModules).toHaveLength(1)
    expect(res.body.enabledModules[0].id).toBe('leave')
  })

  it('returns 400 when no slug and no session', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await configGET(makeReq('https://app.test/api/tenant/config')) as any
    expect(res.status).toBe(400)
  })
})

// ── PATCH /api/tenant/config ──────────────────────────────────────────────────

describe('PATCH /api/tenant/config', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await configPATCH(makeReq('https://app.test/', { name: 'New Name' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when logo is not a valid data URL', async () => {
    const res = await configPATCH(makeReq('https://app.test/', { logoUrl: 'https://cdn.example.com/logo.png' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid logo/i)
  })

  it('returns 200 with updated config when name is changed', async () => {
    const updated = { name: 'New Org Name', logoUrl: null, settings: {} }
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await configPATCH(makeReq('https://app.test/', { name: 'New Org Name' })) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.name).toBe('New Org Name')
  })

  it('merges settings when settings object is provided', async () => {
    const existing = { settings: { emailNotifications: true } }
    const updated  = { name: 'Test Org', logoUrl: null, settings: { emailNotifications: true, timezone: 'UTC' } }
    mockDb.select = vi.fn(() => makeSelectChain([existing]) as any)
    mockDb.update = vi.fn(() => makeUpdateChain([updated])  as any)
    const res = await configPATCH(makeReq('https://app.test/', { settings: { timezone: 'UTC' } })) as any
    expect(res.status).toBe(200)
    expect(mockDb.update).toHaveBeenCalled()
  })
})

// ── GET /api/tenant/benefits ──────────────────────────────────────────────────

describe('GET /api/tenant/benefits', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await benefitsGET(makeReq('https://app.test/api/tenant/benefits')) as any
    expect(res.status).toBe(403)
  })

  it('returns benefits array', async () => {
    const rows = [
      { id: 'b1', employeeId: 'e1', type: 'health_insurance', description: 'Full cover', startDate: '2025-01-01', endDate: null, notes: null, createdAt: new Date(), employeeFirstName: 'Jane', employeeLastName: 'Smith' },
    ]
    mockDb.select = vi.fn(() => makeSelectChain(rows) as any)
    const res = await benefitsGET(makeReq('https://app.test/api/tenant/benefits')) as any
    expect(res.status).toBe(200)
    expect(res.body.benefits).toHaveLength(1)
    expect(res.body.benefits[0].type).toBe('health_insurance')
  })
})

// ── POST /api/tenant/benefits ─────────────────────────────────────────────────

describe('POST /api/tenant/benefits', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await benefitsPOST(makeReq('https://app.test/', { employeeId: 'e1', type: 'health_insurance' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when employeeId or type is missing', async () => {
    const res = await benefitsPOST(makeReq('https://app.test/', { type: 'health_insurance' })) as any
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('returns 201 with the created benefit', async () => {
    const created = { id: 'b2', employeeId: 'e1', type: 'dental', description: null, startDate: '2025-06-01', endDate: null, notes: null }
    mockDb.insert = vi.fn(() => makeInsertChain([created]) as any)
    const res = await benefitsPOST(makeReq('https://app.test/', { employeeId: 'e1', type: 'dental', startDate: '2025-06-01' })) as any
    expect(res.status).toBe(201)
    expect(res.body.record.type).toBe('dental')
  })
})

// ── PATCH /api/tenant/benefits ────────────────────────────────────────────────

describe('PATCH /api/tenant/benefits', () => {
  it('returns 403 when guard denies access', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403 as any)
    const res = await benefitsPATCH(makeReq('https://app.test/', { id: 'b1', type: 'vision' })) as any
    expect(res.status).toBe(403)
  })

  it('returns 400 when id is missing', async () => {
    const res = await benefitsPATCH(makeReq('https://app.test/', { type: 'vision' })) as any
    expect(res.status).toBe(400)
  })

  it('returns 404 when benefit is not found', async () => {
    mockDb.update = vi.fn(() => makeUpdateChain([]) as any)
    const res = await benefitsPATCH(makeReq('https://app.test/', { id: 'b-missing', type: 'vision' })) as any
    expect(res.status).toBe(404)
  })

  it('returns 200 with updated record on success', async () => {
    const updated = { id: 'b1', employeeId: 'e1', type: 'vision', description: null, startDate: null, endDate: null, notes: null }
    mockDb.update = vi.fn(() => makeUpdateChain([updated]) as any)
    const res = await benefitsPATCH(makeReq('https://app.test/', { id: 'b1', type: 'vision' })) as any
    expect(res.status).toBe(200)
    expect(res.body.record.type).toBe('vision')
  })
})

// ── DELETE /api/tenant/benefits ───────────────────────────────────────────────

describe('DELETE /api/tenant/benefits', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await benefitsDELETE(makeReq('https://app.test/', { id: 'b1' })) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is missing', async () => {
    const res = await benefitsDELETE(makeReq('https://app.test/', {})) as any
    expect(res.status).toBe(400)
  })

  it('returns ok:true on successful delete', async () => {
    const res = await benefitsDELETE(makeReq('https://app.test/', { id: 'b1' })) as any
    expect(res.body.ok).toBe(true)
    expect(mockDb.delete).toHaveBeenCalled()
  })
})

// ── GET /api/tenant/org-chart ─────────────────────────────────────────────────

describe('GET /api/tenant/org-chart', () => {
  it('returns 401 when guard fails', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401 as any)
    const res = await orgGET(makeReq('https://app.test/api/tenant/org-chart')) as any
    expect(res.status).toBe(401)
  })

  it('returns 403 for employee role', async () => {
    mockApiGuard.mockResolvedValue({ error: null, session: { ...SESSION, userRole: 'employee' } } as any)
    const res = await orgGET(makeReq('https://app.test/api/tenant/org-chart')) as any
    expect(res.status).toBe(403)
  })

  it('returns tree, allDepartments, and total', async () => {
    const rows = [
      { id: 'e1', firstName: 'Jane', lastName: 'Smith',  managerId: null,  departmentId: 'd1', positionId: 'p1', isActive: true, complianceStatus: 'compliant', employmentType: 'full_time', departmentName: 'HR',    positionTitle: 'Manager', preferredName: null, email: 'jane@t.com' },
      { id: 'e2', firstName: 'Bob',  lastName: 'Jones',  managerId: 'e1',  departmentId: 'd1', positionId: 'p2', isActive: true, complianceStatus: 'compliant', employmentType: 'full_time', departmentName: 'HR',    positionTitle: 'Officer', preferredName: null, email: 'bob@t.com'  },
      { id: 'e3', firstName: 'Alice', lastName: 'Brown', managerId: null,  departmentId: 'd2', positionId: 'p3', isActive: true, complianceStatus: 'compliant', employmentType: 'part_time', departmentName: 'Finance', positionTitle: 'Analyst', preferredName: null, email: 'alice@t.com' },
    ]
    mockDb.select = vi.fn(() => makeSelectChain(rows) as any)
    const res = await orgGET(makeReq('https://app.test/api/tenant/org-chart')) as any
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(3)
    // Tree: e1 and e3 are roots; e2 is child of e1
    expect(res.body.tree).toHaveLength(2)
    const e1Node = res.body.tree.find((n: any) => n.id === 'e1')
    expect(e1Node.children).toHaveLength(1)
    expect(e1Node.children[0].id).toBe('e2')
    // Departments
    expect(res.body.allDepartments).toHaveLength(2)
  })

  it('returns empty tree when no active employees', async () => {
    mockDb.select = vi.fn(() => makeSelectChain([]) as any)
    const res = await orgGET(makeReq('https://app.test/api/tenant/org-chart')) as any
    expect(res.body.tree).toEqual([])
    expect(res.body.total).toBe(0)
  })
})
