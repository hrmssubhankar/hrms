import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { clearOAuthStateCookie, oauthStateCookieName, validateOAuthState } from '@/lib/auth/oauthState'
import {
  exchangeCode, getXeroConnections, saveXeroTokens,
} from '@/lib/xero/client'

// GET /api/tenant/xero/callback?code=...&state=...
// Xero redirects here after user authorises. Exchange code for tokens,
// pick the first Xero organisation, save to tenant settings, redirect to settings page.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''
  const settingsUrl = `${appUrl}/tenant/settings?tab=integrations`

  // Every exit clears the one-time state cookie
  const redirect = (url: string) => {
    const res = NextResponse.redirect(url)
    res.cookies.set(clearOAuthStateCookie('xero'))
    return res
  }

  if (error) {
    return redirect(`${settingsUrl}&xero_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return redirect(`${settingsUrl}&xero_error=missing_params`)
  }

  // The callback is only valid for the logged-in user who started the flow:
  // require a session with the same permission `connect` needs, and a state that
  // matches the httpOnly cookie set by `connect` and the session's own tenant.
  const guard = await apiGuard('payroll:write')
  if (guard.error) {
    return redirect(`${settingsUrl}&xero_error=unauthorized`)
  }

  const cookieState = req.cookies.get(oauthStateCookieName('xero'))?.value
  const tenantId = validateOAuthState(state, cookieState, guard.session.tenantId)
  if (!tenantId) {
    return redirect(`${settingsUrl}&xero_error=invalid_state`)
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await exchangeCode(code)

    // Get the list of connected Xero organisations and pick the first
    const connections = await getXeroConnections(accessToken)
    if (connections.length === 0) {
      return redirect(`${settingsUrl}&xero_error=no_organisations`)
    }

    const { tenantId: xeroTenantId, tenantName: orgName } = connections[0]

    await saveXeroTokens(tenantId, {
      accessToken, refreshToken, expiresAt,
      xeroTenantId, orgName,
    })

    return redirect(`${settingsUrl}&xero_success=1`)
  } catch (err: any) {
    console.error('Xero callback error:', err)
    return redirect(`${settingsUrl}&xero_error=${encodeURIComponent(err.message ?? 'unknown')}`)
  }
}
