import { NextRequest, NextResponse } from 'next/server'
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

  if (error) {
    return NextResponse.redirect(`${settingsUrl}&xero_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}&xero_error=missing_params`)
  }

  // State = "<tenantId>:<nonce>"
  const tenantId = state.split(':')[0]
  if (!tenantId || tenantId.length < 10) {
    return NextResponse.redirect(`${settingsUrl}&xero_error=invalid_state`)
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await exchangeCode(code)

    // Get the list of connected Xero organisations and pick the first
    const connections = await getXeroConnections(accessToken)
    if (connections.length === 0) {
      return NextResponse.redirect(`${settingsUrl}&xero_error=no_organisations`)
    }

    const { tenantId: xeroTenantId, tenantName: orgName } = connections[0]

    await saveXeroTokens(tenantId, {
      accessToken, refreshToken, expiresAt,
      xeroTenantId, orgName,
    })

    return NextResponse.redirect(`${settingsUrl}&xero_success=1`)
  } catch (err: any) {
    console.error('Xero callback error:', err)
    return NextResponse.redirect(`${settingsUrl}&xero_error=${encodeURIComponent(err.message ?? 'unknown')}`)
  }
}
