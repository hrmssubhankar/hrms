import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { myobAuthUrl } from '@/lib/myob/client'
import { newOAuthState, oauthStateCookie } from '@/lib/auth/oauthState'

// GET /api/tenant/myob/connect
// Returns the MYOB OAuth2 authorization URL; frontend redirects there.
export async function GET() {
  const guard = await apiGuard('payroll:write')
  if (guard.error) return guard.error

  if (!process.env.MYOB_CLIENT_ID || !process.env.MYOB_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'MYOB integration is not configured. Add MYOB_CLIENT_ID and MYOB_CLIENT_SECRET to environment variables.' },
      { status: 503 },
    )
  }

  // State is "<tenantId>:<nonce>" and is also pinned to this browser via an httpOnly cookie;
  // the callback rejects any state that doesn't match it (CSRF / account-linking protection).
  const state = newOAuthState(guard.session.tenantId)
  const res = NextResponse.json({ url: myobAuthUrl(state) })
  res.cookies.set(oauthStateCookie('myob', state))
  return res
}
