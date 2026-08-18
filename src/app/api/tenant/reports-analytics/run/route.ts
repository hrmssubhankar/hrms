/**
 * POST /api/tenant/reports-analytics/run
 * Execute an ad-hoc report and return data
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, leaveRequests, payrollRunEntries, payrollRuns, shifts } from '@/lib/db/schema'
import { eq, and, gte, lte, count, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await apiGuard('reports_analytics:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { reportType, filters = {} } = await req.json()

  switch (reportType) {
    case 'headcount': {
      const rows = await db
        .select({
          employmentType: employees.employmentType,
          total: count(employees.id),
        })
        .from(employees)
        .where(and(
          eq(employees.tenantId, tenantId),
          eq(employees.isActive, true),
        ))
        .groupBy(employees.employmentType)
      return NextResponse.json({ reportType, data: rows })
    }

    case 'leave_summary': {
      const where = [eq(leaveRequests.tenantId, tenantId)]
      if (filters.startDate) where.push(gte(leaveRequests.startDate, filters.startDate))
      if (filters.endDate)   where.push(lte(leaveRequests.startDate, filters.endDate))

      const rows = await db
        .select({
          leaveType: leaveRequests.leaveType,
          status:    leaveRequests.status,
          total:     count(leaveRequests.id),
        })
        .from(leaveRequests)
        .where(and(...where))
        .groupBy(leaveRequests.leaveType, leaveRequests.status)
      return NextResponse.json({ reportType, data: rows })
    }

    case 'payroll_summary': {
      const rows = await db
        .select({
          runId:       payrollRuns.id,
          runName:     payrollRuns.name,
          periodStart: payrollRuns.periodStart,
          periodEnd:   payrollRuns.periodEnd,
          totalGross:  payrollRuns.totalGross,
          totalNet:    payrollRuns.totalNet,
          totalTax:    payrollRuns.totalTax,
          totalSuper:  payrollRuns.totalSuper,
          employeeCount: payrollRuns.employeeCount,
          status:      payrollRuns.status,
        })
        .from(payrollRuns)
        .where(eq(payrollRuns.tenantId, tenantId))
      return NextResponse.json({ reportType, data: rows })
    }

    case 'shift_summary': {
      const where = [eq(shifts.tenantId, tenantId)]
      if (filters.startDate) where.push(gte(shifts.startTime, new Date(filters.startDate)))
      if (filters.endDate)   where.push(lte(shifts.startTime, new Date(filters.endDate)))

      const rows = await db
        .select({
          shiftType: shifts.shiftType,
          status:    shifts.status,
          total:     count(shifts.id),
        })
        .from(shifts)
        .where(and(...where))
        .groupBy(shifts.shiftType, shifts.status)
      return NextResponse.json({ reportType, data: rows })
    }

    default:
      return NextResponse.json({ error: `Unknown reportType: ${reportType}` }, { status: 400 })
  }
}
