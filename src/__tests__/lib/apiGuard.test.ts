/**
 * Unit tests — apiGuard / apiAuth
 * lib/auth/apiGuard.ts
 *
 * Strategy: mock getSession so we can simulate authenticated / unauthenticated
 * states without touching cookies or real JWTs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server to provide lightweight stubs
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _isNextResponse: true,
      body,
      status: init?.status ?? 200,
    }),
  },
}))

// Mock getSession before importing apiGuard
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

import { apiGuard, apiAuth } from '@/lib/auth/apiGuard'
import { getSession } from '@/lib/auth/session'

const mockGetSession = vi.mocked(getSession)

const YPC_TENANT_ID = '00000000-0000-0000-0000-000000000002'

function mockSession(overrides: Partial<ReturnType<typeof buildSession>> = {}) {
  return buildSession(overrides)
}

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    sub:        'user-ypc-001',
    email:      'director@yahwehpc.com.au',
    role:       'tenant_user' as const,
    tenantId:   YPC_TENANT_ID,
    tenantSlug: 'yahwehpc',
    name:       'Director YPC',
    userRole:   'director',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Unauthenticated ────────────────────────────────────────────────────────────

describe('apiGuard — unauthenticated', () => {
  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)
    const result = await apiGuard('employees:read')
    expect(result.error).not.toBeNull()
    expect((result.error as any).status).toBe(401)
    expect(result.session).toBeNull()
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetSession.mockResolvedValue({ sub: 'a', email: 'a@b.com', role: 'super_admin' } as any)
    const result = await apiGuard('employees:read')
    expect((result.error as any).status).toBe(401)
  })
})

// ── Authorized ────────────────────────────────────────────────────────────────

describe('apiGuard — authorized', () => {
  it('returns null error and session for director with employees:read', async () => {
    mockGetSession.mockResolvedValue(mockSession() as any)
    const result = await apiGuard('employees:read')
    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
    expect(result.session!.tenantId).toBe(YPC_TENANT_ID)
  })

  it('returns null error for director with any permission', async () => {
    mockGetSession.mockResolvedValue(mockSession() as any)
    const perms = ['payroll:write', 'leave:approve', 'settings:write'] as const
    for (const perm of perms) {
      const result = await apiGuard(perm)
      expect(result.error).toBeNull()
    }
  })

  it('allows when no permissions required (apiAuth)', async () => {
    mockGetSession.mockResolvedValue(mockSession() as any)
    const result = await apiAuth()
    expect(result.error).toBeNull()
    expect(result.session!.email).toBe('director@yahwehpc.com.au')
  })
})

// ── Forbidden ─────────────────────────────────────────────────────────────────

describe('apiGuard — forbidden (role lacks permission)', () => {
  it('returns 403 when employee tries to access payroll:read', async () => {
    mockGetSession.mockResolvedValue(mockSession({ userRole: 'employee' }) as any)
    const result = await apiGuard('payroll:read')
    expect((result.error as any).status).toBe(403)
    expect(result.session).toBeNull()
  })

  it('returns 403 when hr_officer tries to delete employees', async () => {
    mockGetSession.mockResolvedValue(mockSession({ userRole: 'hr_officer' }) as any)
    const result = await apiGuard('employees:delete')
    expect((result.error as any).status).toBe(403)
  })

  it('returns 403 when contractor tries to write employees', async () => {
    mockGetSession.mockResolvedValue(mockSession({ userRole: 'contractor' }) as any)
    const result = await apiGuard('employees:write')
    expect((result.error as any).status).toBe(403)
  })

  it('returns 403 when auditor tries to write compliance', async () => {
    mockGetSession.mockResolvedValue(mockSession({ userRole: 'auditor' }) as any)
    const result = await apiGuard('compliance:write')
    expect((result.error as any).status).toBe(403)
  })
})

// ── Multi-permission guards ────────────────────────────────────────────────────

describe('apiGuard — multiple required permissions', () => {
  it('allows director who satisfies all permissions', async () => {
    mockGetSession.mockResolvedValue(mockSession() as any)
    const result = await apiGuard('employees:read', 'payroll:write', 'leave:approve')
    expect(result.error).toBeNull()
  })

  it('denies hr_officer who lacks payroll:write', async () => {
    mockGetSession.mockResolvedValue(mockSession({ userRole: 'hr_officer' }) as any)
    const result = await apiGuard('employees:read', 'payroll:write')
    expect((result.error as any).status).toBe(403)
  })
})

// ── Missing userRole falls back to 'employee' ─────────────────────────────────

describe('apiGuard — userRole fallback', () => {
  it('treats missing userRole as employee (can read leave)', async () => {
    const sessionNoRole = { sub: 'u', email: 'u@u.com', role: 'tenant_user', tenantId: YPC_TENANT_ID }
    mockGetSession.mockResolvedValue(sessionNoRole as any)
    const result = await apiGuard('leave:read')
    expect(result.error).toBeNull()
  })

  it('treats missing userRole as employee (cannot write payroll)', async () => {
    const sessionNoRole = { sub: 'u', email: 'u@u.com', role: 'tenant_user', tenantId: YPC_TENANT_ID }
    mockGetSession.mockResolvedValue(sessionNoRole as any)
    const result = await apiGuard('payroll:write')
    expect((result.error as any).status).toBe(403)
  })
})

// ── Tenant isolation guarantee ─────────────────────────────────────────────────

describe('apiGuard — tenant ID propagation', () => {
  it('session returned by guard contains the tenantId from the token', async () => {
    const YC = '00000000-0000-0000-0000-000000000001'
    mockGetSession.mockResolvedValue(mockSession({ tenantId: YC }) as any)
    const result = await apiGuard('employees:read')
    expect(result.session!.tenantId).toBe(YC)
  })
})
