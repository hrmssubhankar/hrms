/**
 * POST /api/tenant/roster/timesheets
 *
 * Auto-fill timesheet entries from published/completed shifts for a given week.
 * Skips shifts that already have a linked timesheet.
 * Returns { created, skipped, results }.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts, timesheets } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('rostering:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const weekStartParam = body.weekStart as string | undefined

    const weekStart = weekStartParam ? new Date(weekStartParam) : getMondayOf(new Date())
    const weekEnd   = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Fetch published/completed shifts for the week
    const eligibleShifts = await db
      .select({
        id:         shifts.id,
        employeeId: shifts.employeeId,
        startTime:  shifts.startTime,
        endTime:    shifts.endTime,
        shiftType:  shifts.shiftType,
        location:   shifts.location,
      })
      .from(shifts)
      .where(
        and(
          eq(shifts.tenantId, session.tenantId),
          gte(shifts.startTime, weekStart),
          lte(shifts.startTime, weekEnd),
          inArray(shifts.status, ['published', 'completed', 'confirmed']),
        )
      )

    if (eligibleShifts.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: 0,
        results: [],
        message: 'No published/completed shifts found for this week.',
      })
    }

    // Find shifts that already have a timesheet
    const shiftIds = eligibleShifts.map(s => s.id)
    const existing = await db
      .select({ shiftId: timesheets.shiftId })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.tenantId, session.tenantId),
          inArray(timesheets.shiftId, shiftIds),
        )
      )
    const alreadyFilled = new Set(existing.map(e => e.shiftId))

    const toCreate = eligibleShifts.filter(s => !alreadyFilled.has(s.id))
    const skipped  = eligibleShifts.length - toCreate.length

    const results: Array<{ shiftId: string; status: 'created' | 'failed'; reason?: string }> = []

    for (const shift of toCreate) {
      try {
        const durationHrs =
          (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000

        await db.insert(timesheets).values({
          tenantId:    session.tenantId,
          employeeId:  shift.employeeId,
          shiftId:     shift.id,
          clockIn:     shift.startTime,
          clockOut:    shift.endTime,
          hoursWorked: String(durationHrs.toFixed(2)),
          status:      'pending',
        })
        results.push({ shiftId: shift.id, status: 'created' })
      } catch (err: any) {
        results.push({ shiftId: shift.id, status: 'failed', reason: err.message })
      }
    }

    const created = results.filter(r => r.status === 'created').length
    const failed  = results.filter(r => r.status === 'failed').length

    return NextResponse.json({ created, skipped, failed, results }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
