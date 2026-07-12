import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getXeroTokens, clearXeroTokens } from '@/lib/xero/client'

// GET /api/tenant/xero/status — returns connection state
export async function GET() {
  const guard = await apiGuard('payroll:read')
  if (guard.error) return guard.error

  const tokens = await getXeroTokens(guard.session.tenantId)
  if (!tokens) return NextResponse.json({ connected: false })

  const expired = Date.now() > tokens.expiresAt

  return NextResponse.json({
    connected:    true,
    orgName:      tokens.orgName,
    xeroTenantId: tokens.xeroTenantId,
    tokenExpired: expired,
  })
}

// DELETE /api/tenant/xero/status — disconnect Xero
export async function DELETE() {
  const guard = await apiGuard('payroll:write')
  if (guard.error) return guard.error

  await clearXeroTokens(guard.session.tenantId)
  return NextResponse.json({ ok: true })
}
