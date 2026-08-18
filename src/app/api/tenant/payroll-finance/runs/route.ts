/**
 * GET  /api/tenant/payroll-finance/runs
 * POST /api/tenant/payroll-finance/runs
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRuns } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('payroll_finance:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const runs = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.tenantId, tenantId))
    .orderBy(desc(payrollRuns.createdAt))

  return NextResponse.json({ runs })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('payroll_finance:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const { name, periodStart, periodEnd, payDate, frequency, notes } = await req.json()
  if (!name || !periodStart || !periodEnd)
    return NextResponse.json({ error: 'name, periodStart, periodEnd are required' }, { status: 400 })

  const [created] = await db.insert(payrollRuns).values({
    tenantId,
    name,
    periodStart,
    periodEnd,
    payDate: payDate || null,
    frequency: frequency || 'fortnightly',
    notes: notes || null,
    status: 'draft',
    createdBy: email,
  }).returning()

  return NextResponse.json({ run: created }, { status: 201 })
}
