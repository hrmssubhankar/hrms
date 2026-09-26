/**
 * PUT    /api/tenant/incident-behaviour/participants/[participantId]/incidents/[incidentId]
 * DELETE /api/tenant/incident-behaviour/participants/[participantId]/incidents/[incidentId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantIncidents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; incidentId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { incidentId } = await params

  const {
    incidentDate, incidentTime, location, incidentType, severity, description,
    immediateAction, witnesses, reportedBy, reportedTo, ndisReportable,
    policeReport, policeReportNumber, status, outcome, followUpRequired, followUpDate,
  } = await req.json()
  const [updated] = await db.update(participantIncidents)
    .set({
      ...(incidentDate       !== undefined && { incidentDate }),
      ...(incidentTime       !== undefined && { incidentTime }),
      ...(location           !== undefined && { location }),
      ...(incidentType       !== undefined && { incidentType }),
      ...(severity           !== undefined && { severity }),
      ...(description        !== undefined && { description }),
      ...(immediateAction    !== undefined && { immediateAction }),
      ...(witnesses          !== undefined && { witnesses }),
      ...(reportedBy         !== undefined && { reportedBy }),
      ...(reportedTo         !== undefined && { reportedTo }),
      ...(ndisReportable     !== undefined && { ndisReportable }),
      ...(policeReport       !== undefined && { policeReport }),
      ...(policeReportNumber !== undefined && { policeReportNumber }),
      ...(status             !== undefined && { status }),
      ...(outcome            !== undefined && { outcome }),
      ...(followUpRequired   !== undefined && { followUpRequired }),
      ...(followUpDate       !== undefined && { followUpDate }),
      updatedAt: new Date(),
    })
    .where(and(
      eq(participantIncidents.id, incidentId),
      eq(participantIncidents.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ incident: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { incidentId } = await params

  await db.delete(participantIncidents)
    .where(and(
      eq(participantIncidents.id, incidentId),
      eq(participantIncidents.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
