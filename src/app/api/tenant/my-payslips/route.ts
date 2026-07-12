import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRecords, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-payslips
 *
 * Returns the logged-in user's own payroll records.
 * Looks up the employee record by userId = session.sub, tenantId = session.tenantId.
 * Uses apiAuth (authentication only, no role permission) because employees don't
 * have payroll:read — but they ARE allowed to view their own payslips.
 * Cross-tenant + cross-employee isolation is enforced by the query itself.
 */
export async function GET() {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  // Find the employee record linked to this user account
  const [emp] = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, email: employees.email })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId,   session.sub as string),
    ))

  if (!emp) {
    // User exists but has no linked employee record yet
    return NextResponse.json({ payslips: [], employeeLinked: false })
  }

  const rows = await db
    .select({
      id:                payrollRecords.id,
      periodStart:       payrollRecords.periodStart,
      periodEnd:         payrollRecords.periodEnd,
      grossPay:          payrollRecords.grossPay,
      paygWithholding:   payrollRecords.paygWithholding,
      medicareLevy:      payrollRecords.medicareLevy,
      superContribution: payrollRecords.superContribution,
      netPay:            payrollRecords.netPay,
      status:            payrollRecords.status,
      payslipData:       payrollRecords.payslipData,
      exportedToXero:    payrollRecords.exportedToXero,
      createdAt:         payrollRecords.createdAt,
    })
    .from(payrollRecords)
    .where(and(
      eq(payrollRecords.tenantId,   session.tenantId),
      eq(payrollRecords.employeeId, emp.id),
    ))
    .orderBy(desc(payrollRecords.periodEnd))

  return NextResponse.json({
    payslips: rows,
    employee: emp,
    employeeLinked: true,
  })
}
