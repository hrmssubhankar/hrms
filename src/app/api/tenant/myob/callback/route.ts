import { NextRequest, NextResponse } from 'next/server'
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

  if (error) {
    return NextResponse.redirect(`${settingsUrl}&myob_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}&myob_error=missing_params`)
  }

  // State = "<tenantId>:<nonce>"
  const tenantId = state.split(':')[0]
  if (!tenantId || tenantId.length < 10) {
    return NextResponse.redirect(`${settingsUrl}&myob_error=invalid_state`)
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await myobExchangeCode(code)

    // Get the list of MYOB company files and pick the first
    const files = await listMyobCompanyFiles(accessToken)
    if (files.length === 0) {
      return NextResponse.redirect(`${settingsUrl}&myob_error=no_company_files`)
    }

    const { Uri: companyFileUri, Name: companyFileName } = files[0]

    await saveMyobTokens(tenantId, {
      accessToken, refreshToken, expiresAt,
      companyFileUri, companyFileName,
    })

    return NextResponse.redirect(`${settingsUrl}&myob_success=1`)
  } catch (err: any) {
    console.error('MYOB callback error:', err)
    return NextResponse.redirect(
      `${settingsUrl}&myob_error=${encodeURIComponent(err.message ?? 'unknown')}`,
    )
  }
}
