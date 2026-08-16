/**
 * fetchWithAuth — drop-in replacement for `fetch` in client components.
 *
 * On a 401 response it:
 *   1. Calls /api/auth/refresh to silently renew the session cookie.
 *   2. Retries the original request once.
 *   3. If the refresh itself fails (session truly expired), redirects to
 *      the login page preserving the tenant slug from the cookie.
 *
 * Usage — just swap `fetch(...)` → `fetchWithAuth(...)` in client components
 * that call /api/tenant/* endpoints.
 */

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  // Deduplicate: if a refresh is already in-flight, await that one
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = fetch('/api/auth/refresh', { method: 'GET' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshInFlight = null })

  return refreshInFlight
}

function redirectToLogin() {
  const tenantSlug =
    typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((c) => c.startsWith('tenant_slug='))
          ?.split('=')[1]
      : undefined

  const loginUrl = tenantSlug
    ? `/login?tenant=${encodeURIComponent(tenantSlug)}`
    : '/login'

  if (typeof window !== 'undefined') {
    window.location.href = loginUrl
  }
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init)

  if (res.status !== 401) return res

  // Try to refresh the token
  const refreshed = await tryRefresh()

  if (!refreshed) {
    // Session is truly gone — redirect to login
    redirectToLogin()
    // Return the original 401 so any awaiting code sees it immediately
    return res
  }

  // Retry the original request with the new cookie (set by the refresh endpoint)
  return fetch(input, init)
}
