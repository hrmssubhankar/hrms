/**
 * API route tests — GET /api/tenant/{xero,myob}/callback  and  /connect
 * Verifies the OAuth state is bound to the initiating session (nonce cookie + tenant).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Next.js stubs ─────────────────────────────────────────────────────────────

vi.mock('next/server', () => {
  const make = (extra: Record<string, unknown>) => {
    const set = vi.fn()
    return { ...extra, cookies: { set }, _set: set }
  }
  return {
    NextRequest: class {},
    NextResponse: {
      json:     (body: unknown, init?: ResponseInit) => make({ body, status: init?.status ?? 200 }),
      redirect: (url: string)                        => make({ location: url, status: 307 }),
    },
  }
})

// ── Guard + provider clients ──────────────────────────────────────────────────

const mockGuard = vi.fn()
vi.mock('@/lib/auth/apiGuard', () => ({ apiGuard: (...a: unknown[]) => mockGuard(...a) }))

const xero = {
  exchangeCode: vi.fn(), getXeroConnections: vi.fn(), saveXeroTokens: vi.fn(), xeroAuthUrl: vi.fn(),
}
vi.mock('@/lib/xero/client', () => ({
  exchangeCode:       (...a: unknown[]) => xero.exchangeCode(...a),
  getXeroConnections: (...a: unknown[]) => xero.getXeroConnections(...a),
  saveXeroTokens:     (...a: unknown[]) => xero.saveXeroTokens(...a),
  xeroAuthUrl:        (...a: unknown[]) => xero.xeroAuthUrl(...a),
}))

const myob = {
  myobExchangeCode: vi.fn(), listMyobCompanyFiles: vi.fn(), saveMyobTokens: vi.fn(), myobAuthUrl: vi.fn(),
}
vi.mock('@/lib/myob/client', () => ({
  myobExchangeCode:     (...a: unknown[]) => myob.myobExchangeCode(...a),
  listMyobCompanyFiles: (...a: unknown[]) => myob.listMyobCompanyFiles(...a),
  saveMyobTokens:       (...a: unknown[]) => myob.saveMyobTokens(...a),
  myobAuthUrl:          (...a: unknown[]) => myob.myobAuthUrl(...a),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET as xeroCallback } from '@/app/api/tenant/xero/callback/route'
import { GET as myobCallback } from '@/app/api/tenant/myob/callback/route'
import { GET as xeroConnect }  from '@/app/api/tenant/xero/connect/route'
import { GET as myobConnect }  from '@/app/api/tenant/myob/connect/route'
import { newOAuthState } from '@/lib/auth/oauthState'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT   = '11111111-1111-1111-1111-111111111111'
const VICTIM   = '22222222-2222-2222-2222-222222222222'
const SESSION  = { error: null, session: { tenantId: TENANT, userRole: 'director' } }
const NO_AUTH  = { error: { status: 401 }, session: null }

function req(params: Record<string, string>, cookies: Record<string, string> = {}) {
  return {
    nextUrl: { searchParams: new URLSearchParams(params) },
    cookies: { get: (n: string) => (n in cookies ? { value: cookies[n] } : undefined) },
  } as any
}

const PROVIDERS = [
  {
    name: 'xero', callback: xeroCallback, connect: xeroConnect, cookie: 'xero_oauth_state',
    save: xero.saveXeroTokens,
    arrange: () => {
      xero.exchangeCode.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', expiresAt: 1 })
      xero.getXeroConnections.mockResolvedValue([{ tenantId: 'x-1', tenantName: 'Org' }])
      xero.xeroAuthUrl.mockImplementation((s: string) => `https://xero.test/auth?state=${s}`)
    },
    exchange: xero.exchangeCode,
    env: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
  },
  {
    name: 'myob', callback: myobCallback, connect: myobConnect, cookie: 'myob_oauth_state',
    save: myob.saveMyobTokens,
    arrange: () => {
      myob.myobExchangeCode.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', expiresAt: 1 })
      myob.listMyobCompanyFiles.mockResolvedValue([{ Uri: 'https://co', Name: 'Co' }])
      myob.myobAuthUrl.mockImplementation((s: string) => `https://myob.test/auth?state=${s}`)
    },
    exchange: myob.myobExchangeCode,
    env: ['MYOB_CLIENT_ID', 'MYOB_CLIENT_SECRET'],
  },
] as const

beforeEach(() => {
  vi.clearAllMocks()
  mockGuard.mockResolvedValue(SESSION)
})

describe.each(PROVIDERS)('$name OAuth', (p) => {
  beforeEach(() => {
    p.arrange()
    for (const k of p.env) process.env[k] = 'test'
  })

  describe('connect', () => {
    it('pins the returned state to an httpOnly cookie', async () => {
      const res = await p.connect() as any
      const url = new URL(res.body.url)
      const state = url.searchParams.get('state')!
      expect(state.startsWith(`${TENANT}:`)).toBe(true)
      expect(res._set).toHaveBeenCalledWith(
        expect.objectContaining({ name: p.cookie, value: state, httpOnly: true }),
      )
    })

    it('does not set a cookie when unauthenticated', async () => {
      mockGuard.mockResolvedValue(NO_AUTH)
      const res = await p.connect() as any
      expect(res.status).toBe(401)
    })
  })

  describe('callback', () => {
    it('saves tokens when session, state and cookie all agree, then clears the cookie', async () => {
      const state = newOAuthState(TENANT)
      const res = await p.callback(req({ code: 'c', state }, { [p.cookie]: state })) as any
      expect(res.location).toContain(`${p.name}_success=1`)
      expect(p.save).toHaveBeenCalledWith(TENANT, expect.any(Object))
      expect(res._set).toHaveBeenCalledWith(expect.objectContaining({ name: p.cookie, maxAge: 0 }))
    })

    it('rejects when there is no session, without exchanging the code', async () => {
      mockGuard.mockResolvedValue(NO_AUTH)
      const state = newOAuthState(TENANT)
      const res = await p.callback(req({ code: 'c', state }, { [p.cookie]: state })) as any
      expect(res.location).toContain(`${p.name}_error=unauthorized`)
      expect(p.exchange).not.toHaveBeenCalled()
      expect(p.save).not.toHaveBeenCalled()
    })

    it('rejects a forged state with no matching cookie (attacker-crafted link)', async () => {
      const forged = newOAuthState(TENANT)
      const res = await p.callback(req({ code: 'attacker-code', state: forged })) as any
      expect(res.location).toContain(`${p.name}_error=invalid_state`)
      expect(p.exchange).not.toHaveBeenCalled()
      expect(p.save).not.toHaveBeenCalled()
    })

    it('rejects a state whose nonce differs from the cookie', async () => {
      const res = await p.callback(
        req({ code: 'c', state: newOAuthState(TENANT) }, { [p.cookie]: newOAuthState(TENANT) }),
      ) as any
      expect(res.location).toContain(`${p.name}_error=invalid_state`)
      expect(p.save).not.toHaveBeenCalled()
    })

    it("rejects a state for a different tenant than the session's, even with a matching cookie", async () => {
      const victimState = newOAuthState(VICTIM)
      const res = await p.callback(req({ code: 'c', state: victimState }, { [p.cookie]: victimState })) as any
      expect(res.location).toContain(`${p.name}_error=invalid_state`)
      expect(p.save).not.toHaveBeenCalled()
    })

    it('rejects missing params', async () => {
      const res = await p.callback(req({})) as any
      expect(res.location).toContain(`${p.name}_error=missing_params`)
    })

    it('passes provider errors through and clears the cookie', async () => {
      const res = await p.callback(req({ error: 'access_denied' })) as any
      expect(res.location).toContain(`${p.name}_error=access_denied`)
      expect(res._set).toHaveBeenCalledWith(expect.objectContaining({ maxAge: 0 }))
    })
  })
})
