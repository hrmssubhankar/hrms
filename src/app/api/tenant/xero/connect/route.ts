import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { xeroAuthUrl } from '@/lib/xero/client'
import { randomBytes } from 'crypto'

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

  // State encodes tenantId so the callback can look it up without a session cookie
  const state = `${guard.session.tenantId}:${randomBytes(16).toString('hex')}`
  const url   = xeroAuthUrl(state)

  return NextResponse.json({ url })
}
