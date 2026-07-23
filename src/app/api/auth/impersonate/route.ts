import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { sessionCookieOptions } from '@/lib/auth/session'

/**
 * GET /api/auth/impersonate?token=<jwt>
 *
 * Called by the super-admin "Login as" flow — the super-admin portal issues an
 * impersonation token then opens this URL on the *tenant* deployment in a new
 * tab. This route (running on the tenant domain) verifies the token, sets the
 * session cookie on the correct domain, and redirects to the tenant dashboard.
 *
 * Never call this from the super-admin domain; the cookie would be scoped to
 * the wrong origin.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'tenant_user') {
    return NextResponse.json({ error: 'Invalid or expired impersonation token' }, { status: 401 })
  }

  const res = NextResponse.redirect(new URL('/tenant/dashboard', req.nextUrl.origin))
  res.cookies.set(sessionCookieOptions(token))
  return res
}
