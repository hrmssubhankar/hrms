/**
 * PATCH /api/tenant/timesheets/:id
 *
 * Used by:
 *   - Employees: update notes, breakMinutes (while status = pending)
 *   - Managers:  approve { action: 'approve' } or reject { action: 'reject', reason: '...' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timesheets, employees, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('timesheets:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  try {
    const body = await req.json()
    const isManager = hasPermission(session.userRole, 'timesheets:approve')

    const [existing] = await db
      .select({
        id:         timesheets.id,
        status:     timesheets.status,
        employeeId: timesheets.employeeId,
      })
      .from(timesheets)
      .where(and(eq(timesheets.id, id), eq(timesheets.tenantId, session.tenantId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
    }

    // Manager: approve or reject
    if (isManager && (body.action === 'approve' || body.action === 'reject')) {
      const updates: Record<string, any> = { updatedAt: new Date() }

      if (body.action === 'approve') {
        updates.status     = 'approved'
        updates.approvedBy = session.sub
        updates.approvedAt = new Date()
        updates.rejectedReason = null
      } else {
        if (!body.reason) {
          return NextResponse.json({ error: 'reason is required when rejecting' }, { status: 400 })
        }
        updates.status         = 'rejected'
        updates.rejectedReason = body.reason
        updates.approvedBy     = null
        updates.approvedAt     = null
      }

      const [updated] = await db
        .update(timesheets)
        .set(updates)
        .where(and(eq(timesheets.id, id), eq(timesheets.tenantId, session.tenantId)))
        .returning()

      return NextResponse.json({ timesheet: updated })
    }

    // Employee: edit pending timesheet (notes, breakMinutes)
    if (existing.status !== 'pending' && existing.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Cannot edit a timesheet that has already been approved or rejected' },
        { status: 409 }
      )
    }

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (body.notes        !== undefined) updates.notes        = body.notes || null
    if (body.breakMinutes !== undefined) {
      const breaks = Math.max(0, Number(body.breakMinutes) || 0)
      updates.breakMinutes = breaks
      // Recalculate hours if both clock times exist
      const [ts] = await db
        .select({ clockIn: timesheets.clockIn, clockOut: timesheets.clockOut })
        .from(timesheets)
        .where(eq(timesheets.id, id))
        .limit(1)
      if (ts?.clockIn && ts?.clockOut) {
        const hrs = Math.max(0,
          (ts.clockOut.getTime() - ts.clockIn.getTime()) / 3_600_000 - breaks / 60
        )
        updates.hoursWorked = String(hrs.toFixed(2))
      }
    }
    if (body.clockOut !== undefined && body.clockOut) {
      updates.clockOut = new Date(body.clockOut)
      updates.status   = 'submitted'
    }

    const [updated] = await db
      .update(timesheets)
      .set(updates)
      .where(and(eq(timesheets.id, id), eq(timesheets.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ timesheet: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
