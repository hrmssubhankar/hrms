import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { myobAuthUrl } from '@/lib/myob/client'
import { randomBytes } from 'crypto'

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

  // State = "<tenantId>:<nonce>" — callback uses the tenantId without needing a session cookie
  const state = `${guard.session.tenantId}:${randomBytes(16).toString('hex')}`
  return NextResponse.json({ url: myobAuthUrl(state) })
}
