/**
 * GET   /api/tenant/payroll-finance/runs/[runId]
 * PATCH /api/tenant/payroll-finance/runs/[runId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRuns } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const guard = await apiGuard('payroll_finance:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { runId } = await params

  const [run] = await db.select().from(payrollRuns)
    .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)))

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  return NextResponse.json({ run })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const guard = await apiGuard('payroll_finance:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { runId } = await params

  const body = await req.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status    !== undefined) updates.status    = body.status
  if (body.notes     !== undefined) updates.notes     = body.notes
  if (body.payDate   !== undefined) updates.payDate   = body.payDate
  if (body.totalGross!== undefined) updates.totalGross= body.totalGross
  if (body.totalNet  !== undefined) updates.totalNet  = body.totalNet
  if (body.totalTax  !== undefined) updates.totalTax  = body.totalTax
  if (body.totalSuper!== undefined) updates.totalSuper= body.totalSuper
  if (body.employeeCount!==undefined) updates.employeeCount = body.employeeCount

  if (body.status === 'finalised') {
    updates.finalisedBy = email
    updates.finalisedAt = new Date()
  }

  const [updated] = await db.update(payrollRuns)
    .set(updates)
    .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  return NextResponse.json({ run: updated })
}
