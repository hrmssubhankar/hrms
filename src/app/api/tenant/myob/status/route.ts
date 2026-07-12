import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getMyobTokens, clearMyobTokens } from '@/lib/myob/client'

// GET /api/tenant/myob/status
export async function GET() {
  const guard = await apiGuard('payroll:read')
  if (guard.error) return guard.error

  const tokens = await getMyobTokens(guard.session.tenantId)
  if (!tokens) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected:       true,
    companyFileName: tokens.companyFileName,
    companyFileUri:  tokens.companyFileUri,
    tokenExpired:    Date.now() > tokens.expiresAt,
  })
}

// DELETE /api/tenant/myob/status — disconnect MYOB
export async function DELETE() {
  const guard = await apiGuard('payroll:write')
  if (guard.error) return guard.error

  await clearMyobTokens(guard.session.tenantId)
  return NextResponse.json({ ok: true })
}
