/**
 * API route tests — GET /api/tenant/leave
 * src/app/api/tenant/leave/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    constructor(url: string) { this.nextUrl = new URL(url) }
    async json() { return {} }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse',
      body,
      status: init?.status ?? 200,
    }),
  },
}))

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }))
vi.mock('@/lib/email/emailHelper', () => ({
  getTenantEmailCtx:   vi.fn().mockResolvedValue(null),
  getTenantRoleEmails: vi.fn().mockResolvedValue([]),
  fireEmail:           vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/email/templates', () => ({
  genericNotificationEmail: vi.fn().mockReturnValue({}),
}))

function makeChain(data: unknown) {
  const c: Record<string, unknown> = {}
  ;['from', 'where', 'leftJoin', 'orderBy', 'limit', 'offset'].forEach(m => { c[m] = () => c })
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve)
  return c
}

const mockUpdate = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain([])),
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'leave-001' }]) })),
    update: vi.fn(() => mockUpdate),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq:    vi.fn((_a, _b) => 'eq'),
  and:   vi.fn((..._args) => 'and'),
  or:    vi.fn((..._args) => 'or'),
  gte:   vi.fn((_a, _b) => 'gte'),
  lte:   vi.fn((_a, _b) => 'lte'),
  desc:  vi.fn((_a) => 'desc'),
  asc:   vi.fn((_a) => 'asc'),
  count: vi.fn(() => 'count'),
  sum:   vi.fn(() => 'sum'),
  sql:   Object.assign(vi.fn(() => 'sql'), { raw: vi.fn(() => 'sql') }),
}))

import { GET } from '@/app/api/tenant/leave/route'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockGetSession = vi.mocked(getSession)
const mockDb = vi.mocked(db)

const YPC_DIRECTOR = {
  sub: 'user-ypc-001', email: 'director@yahwehpc.com.au',
  role: 'tenant_user' as const,
  tenantId: '00000000-0000-0000-0000-000000000002',
  userRole: 'director',
}

const YPC_EMPLOYEE = {
  sub: 'user-ypc-emp-001', email: 'emp@yahwehpc.com.au',
  role: 'tenant_user' as const,
  tenantId: '00000000-0000-0000-0000-000000000002',
  userRole: 'employee',
}

function req(url: string) { return new NextRequest(url) }

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select = vi.fn(() => makeChain([]) as any)
})

describe('GET /api/tenant/leave — guards', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.status).toBe(401)
  })

  it('returns 200 for director (leave:approve)', async () => {
    mockGetSession.mockResolvedValue(YPC_DIRECTOR as any)
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.status).toBe(200)
  })

  it('returns 200 for employee (leave:read)', async () => {
    mockGetSession.mockResolvedValue(YPC_EMPLOYEE as any)
    // Employee path queries for their employee record first (returns [] → empty response)
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.status).toBe(200)
  })
})

describe('GET /api/tenant/leave — response shape', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(YPC_DIRECTOR as any)
  })

  it('returns requests array', async () => {
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.body).toHaveProperty('requests')
    expect(Array.isArray(res.body.requests)).toBe(true)
  })

  it('returns stats object', async () => {
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.body).toHaveProperty('stats')
  })
})

describe('GET /api/tenant/leave — employee scoping', () => {
  it('employee with no matching employee record gets empty results', async () => {
    mockGetSession.mockResolvedValue(YPC_EMPLOYEE as any)
    // select() returns [] — no employee record found
    mockDb.select = vi.fn(() => makeChain([]) as any)
    const res = await GET(req('https://app.test/api/tenant/leave')) as any
    expect(res.status).toBe(200)
    expect(res.body.requests).toEqual([])
  })
})
