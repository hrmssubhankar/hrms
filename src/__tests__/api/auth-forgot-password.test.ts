/**
 * API route tests — POST /api/auth/forgot-password
 * src/app/api/auth/forgot-password/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Next.js stubs ─────────────────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse',
      body,
      status: init?.status ?? 200,
    }),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(() => undefined) })),
}))

// ── DB stub ───────────────────────────────────────────────────────────────────
//
// The route makes two selects with different chain shapes:
//   User:   db.select().from(users).where(...).limit(1)   → mockUserLimit is terminal
//   Tenant: db.select().from(tenants).where(...)          → mockTenantWhere is terminal
//
// We use a call counter on `select()` to alternate between the two chain shapes.

const mockDbUpdate   = vi.fn().mockResolvedValue(undefined)
const mockUserLimit  = vi.fn()   // terminal for user queries:   .where().limit(n)
const mockTenantWhere = vi.fn()  // terminal for tenant queries: .where(...)

let _selectCallIdx = 0

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => {
      const idx = ++_selectCallIdx
      return {
        from: vi.fn(() => ({
          // Odd calls = user table (has .limit); even calls = tenant table (direct await)
          where: idx % 2 === 1
            ? vi.fn(() => ({ limit: mockUserLimit }))
            : mockTenantWhere,
        })),
      }
    }),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: mockDbUpdate,
      })),
    })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  users:   {},
  tenants: {},
}))

vi.mock('drizzle-orm', () => ({
  eq:  vi.fn(),
  and: vi.fn(),
}))

// ── Email stub ────────────────────────────────────────────────────────────────

const mockSendEmail = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/email/resend', () => ({
  sendEmail: (...a: unknown[]) => mockSendEmail(...a),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from '@/app/api/auth/forgot-password/route'

function makeReq(body: unknown, origin = 'https://hrms.example.com') {
  return {
    json: async () => body,
    nextUrl: { origin },
  } as any
}

const ACTIVE_USER = { id: 'u-1', tenantId: 't-1', email: 'alice@acme.com', isActive: true }
const TENANT_INFO = { name: 'Acme Corp', primaryColor: '#4f46e5', logoUrl: null }

beforeEach(() => {
  vi.clearAllMocks()
  _selectCallIdx = 0
  mockSendEmail.mockResolvedValue(undefined)
  mockDbUpdate.mockResolvedValue(undefined)
})

// ── Always-200 behaviour ──────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password — always returns 200', () => {
  it('returns 200 when email is missing', async () => {
    const res = await POST(makeReq({})) as any
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns 200 when email is not a string', async () => {
    const res = await POST(makeReq({ email: 42 })) as any
    expect(res.status).toBe(200)
  })

  it('returns 200 when user is not found (no enumeration)', async () => {
    mockUserLimit.mockResolvedValue([])
    const res = await POST(makeReq({ email: 'nobody@acme.com' })) as any
    expect(res.status).toBe(200)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 200 when user is inactive (no enumeration)', async () => {
    mockUserLimit.mockResolvedValue([{ ...ACTIVE_USER, isActive: false }])
    const res = await POST(makeReq({ email: 'alice@acme.com' })) as any
    expect(res.status).toBe(200)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 200 even when sendEmail throws', async () => {
    mockUserLimit.mockResolvedValueOnce([ACTIVE_USER])
    mockTenantWhere.mockResolvedValueOnce([TENANT_INFO])
    mockSendEmail.mockRejectedValue(new Error('SMTP failure'))
    const res = await POST(makeReq({ email: 'alice@acme.com' })) as any
    expect(res.status).toBe(200)
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password — happy path', () => {
  beforeEach(() => {
    // First select returns user (via .limit), second returns tenant (via .where)
    mockUserLimit.mockResolvedValueOnce([ACTIVE_USER])
    mockTenantWhere.mockResolvedValueOnce([TENANT_INFO])
  })

  it('writes reset token to db', async () => {
    await POST(makeReq({ email: 'alice@acme.com' }))
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('sends email with reset link', async () => {
    await POST(makeReq({ email: 'alice@acme.com' }))
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to:      'alice@acme.com',
        subject: expect.stringContaining('password'),
        html:    expect.stringContaining('reset-password?token='),
      })
    )
  })

  it('normalises email to lowercase', async () => {
    // beforeEach already queued one pair; queue another for this test's own call
    mockUserLimit.mockResolvedValueOnce([ACTIVE_USER])
    mockTenantWhere.mockResolvedValueOnce([TENANT_INFO])
    await POST(makeReq({ email: 'ALICE@ACME.COM' }))
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@acme.com' })
    )
  })

  it('uses APP_URL env var for reset link when set', async () => {
    process.env.APP_URL = 'https://custom-domain.com'
    mockUserLimit.mockResolvedValueOnce([ACTIVE_USER])
    mockTenantWhere.mockResolvedValueOnce([TENANT_INFO])
    await POST(makeReq({ email: 'alice@acme.com' }))
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://custom-domain.com/reset-password'),
      })
    )
    delete process.env.APP_URL
  })
})
