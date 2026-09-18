/**
 * OAuth `state` binding for the Xero / MYOB connect → callback flow.
 *
 * `connect` (authenticated) mints a state value and stores it in a short-lived
 * httpOnly cookie on the initiating browser. `callback` only proceeds when the
 * `state` query param matches that cookie AND the current session belongs to the
 * tenant encoded in the state. This stops an attacker from crafting a callback
 * URL (with their own `code` and a victim tenantId) that a victim's browser —
 * or the attacker's own — would otherwise use to link the wrong account to a tenant.
 */
import { randomBytes, timingSafeEqual } from 'crypto'

export type OAuthProvider = 'xero' | 'myob'

const STATE_MAX_AGE_SECONDS = 10 * 60

export function oauthStateCookieName(provider: OAuthProvider): string {
  return `${provider}_oauth_state`
}

/** "<tenantId>:<128-bit nonce>" */
export function newOAuthState(tenantId: string): string {
  return `${tenantId}:${randomBytes(16).toString('hex')}`
}

function cookieBase(provider: OAuthProvider) {
  return {
    name: oauthStateCookieName(provider),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // lax: still sent on the top-level GET redirect back from the provider
    sameSite: 'lax' as const,
    path: `/api/tenant/${provider}`,
  }
}

export function oauthStateCookie(provider: OAuthProvider, state: string) {
  return { ...cookieBase(provider), value: state, maxAge: STATE_MAX_AGE_SECONDS }
}

export function clearOAuthStateCookie(provider: OAuthProvider) {
  return { ...cookieBase(provider), value: '', maxAge: 0 }
}

/**
 * Returns the tenantId encoded in `state` if — and only if — it matches the
 * stored cookie value and the session's tenant. Returns null otherwise.
 */
export function validateOAuthState(
  state: string | null | undefined,
  cookieValue: string | null | undefined,
  sessionTenantId: string,
): string | null {
  if (!state || !cookieValue) return null

  const a = Buffer.from(state)
  const b = Buffer.from(cookieValue)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const [tenantId, nonce] = state.split(':')
  if (!tenantId || !nonce || tenantId !== sessionTenantId) return null

  return tenantId
}
