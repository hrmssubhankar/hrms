/**
 * API route tests — GET /api/auth/me
 * src/app/api/auth/me/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      _tag: 'NextResponse',
      body,
      status: init?.status ?? 200,
    }),
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

import { GET } from '@/app/api/auth/me/route'
import { getSession } from '@/lib/auth/session'

const mockGetSession = vi.mocked(getSession)

const YPC_SESSION = {
  sub:        'user-ypc-001',
  email:      'director@yahwehpc.com.au',
  role:       'tenant_user' as const,
  tenantId:   '00000000-0000-0000-0000-000000000002',
  tenantSlug: 'yahwehpc',
  name:       'Director YPC',
  userRole:   'director',
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET() as any
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthenticated')
  })

  it('returns 200 with session payload when authenticated', async () => {
    mockGetSession.mockResolvedValue(YPC_SESSION as any)
    const res = await GET() as any
    expect(res.status).toBe(200)
    expect(res.body.user).toEqual(YPC_SESSION)
    expect(res.body.userRole).toBe('director')
    expect(res.body.role).toBe('tenant_user')
  })

  it('falls back to employee when userRole is absent', async () => {
    const { userRole: _, ...noRole } = YPC_SESSION
    mockGetSession.mockResolvedValue(noRole as any)
    const res = await GET() as any
    expect(res.body.userRole).toBe('employee')
  })
})
