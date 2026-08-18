/**
 * GET  /api/tenant/roster-shifts/shifts?weekStart=YYYY-MM-DD
 * POST /api/tenant/roster-shifts/shifts
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts, employees } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'weekStart is required' }, { status: 400 })

  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 7)

  const rows = await db
    .select({
      id:            shifts.id,
      employeeId:    shifts.employeeId,
      participantId: shifts.participantId,
      startTime:     shifts.startTime,
      endTime:       shifts.endTime,
      shiftType:     shifts.shiftType,
      location:      shifts.location,
      clientSite:    shifts.clientSite,
      status:        shifts.status,
      notes:         shifts.notes,
      firstName:     employees.firstName,
      lastName:      employees.lastName,
      employmentType: employees.employmentType,
    })
    .from(shifts)
    .leftJoin(employees, eq(shifts.employeeId, employees.id))
    .where(and(
      eq(shifts.tenantId, tenantId),
      gte(shifts.startTime, start),
      lte(shifts.startTime, end),
    ))
    .orderBy(shifts.startTime)

  return NextResponse.json({ shifts: rows })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const body = await req.json()
  const { employeeId, participantId, startTime, endTime, shiftType, location, clientSite, notes } = body

  if (!employeeId || !startTime || !endTime)
    return NextResponse.json({ error: 'employeeId, startTime, endTime are required' }, { status: 400 })

  const [created] = await db.insert(shifts).values({
    tenantId,
    employeeId,
    participantId:    participantId    || null,
    startTime:        new Date(startTime),
    endTime:          new Date(endTime),
    shiftType:        shiftType        || 'standard',
    location:         location         || null,
    clientSite:       clientSite       || null,
    notes:            notes            || null,
    status:           'draft',
    compliancePassed: false,
  }).returning()

  return NextResponse.json({ shift: created }, { status: 201 })
}
