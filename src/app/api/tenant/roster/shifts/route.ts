/**
 * GET  /api/tenant/roster/shifts  — list shifts for a week
 * POST /api/tenant/roster/shifts  — create a shift
 *
 * Query params:
 *   weekStart  — ISO date (Monday), e.g. 2026-07-21
 *   employeeId — filter by employee (optional)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts, employees, participants } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('rostering:read')
  if (guard.error) return guard.error
  const { session } = guard

  const weekStartParam = req.nextUrl.searchParams.get('weekStart')
  const empFilter      = req.nextUrl.searchParams.get('employeeId')

  // Default to current week Monday
  const weekStart = weekStartParam ? new Date(weekStartParam) : getMondayOf(new Date())
  const weekEnd   = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  try {
    const rows = await db
      .select({
        id:             shifts.id,
        employeeId:     shifts.employeeId,
        participantId:  shifts.participantId,
        startTime:      shifts.startTime,
        endTime:        shifts.endTime,
        shiftType:      shifts.shiftType,
        location:       shifts.location,
        clientSite:     shifts.clientSite,
        status:         shifts.status,
        publishedAt:    shifts.publishedAt,
        notes:          shifts.notes,
        compliancePassed: shifts.compliancePassed,
        // Employee
        empFirst:       employees.firstName,
        empLast:        employees.lastName,
        empEmail:       employees.email,
        // Participant
        partFirst:      participants.firstName,
        partLast:       participants.lastName,
        partNdis:       participants.ndisNumber,
      })
      .from(shifts)
      .leftJoin(employees,    eq(shifts.employeeId,    employees.id))
      .leftJoin(participants, eq(shifts.participantId, participants.id))
      .where(
        and(
          eq(shifts.tenantId, session.tenantId),
          gte(shifts.startTime, weekStart),
          lte(shifts.startTime, weekEnd),
          empFilter ? eq(shifts.employeeId, empFilter) : undefined,
        )
      )
      .orderBy(shifts.startTime)

    return NextResponse.json({ shifts: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('rostering:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { employeeId, participantId, startTime, endTime,
            shiftType, location, clientSite, notes } = body

    if (!employeeId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'employeeId, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Verify employee belongs to this tenant
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.tenantId, session.tenantId)))
      .limit(1)

    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const [shift] = await db.insert(shifts).values({
      tenantId:      session.tenantId,
      employeeId,
      participantId: participantId || null,
      startTime:     new Date(startTime),
      endTime:       new Date(endTime),
      shiftType:     shiftType  || 'standard',
      location:      location   || null,
      clientSite:    clientSite || null,
      notes:         notes      || null,
      status:        'draft',
    }).returning()

    return NextResponse.json({ shift }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day) // Sunday = 0, adjust to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
