import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts, timesheets, employees } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const employeeId = searchParams.get('employeeId')
    const from = searchParams.get('from')
    const to   = searchParams.get('to')
    const view = searchParams.get('view') ?? 'shifts'

    const conditions = [eq(shifts.tenantId, session.tenantId)]
    if (employeeId) conditions.push(eq(shifts.employeeId, employeeId))
    if (from) conditions.push(gte(shifts.startTime, new Date(from)))
    if (to)   conditions.push(lte(shifts.startTime, new Date(to)))

    const shiftList = await db.select({
      id: shifts.id, employeeId: shifts.employeeId,
      startTime: shifts.startTime, endTime: shifts.endTime,
      location: shifts.location, clientSite: shifts.clientSite,
      status: shifts.status, compliancePassed: shifts.compliancePassed,
      notes: shifts.notes, createdAt: shifts.createdAt,
      employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
    }).from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .where(and(...conditions)).orderBy(shifts.startTime)

    if (view === 'timesheets') {
      const tsConditions = [eq(timesheets.tenantId, session.tenantId)]
      if (employeeId) tsConditions.push(eq(timesheets.employeeId, employeeId))
      const tsList = await db.select({
        id: timesheets.id, employeeId: timesheets.employeeId,
        shiftId: timesheets.shiftId, clockIn: timesheets.clockIn,
        clockOut: timesheets.clockOut, hoursWorked: timesheets.hoursWorked,
        approvedAt: timesheets.approvedAt, status: timesheets.status,
        employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
      }).from(timesheets)
        .leftJoin(employees, eq(timesheets.employeeId, employees.id))
        .where(and(...tsConditions)).orderBy(desc(timesheets.clockIn))
      return NextResponse.json({ shifts: shiftList, timesheets: tsList })
    }

    const stats = {
      total:     shiftList.length,
      scheduled: shiftList.filter(s => s.status === 'scheduled').length,
      completed: shiftList.filter(s => s.status === 'completed').length,
      cancelled: shiftList.filter(s => s.status === 'cancelled').length,
    }
    return NextResponse.json({ shifts: shiftList, stats })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()

    if (body._type === 'timesheet') {
      const { employeeId, shiftId, clockIn, clockOut, hoursWorked } = body
      if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
      const [record] = await db.insert(timesheets).values({
        tenantId: session.tenantId, employeeId,
        shiftId: shiftId || null,
        clockIn: clockIn ? new Date(clockIn) : null,
        clockOut: clockOut ? new Date(clockOut) : null,
        hoursWorked: hoursWorked || null, status: 'pending',
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    const { employeeId, startTime, endTime, location, clientSite, notes } = body
    if (!employeeId || !startTime || !endTime) return NextResponse.json({ error: 'employeeId, startTime, endTime required' }, { status: 400 })
    const [record] = await db.insert(shifts).values({
      tenantId: session.tenantId, employeeId,
      startTime: new Date(startTime), endTime: new Date(endTime),
      location: location || null, clientSite: clientSite || null,
      notes: notes || null, status: 'scheduled', compliancePassed: false,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, _type = 'shift', status, approvedAt, hoursWorked } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    if (_type === 'timesheet') {
      const updates: Record<string, unknown> = {}
      if (status    !== undefined) updates.status    = status
      if (hoursWorked !== undefined) updates.hoursWorked = hoursWorked
      if (status === 'approved') updates.approvedAt = new Date()
      const [updated] = await db.update(timesheets).set(updates)
        .where(and(eq(timesheets.id, id), eq(timesheets.tenantId, session.tenantId))).returning()
      return NextResponse.json({ record: updated })
    }

    const [updated] = await db.update(shifts).set({ status })
      .where(and(eq(shifts.id, id), eq(shifts.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
