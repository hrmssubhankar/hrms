/**
 * POST /api/tenant/reports-analytics/run
 * Execute an ad-hoc or custom report and return data
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  employees, leaveRequests, payrollRuns, shifts,
  screeningRecords, expenseClaims, separationRecords,
} from '@/lib/db/schema'
import { eq, and, gte, lte, count, sum, sql, desc, asc, isNotNull } from 'drizzle-orm'
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
      if (filters.status)    where.push(eq(leaveRequests.status, filters.status))
      if (filters.leaveType) where.push(eq(leaveRequests.leaveType, filters.leaveType))

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

    case 'leave_liability': {
      // Dollar value of accrued leave — estimate from hourly rate × standard weeks accrued
      // Uses tenure-based estimate since we don't store leave balance directly
      const rows = await db
        .select({
          employeeNumber: employees.employeeNumber,
          firstName:      employees.firstName,
          lastName:       employees.lastName,
          employmentType: employees.employmentType,
          annualSalary:   employees.annualSalary,
          hourlyRate:     employees.hourlyRate,
          startDate:      employees.startDate,
          // Weeks of tenure / 52 × 4 weeks AL entitlement × hourly rate × 38 hrs
          estimatedLiability: sql<string>`
            ROUND(
              COALESCE(
                ${employees.hourlyRate}::numeric,
                ${employees.annualSalary}::numeric / 52 / 38,
                0
              ) * 38 *
              LEAST(
                EXTRACT(EPOCH FROM (NOW() - ${employees.startDate}::date)) / 86400 / 365 * 4,
                20
              ),
              2
            )
          `,
        })
        .from(employees)
        .where(and(
          eq(employees.tenantId, tenantId),
          eq(employees.isActive, true),
        ))
        .orderBy(desc(sql`estimated_liability`))
      return NextResponse.json({ reportType, data: rows })
    }

    case 'payroll_summary': {
      const rows = await db
        .select({
          runId:         payrollRuns.id,
          runName:       payrollRuns.name,
          periodStart:   payrollRuns.periodStart,
          periodEnd:     payrollRuns.periodEnd,
          totalGross:    payrollRuns.totalGross,
          totalNet:      payrollRuns.totalNet,
          totalTax:      payrollRuns.totalTax,
          totalSuper:    payrollRuns.totalSuper,
          employeeCount: payrollRuns.employeeCount,
          status:        payrollRuns.status,
        })
        .from(payrollRuns)
        .where(eq(payrollRuns.tenantId, tenantId))
        .orderBy(desc(payrollRuns.periodStart))
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

    case 'compliance_expiry': {
      const days = parseInt(filters.days || '30', 10)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + days)

      const rows = await db
        .select({
          firstName:      employees.firstName,
          lastName:       employees.lastName,
          employmentType: employees.employmentType,
          checkType:      screeningRecords.checkType,
          status:         screeningRecords.status,
          expiryDate:     screeningRecords.expiryDate,
          referenceNumber: screeningRecords.referenceNumber,
        })
        .from(screeningRecords)
        .innerJoin(employees, eq(employees.id, screeningRecords.employeeId))
        .where(and(
          eq(screeningRecords.tenantId, tenantId),
          isNotNull(screeningRecords.expiryDate),
          lte(screeningRecords.expiryDate, cutoff.toISOString().split('T')[0]),
        ))
        .orderBy(asc(screeningRecords.expiryDate))
      return NextResponse.json({ reportType, data: rows })
    }

    case 'turnover': {
      const where = [eq(separationRecords.tenantId, tenantId)]
      if (filters.startDate) where.push(gte(separationRecords.lastWorkingDay, filters.startDate))
      if (filters.endDate)   where.push(lte(separationRecords.lastWorkingDay, filters.endDate))

      const rows = await db
        .select({
          type:   separationRecords.type,
          status: separationRecords.status,
          total:  count(separationRecords.id),
        })
        .from(separationRecords)
        .where(and(...where))
        .groupBy(separationRecords.type, separationRecords.status)
      return NextResponse.json({ reportType, data: rows })
    }

    case 'ndis_workforce': {
      const rows = await db
        .select({
          employeeNumber:    employees.employeeNumber,
          firstName:         employees.firstName,
          lastName:          employees.lastName,
          email:             employees.email,
          phone:             employees.phone,
          employmentType:    employees.employmentType,
          awardClassification: employees.awardClassification,
          ndisWorker:        employees.ndisWorker,
          startDate:         employees.startDate,
          complianceStatus:  employees.complianceStatus,
        })
        .from(employees)
        .where(and(
          eq(employees.tenantId, tenantId),
          eq(employees.isActive, true),
          eq(employees.ndisWorker, true),
        ))
        .orderBy(asc(employees.lastName))
      return NextResponse.json({ reportType, data: rows })
    }

    case 'expense_summary': {
      const where = [eq(expenseClaims.tenantId, tenantId)]
      if (filters.startDate) where.push(gte(expenseClaims.expenseDate, filters.startDate))
      if (filters.endDate)   where.push(lte(expenseClaims.expenseDate, filters.endDate))
      if (filters.status)    where.push(eq(expenseClaims.status, filters.status))

      const rows = await db
        .select({
          category:    expenseClaims.category,
          status:      expenseClaims.status,
          total:       count(expenseClaims.id),
          totalAmount: sum(expenseClaims.amount),
        })
        .from(expenseClaims)
        .where(and(...where))
        .groupBy(expenseClaims.category, expenseClaims.status)
      return NextResponse.json({ reportType, data: rows })
    }

    default:
      return NextResponse.json({ error: `Unknown reportType: ${reportType}` }, { status: 400 })
  }
}
