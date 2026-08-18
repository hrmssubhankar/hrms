/**
 * GET  /api/tenant/payroll-finance/runs/[runId]/entries
 * POST /api/tenant/payroll-finance/runs/[runId]/entries
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRunEntries, payrollRuns } from '@/lib/db/schema'
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

  const entries = await db
    .select()
    .from(payrollRunEntries)
    .where(and(
      eq(payrollRunEntries.runId, runId),
      eq(payrollRunEntries.tenantId, tenantId),
    ))

  return NextResponse.json({ entries })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const guard = await apiGuard('payroll_finance:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { runId } = await params

  // Verify run belongs to tenant
  const [run] = await db.select({ id: payrollRuns.id })
    .from(payrollRuns)
    .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)))
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

  const body = await req.json()
  const {
    employeeId, employeeNumber, firstName, lastName, employmentType,
    hoursWorked, hourlyRate, ordinaryPay, overtimePay, allowances,
    grossPay, paygWithholding, medicareLevy, otherDeductions,
    superContribution, netPay, leaveAccrued, notes,
  } = body

  if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })

  const [created] = await db.insert(payrollRunEntries).values({
    tenantId, runId, employeeId,
    employeeNumber: employeeNumber || null,
    firstName:      firstName      || null,
    lastName:       lastName       || null,
    employmentType: employmentType || null,
    hoursWorked:    hoursWorked    ?? '0',
    hourlyRate:     hourlyRate     ?? '0',
    ordinaryPay:    ordinaryPay    ?? '0',
    overtimePay:    overtimePay    ?? '0',
    allowances:     allowances     ?? '0',
    grossPay:       grossPay       ?? '0',
    paygWithholding:paygWithholding?? '0',
    medicareLevy:   medicareLevy   ?? '0',
    otherDeductions:otherDeductions?? '0',
    superContribution: superContribution ?? '0',
    netPay:         netPay         ?? '0',
    leaveAccrued:   leaveAccrued   ?? '0',
    notes:          notes          || null,
  }).returning()

  return NextResponse.json({ entry: created }, { status: 201 })
}
