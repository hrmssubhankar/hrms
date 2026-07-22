/**
 * POST /api/tenant/timesheets/clock-out
 *
 * Closes the open clock-in for the current employee.
 * Body: { breakMinutes?: number, notes?: string }
 * Returns 404 if not clocked in.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timesheets, employees } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await apiGuard('timesheets:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const breakMinutes = Math.max(0, Number(body.breakMinutes) || 0)
    const notes        = body.notes as string | undefined

    // Resolve employee
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.userId, session.sub), eq(employees.tenantId, session.tenantId)))
      .limit(1)

    if (!emp) {
      return NextResponse.json({ error: 'No employee record linked to your account.' }, { status: 404 })
    }

    // Find open clock-in
    const [open] = await db
      .select({ id: timesheets.id, clockIn: timesheets.clockIn })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, emp.id),
          eq(timesheets.tenantId, session.tenantId),
          isNull(timesheets.clockOut),
          eq(timesheets.status, 'pending'),
        )
      )
      .limit(1)

    if (!open || !open.clockIn) {
      return NextResponse.json({ error: 'You are not currently clocked in.' }, { status: 404 })
    }

    const now      = new Date()
    const msWorked = now.getTime() - open.clockIn.getTime()
    const hours    = Math.max(0, msWorked / 3_600_000 - breakMinutes / 60)

    const [updated] = await db
      .update(timesheets)
      .set({
        clockOut:     now,
        breakMinutes,
        hoursWorked:  String(hours.toFixed(2)),
        notes:        notes ?? null,
        status:       'submitted',
        updatedAt:    now,
      })
      .where(eq(timesheets.id, open.id))
      .returning()

    return NextResponse.json({
      ok:          true,
      timesheet:   updated,
      clockOut:    now,
      hoursWorked: hours.toFixed(2),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
