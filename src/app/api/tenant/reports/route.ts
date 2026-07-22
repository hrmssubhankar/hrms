import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  employees, leaveRequests, screeningRecords, performanceReviews,
  separationRecords, whsIncidents, grievances,
} from '@/lib/db/schema'
import { eq, and, gte, lte, count, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('analytics:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const report    = searchParams.get('report') ?? 'headcount'
  const dateFrom  = searchParams.get('from')
  const dateTo    = searchParams.get('to')

  const tenantId = session.tenantId
  const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), 0, 1)
  const to   = dateTo   ? new Date(dateTo)   : new Date()

  if (report === 'headcount') {
    const all = await db.select({
      id:             employees.id,
      firstName:      employees.firstName,
      lastName:       employees.lastName,
      email:          employees.email,
      employmentType: employees.employmentType,
      startDate:      employees.startDate,
      endDate:        employees.endDate,
      isActive:       employees.isActive,
      complianceStatus: employees.complianceStatus,
    }).from(employees).where(eq(employees.tenantId, tenantId))

    return NextResponse.json({
      report: 'headcount',
      data: all,
      summary: {
        total:       all.length,
        active:      all.filter(e => e.isActive).length,
        inactive:    all.filter(e => !e.isActive).length,
        fullTime:    all.filter(e => e.employmentType === 'full_time').length,
        partTime:    all.filter(e => e.employmentType === 'part_time').length,
        casual:      all.filter(e => e.employmentType === 'casual').length,
        contractor:  all.filter(e => e.employmentType === 'contractor').length,
      },
    })
  }

  if (report === 'leave') {
    const rows = await db.select({
      id:          leaveRequests.id,
      employeeId:  leaveRequests.employeeId,
      leaveType:   leaveRequests.leaveType,
      status:      leaveRequests.status,
      startDate:   leaveRequests.startDate,
      endDate:     leaveRequests.endDate,
      days:        leaveRequests.totalDays,
      firstName:   employees.firstName,
      lastName:    employees.lastName,
    })
      .from(leaveRequests)
      .leftJoin(employees, eq(employees.id, leaveRequests.employeeId))
      .where(and(
        eq(leaveRequests.tenantId, tenantId),
        gte(leaveRequests.startDate, from.toISOString().slice(0, 10)),
        lte(leaveRequests.startDate, to.toISOString().slice(0, 10)),
      ))
      .orderBy(desc(leaveRequests.startDate))

    return NextResponse.json({
      report: 'leave',
      data: rows,
      summary: {
        total:    rows.length,
        approved: rows.filter(r => r.status === 'approved').length,
        pending:  rows.filter(r => r.status === 'pending').length,
        rejected: rows.filter(r => r.status === 'rejected').length,
        totalDays: rows.filter(r => r.status === 'approved').reduce((s, r) => s + (Number(r.days) || 0), 0),
      },
    })
  }

  if (report === 'compliance') {
    const rows = await db.select({
      id:              screeningRecords.id,
      employeeId:      screeningRecords.employeeId,
      checkType:       screeningRecords.checkType,
      status:          screeningRecords.status,
      expiryDate:      screeningRecords.expiryDate,
      referenceNumber: screeningRecords.referenceNumber,
      firstName:       employees.firstName,
      lastName:        employees.lastName,
    })
      .from(screeningRecords)
      .leftJoin(employees, eq(employees.id, screeningRecords.employeeId))
      .where(eq(screeningRecords.tenantId, tenantId))
      .orderBy(screeningRecords.expiryDate)

    const today = new Date()
    const in30  = new Date(today); in30.setDate(in30.getDate() + 30)

    return NextResponse.json({
      report: 'compliance',
      data: rows,
      summary: {
        total:        rows.length,
        green:        rows.filter(r => r.status === 'green').length,
        amber:        rows.filter(r => r.status === 'amber').length,
        red:          rows.filter(r => r.status === 'red').length,
        pending:      rows.filter(r => r.status === 'pending').length,
        expiringSoon: rows.filter(r =>
          r.expiryDate && new Date(r.expiryDate) <= in30 && new Date(r.expiryDate) >= today
        ).length,
      },
    })
  }

  if (report === 'turnover') {
    const rows = await db.select({
      id:         separationRecords.id,
      employeeId: separationRecords.employeeId,
      type:       separationRecords.type,
      reason:     separationRecords.reason,
      lastWorkingDay: separationRecords.lastWorkingDay,
      status:     separationRecords.status,
      firstName:  employees.firstName,
      lastName:   employees.lastName,
    })
      .from(separationRecords)
      .leftJoin(employees, eq(employees.id, separationRecords.employeeId))
      .where(eq(separationRecords.tenantId, tenantId))
      .orderBy(desc(separationRecords.lastWorkingDay))

    return NextResponse.json({
      report: 'turnover',
      data: rows,
      summary: {
        total:       rows.length,
        voluntary:   rows.filter(r => r.type === 'resignation').length,
        involuntary: rows.filter(r => ['termination', 'redundancy'].includes(r.type ?? '')).length,
        other:       rows.filter(r => !['resignation', 'termination', 'redundancy'].includes(r.type ?? '')).length,
      },
    })
  }

  if (report === 'whs') {
    const rows = await db.select({
      id:          whsIncidents.id,
      type:        whsIncidents.type,
      severity:    whsIncidents.severity,
      status:      whsIncidents.status,
      occurredAt:  whsIncidents.occurredAt,
      location:    whsIncidents.location,
      description: whsIncidents.description,
      firstName:   employees.firstName,
      lastName:    employees.lastName,
    })
      .from(whsIncidents)
      .leftJoin(employees, eq(employees.id, whsIncidents.employeeId))
      .where(and(
        eq(whsIncidents.tenantId, tenantId),
        gte(whsIncidents.occurredAt, from),
        lte(whsIncidents.occurredAt, to),
      ))
      .orderBy(desc(whsIncidents.occurredAt))

    return NextResponse.json({
      report: 'whs',
      data: rows,
      summary: {
        total:    rows.length,
        open:     rows.filter(r => r.status === 'open').length,
        closed:   rows.filter(r => r.status === 'closed').length,
        critical: rows.filter(r => r.severity === 'critical').length,
        high:     rows.filter(r => r.severity === 'high').length,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
}
