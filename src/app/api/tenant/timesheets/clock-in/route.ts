/**
 * POST /api/tenant/timesheets/clock-in
 *
 * Creates a timesheet entry with clockIn = now.
 * Optionally links to a shift (if employee has one scheduled for today).
 * Returns 409 if employee is already clocked in.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timesheets, employees, shifts } from '@/lib/db/schema'
import { eq, and, isNull, gte, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await apiGuard('timesheets:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json().catch(() => ({}))

    // Resolve employee record
    const [emp] = await db
      .select({ id: employees.id, firstName: employees.firstName })
      .from(employees)
      .where(and(eq(employees.userId, session.sub), eq(employees.tenantId, session.tenantId)))
      .limit(1)

    if (!emp) {
      return NextResponse.json(
        { error: 'No employee record is linked to your account. Contact HR.' },
        { status: 404 }
      )
    }

    // Check for open clock-in (no clockOut)
    const [openEntry] = await db
      .select({ id: timesheets.id })
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

    if (openEntry) {
      return NextResponse.json(
        { error: 'You are already clocked in. Clock out before starting a new entry.', timesheetId: openEntry.id },
        { status: 409 }
      )
    }

    const now = new Date()

    // Auto-link to today's published shift if one exists
    let shiftId: string | null = body.shiftId ?? null
    if (!shiftId) {
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
      const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)

      const [todayShift] = await db
        .select({ id: shifts.id })
        .from(shifts)
        .where(
          and(
            eq(shifts.employeeId, emp.id),
            eq(shifts.tenantId, session.tenantId),
            eq(shifts.status, 'published'),
            gte(shifts.startTime, todayStart),
            lte(shifts.startTime, todayEnd),
          )
        )
        .limit(1)

      shiftId = todayShift?.id ?? null
    }

    const [entry] = await db.insert(timesheets).values({
      tenantId:     session.tenantId,
      employeeId:   emp.id,
      shiftId,
      clockIn:      now,
      breakMinutes: 0,
      status:       'pending',
    }).returning()

    return NextResponse.json({ ok: true, timesheet: entry, clockIn: now })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
