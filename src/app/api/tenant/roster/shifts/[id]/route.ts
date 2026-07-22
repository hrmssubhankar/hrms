/**
 * PATCH  /api/tenant/roster/shifts/:id  — update shift
 * DELETE /api/tenant/roster/shifts/:id  — delete shift
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('rostering:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  try {
    const body = await req.json()
    const { employeeId, participantId, startTime, endTime,
            shiftType, location, clientSite, notes, status, publish } = body

    // Verify shift belongs to tenant
    const [existing] = await db
      .select({ id: shifts.id, status: shifts.status })
      .from(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.tenantId, session.tenantId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (employeeId  !== undefined) updates.employeeId    = employeeId
    if (participantId !== undefined) updates.participantId = participantId || null
    if (startTime   !== undefined) updates.startTime     = new Date(startTime)
    if (endTime     !== undefined) updates.endTime       = new Date(endTime)
    if (shiftType   !== undefined) updates.shiftType     = shiftType
    if (location    !== undefined) updates.location      = location || null
    if (clientSite  !== undefined) updates.clientSite    = clientSite || null
    if (notes       !== undefined) updates.notes         = notes || null
    if (status      !== undefined) updates.status        = status

    // Publish action: set status to published and record timestamp
    if (publish) {
      updates.status      = 'published'
      updates.publishedAt = new Date()
    }

    const [updated] = await db
      .update(shifts)
      .set(updates)
      .where(and(eq(shifts.id, id), eq(shifts.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ shift: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('rostering:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  try {
    const [deleted] = await db
      .delete(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.tenantId, session.tenantId)))
      .returning({ id: shifts.id })

    if (!deleted) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
