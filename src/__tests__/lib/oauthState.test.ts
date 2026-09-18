/**
 * Unit tests — OAuth state binding helper
 * src/lib/auth/oauthState.ts
 */
import { describe, it, expect } from 'vitest'
import {
  newOAuthState, oauthStateCookie, clearOAuthStateCookie,
  oauthStateCookieName, validateOAuthState,
} from '@/lib/auth/oauthState'

const TENANT = '11111111-1111-1111-1111-111111111111'

describe('newOAuthState', () => {
  it('encodes the tenant and a random 128-bit nonce', () => {
    const s = newOAuthState(TENANT)
    expect(s).toMatch(new RegExp(`^${TENANT}:[0-9a-f]{32}$`))
  })

  it('is different on every call', () => {
    expect(newOAuthState(TENANT)).not.toBe(newOAuthState(TENANT))
  })
})

describe('oauthStateCookie', () => {
  it('is httpOnly, lax, scoped to the provider path and short-lived', () => {
    const c = oauthStateCookie('xero', 'abc')
    expect(c).toMatchObject({
      name: 'xero_oauth_state', value: 'abc', httpOnly: true,
      sameSite: 'lax', path: '/api/tenant/xero', maxAge: 600,
    })
  })

  it('uses separate cookie names per provider', () => {
    expect(oauthStateCookieName('xero')).not.toBe(oauthStateCookieName('myob'))
  })

  it('clear cookie expires immediately', () => {
    expect(clearOAuthStateCookie('myob')).toMatchObject({ name: 'myob_oauth_state', value: '', maxAge: 0 })
  })
})

describe('validateOAuthState', () => {
  const state = newOAuthState(TENANT)

  it('returns the tenantId when state, cookie and session tenant all agree', () => {
    expect(validateOAuthState(state, state, TENANT)).toBe(TENANT)
  })

  it('rejects when the cookie is missing', () => {
    expect(validateOAuthState(state, undefined, TENANT)).toBeNull()
  })

  it('rejects when the state param is missing', () => {
    expect(validateOAuthState(null, state, TENANT)).toBeNull()
  })

  it('rejects when state differs from the cookie (same length)', () => {
    const other = newOAuthState(TENANT)
    expect(validateOAuthState(other, state, TENANT)).toBeNull()
  })

  it('rejects when state differs in length', () => {
    expect(validateOAuthState(state + 'x', state, TENANT)).toBeNull()
  })

  it("rejects a state for another tenant even if it matches the attacker's cookie", () => {
    const victim = newOAuthState('22222222-2222-2222-2222-222222222222')
    expect(validateOAuthState(victim, victim, TENANT)).toBeNull()
  })

  it('rejects a state with no nonce', () => {
    expect(validateOAuthState(TENANT, TENANT, TENANT)).toBeNull()
  })
})
