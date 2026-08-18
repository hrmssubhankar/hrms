/**
 * PATCH /api/tenant/roster-shifts/shifts/[shiftId]
 * DELETE /api/tenant/roster-shifts/shifts/[shiftId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { shiftId } = await params

  const body = await req.json()
  const { status, shiftType, location, clientSite, notes, startTime, endTime } = body

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (status    !== undefined) updates.status    = status
  if (shiftType !== undefined) updates.shiftType = shiftType
  if (location  !== undefined) updates.location  = location
  if (clientSite!== undefined) updates.clientSite= clientSite
  if (notes     !== undefined) updates.notes     = notes
  if (startTime !== undefined) updates.startTime = new Date(startTime)
  if (endTime   !== undefined) updates.endTime   = new Date(endTime)

  const [updated] = await db.update(shifts)
    .set(updates)
    .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, tenantId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
  return NextResponse.json({ shift: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { shiftId } = await params

  await db.delete(shifts)
    .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, tenantId)))

  return NextResponse.json({ ok: true })
}
