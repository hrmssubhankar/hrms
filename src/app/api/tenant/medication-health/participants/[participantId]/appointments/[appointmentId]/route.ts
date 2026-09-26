/**
 * PATCH  /api/tenant/medication-health/participants/[participantId]/appointments/[appointmentId]
 * DELETE /api/tenant/medication-health/participants/[participantId]/appointments/[appointmentId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantHealthAppointments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; appointmentId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { appointmentId } = await params

  const {
    appointmentType, providerName, providerOrg, appointmentDate, appointmentTime,
    location, purpose, outcome, followUpDate, followUpNotes, status,
    requiresTransport, supportWorkerNeeded,
  } = await req.json()
  const [updated] = await db.update(participantHealthAppointments)
    .set({
      ...(appointmentType      !== undefined && { appointmentType }),
      ...(providerName         !== undefined && { providerName }),
      ...(providerOrg          !== undefined && { providerOrg }),
      ...(appointmentDate      !== undefined && { appointmentDate }),
      ...(appointmentTime      !== undefined && { appointmentTime }),
      ...(location             !== undefined && { location }),
      ...(purpose              !== undefined && { purpose }),
      ...(outcome              !== undefined && { outcome }),
      ...(followUpDate         !== undefined && { followUpDate }),
      ...(followUpNotes        !== undefined && { followUpNotes }),
      ...(status               !== undefined && { status }),
      ...(requiresTransport    !== undefined && { requiresTransport }),
      ...(supportWorkerNeeded  !== undefined && { supportWorkerNeeded }),
      updatedAt: new Date(),
    })
    .where(and(
      eq(participantHealthAppointments.id, appointmentId),
      eq(participantHealthAppointments.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ appointment: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { appointmentId } = await params

  await db.delete(participantHealthAppointments)
    .where(and(
      eq(participantHealthAppointments.id, appointmentId),
      eq(participantHealthAppointments.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
