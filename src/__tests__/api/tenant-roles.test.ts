/**
 * API route tests — /api/tenant/roles (user management: list, create, update role/status)
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

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$hashed') },
}))

const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()
const mockDbUpdate = vi.fn()

function makeChain(): any {
  const c: any = {}
  ;['from', 'where', 'orderBy', 'limit', 'offset'].forEach(m => { c[m] = () => c })
  c.then = (res: any, rej: any) => mockDbSelect().then(res, rej)
  return c
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: mockDbInsert })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: mockDbUpdate })) })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  users: {},
  tenants: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(), and: vi.fn(), ne: vi.fn(), asc: vi.fn(),
}))

import { GET, POST } from '@/app/api/tenant/roles/route'
import { db } from '@/lib/db'

function makeReq(opts: { searchParams?: Record<string, string>; body?: unknown } = {}): any {
  const url = new URL('http://localhost/api/tenant/roles')
  Object.entries(opts.searchParams ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: url, json: async () => opts.body ?? {} }
}

const SESSION = { sub: 'u-1', email: 'dir@acme.com', tenantId: 't-1', userRole: 'director' }
const GUARD_OK  = { error: null, session: SESSION }
const GUARD_401 = { error: { _tag: 'NextResponse', body: { error: 'Unauthenticated' }, status: 401 }, session: null }
const GUARD_403 = { error: { _tag: 'NextResponse', body: { error: 'Forbidden' }, status: 403 }, session: null }

const USER_ROW = {
  id: 'u-2', tenantId: 't-1', email: 'staff@acme.com',
  role: 'employee', isActive: true,
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
  mockDbUpdate.mockResolvedValue([])
})

describe('GET /api/tenant/roles', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 403 when permission denied', async () => {
    mockApiGuard.mockResolvedValue(GUARD_403)
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(403)
  })

  it('returns 200 with user list', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbSelect.mockResolvedValue([USER_ROW])
    const res = await GET(makeReq()) as any
    expect(res.status).toBe(200)
  })
})

describe('POST /api/tenant/roles', () => {
  it('returns 401 when unauthenticated', async () => {
    mockApiGuard.mockResolvedValue(GUARD_401)
    const res = await POST(makeReq()) as any
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    const res = await POST(makeReq({ body: { email: 'new@acme.com' } })) as any
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful user creation', async () => {
    mockApiGuard.mockResolvedValue(GUARD_OK)
    mockDbInsert.mockResolvedValue([USER_ROW])
    const res = await POST(makeReq({
      body: {
        email: 'staff@acme.com',
        role: 'employee',
        password: 'Passw0rd!',
        firstName: 'Staff',
        lastName: 'Member',
      },
    })) as any
    expect(res.status).toBe(201)
  })

})
