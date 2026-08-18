/**
 * GET /api/tenant/self-service/payslips
 * Returns own payroll run entries (payslip history)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRunEntries, payrollRuns, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('self_service:read')
  if (guard.error) return guard.error
  const { tenantId, sub } = guard.session

  const [emp] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.userId, sub)))

  if (!emp) return NextResponse.json({ payslips: [] })

  const rows = await db
    .select({
      entryId:      payrollRunEntries.id,
      runId:        payrollRunEntries.runId,
      runName:      payrollRuns.name,
      periodStart:  payrollRuns.periodStart,
      periodEnd:    payrollRuns.periodEnd,
      payDate:      payrollRuns.payDate,
      hoursWorked:  payrollRunEntries.hoursWorked,
      grossPay:     payrollRunEntries.grossPay,
      netPay:       payrollRunEntries.netPay,
      paygWithholding: payrollRunEntries.paygWithholding,
      superContribution: payrollRunEntries.superContribution,
    })
    .from(payrollRunEntries)
    .leftJoin(payrollRuns, eq(payrollRunEntries.runId, payrollRuns.id))
    .where(and(
      eq(payrollRunEntries.tenantId, tenantId),
      eq(payrollRunEntries.employeeId, emp.id),
    ))
    .orderBy(desc(payrollRuns.periodEnd))

  return NextResponse.json({ payslips: rows })
}
