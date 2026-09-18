import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { clearOAuthStateCookie, oauthStateCookieName, validateOAuthState } from '@/lib/auth/oauthState'
import {
  myobExchangeCode, listMyobCompanyFiles, saveMyobTokens,
} from '@/lib/myob/client'

// GET /api/tenant/myob/callback?code=...&state=...
// MYOB redirects here after authorization. Exchange code → tokens,
// pick the first company file, save to tenant settings.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''
  const settingsUrl = `${appUrl}/tenant/settings?tab=integrations`

  // Every exit clears the one-time state cookie
  const redirect = (url: string) => {
    const res = NextResponse.redirect(url)
    res.cookies.set(clearOAuthStateCookie('myob'))
    return res
  }

  if (error) {
    return redirect(`${settingsUrl}&myob_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return redirect(`${settingsUrl}&myob_error=missing_params`)
  }

  // The callback is only valid for the logged-in user who started the flow:
  // require a session with the same permission `connect` needs, and a state that
  // matches the httpOnly cookie set by `connect` and the session's own tenant.
  const guard = await apiGuard('payroll:write')
  if (guard.error) {
    return redirect(`${settingsUrl}&myob_error=unauthorized`)
  }

  const cookieState = req.cookies.get(oauthStateCookieName('myob'))?.value
  const tenantId = validateOAuthState(state, cookieState, guard.session.tenantId)
  if (!tenantId) {
    return redirect(`${settingsUrl}&myob_error=invalid_state`)
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await myobExchangeCode(code)

    // Get the list of MYOB company files and pick the first
    const files = await listMyobCompanyFiles(accessToken)
    if (files.length === 0) {
      return redirect(`${settingsUrl}&myob_error=no_company_files`)
    }

    const { Uri: companyFileUri, Name: companyFileName } = files[0]

    await saveMyobTokens(tenantId, {
      accessToken, refreshToken, expiresAt,
      companyFileUri, companyFileName,
    })

    return redirect(`${settingsUrl}&myob_success=1`)
  } catch (err: any) {
    console.error('MYOB callback error:', err)
    return redirect(
      `${settingsUrl}&myob_error=${encodeURIComponent(err.message ?? 'unknown')}`,
    )
  }
}
