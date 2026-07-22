/**
 * GET  /api/tenant/timesheets  — list timesheets (managers see all; employees see own)
 * POST /api/tenant/timesheets  — manually submit a timesheet entry
 *
 * Query params:
 *   status     — filter by status (pending|submitted|approved|rejected)
 *   employeeId — HR/manager filter
 *   weekStart  — ISO date (Monday)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timesheets, employees, shifts, participants } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('timesheets:read')
  if (guard.error) return guard.error
  const { session } = guard

  const statusFilter = req.nextUrl.searchParams.get('status')
  const empFilter    = req.nextUrl.searchParams.get('employeeId')
  const weekStart    = req.nextUrl.searchParams.get('weekStart')

  // Employees can only see their own timesheets
  const isManager = hasPermission(session.userRole, 'timesheets:approve')
  const userId    = session.sub

  try {
    // Get employee record for current user (to filter for employees)
    let myEmployeeId: string | null = null
    if (!isManager) {
      const [emp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.userId, userId), eq(employees.tenantId, session.tenantId)))
        .limit(1)
      myEmployeeId = emp?.id ?? null
    }

    const conditions: any[] = [eq(timesheets.tenantId, session.tenantId)]

    if (!isManager && myEmployeeId) conditions.push(eq(timesheets.employeeId, myEmployeeId))
    if (isManager && empFilter)     conditions.push(eq(timesheets.employeeId, empFilter))
    if (statusFilter)               conditions.push(eq(timesheets.status, statusFilter))
    if (weekStart) {
      const start = new Date(weekStart)
      const end   = new Date(start); end.setDate(end.getDate() + 7)
      conditions.push(gte(timesheets.clockIn, start), lte(timesheets.clockIn, end))
    }

    const rows = await db
      .select({
        id:             timesheets.id,
        employeeId:     timesheets.employeeId,
        shiftId:        timesheets.shiftId,
        clockIn:        timesheets.clockIn,
        clockOut:       timesheets.clockOut,
        breakMinutes:   timesheets.breakMinutes,
        hoursWorked:    timesheets.hoursWorked,
        notes:          timesheets.notes,
        status:         timesheets.status,
        approvedAt:     timesheets.approvedAt,
        rejectedReason: timesheets.rejectedReason,
        createdAt:      timesheets.createdAt,
        // Employee
        empFirst:       employees.firstName,
        empLast:        employees.lastName,
        empEmail:       employees.email,
        // Shift details
        shiftStart:     shifts.startTime,
        shiftEnd:       shifts.endTime,
        shiftType:      shifts.shiftType,
        location:       shifts.location,
        // Participant
        partFirst:      participants.firstName,
        partLast:       participants.lastName,
      })
      .from(timesheets)
      .leftJoin(employees,    eq(timesheets.employeeId, employees.id))
      .leftJoin(shifts,       eq(timesheets.shiftId,    shifts.id))
      .leftJoin(participants, eq(shifts.participantId,  participants.id))
      .where(and(...conditions))
      .orderBy(desc(timesheets.createdAt))
      .limit(200)

    return NextResponse.json({ timesheets: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('timesheets:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { shiftId, clockIn, clockOut, breakMinutes, notes } = body

    if (!clockIn) {
      return NextResponse.json({ error: 'clockIn is required' }, { status: 400 })
    }

    // Get employee for current user
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.userId, session.sub), eq(employees.tenantId, session.tenantId)))
      .limit(1)

    if (!emp) {
      return NextResponse.json({ error: 'No employee record linked to your account' }, { status: 404 })
    }

    // Validate shift if provided
    if (shiftId) {
      const [shift] = await db
        .select({ id: shifts.id })
        .from(shifts)
        .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, session.tenantId)))
        .limit(1)
      if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const clockInDate  = new Date(clockIn)
    const clockOutDate = clockOut ? new Date(clockOut) : null
    const breaks       = Math.max(0, Number(breakMinutes) || 0)
    const hours        = clockOutDate
      ? Math.max(0, (clockOutDate.getTime() - clockInDate.getTime()) / 3_600_000 - breaks / 60)
      : null

    const [entry] = await db.insert(timesheets).values({
      tenantId:     session.tenantId,
      employeeId:   emp.id,
      shiftId:      shiftId || null,
      clockIn:      clockInDate,
      clockOut:     clockOutDate,
      breakMinutes: breaks,
      hoursWorked:  hours ? String(hours.toFixed(2)) : null,
      notes:        notes || null,
      status:       clockOutDate ? 'submitted' : 'pending',
    }).returning()

    return NextResponse.json({ timesheet: entry }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
