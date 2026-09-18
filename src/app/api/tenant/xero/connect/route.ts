import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { xeroAuthUrl } from '@/lib/xero/client'
import { newOAuthState, oauthStateCookie } from '@/lib/auth/oauthState'

// GET /api/tenant/xero/connect
// Returns the Xero OAuth2 authorization URL; frontend redirects the user there.
export async function GET() {
  const guard = await apiGuard('payroll:write')
  if (guard.error) return guard.error

  if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Xero integration is not configured. Add XERO_CLIENT_ID and XERO_CLIENT_SECRET to your environment variables.' },
      { status: 503 },
    )
  }

  // State is "<tenantId>:<nonce>" and is also pinned to this browser via an httpOnly cookie;
  // the callback rejects any state that doesn't match it (CSRF / account-linking protection).
  const state = newOAuthState(guard.session.tenantId)
  const res = NextResponse.json({ url: xeroAuthUrl(state) })
  res.cookies.set(oauthStateCookie('xero', state))
  return res
}
