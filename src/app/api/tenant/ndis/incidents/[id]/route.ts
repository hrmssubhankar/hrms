/**
 * GET    /api/tenant/ndis/incidents/[id]
 * PATCH  /api/tenant/ndis/incidents/[id]
 * DELETE /api/tenant/ndis/incidents/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisIncidents, ndisIncidentActions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('ndis_incidents:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [incident] = await db.select().from(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actions = await db.select().from(ndisIncidentActions)
    .where(and(eq(ndisIncidentActions.incidentId, id), eq(ndisIncidentActions.tenantId, tenantId)))

  return NextResponse.json({ incident, actions })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const {
    incidentType, incidentCategory, isReportable, status, severity, participantId,
    participantName, workerName, workerRole, witnessNames, title, description,
    location, incidentDate, discoveredDate, reportedInternally, internalReportDate,
    commissionNotified, commissionNotifyDate, commissionRefNumber,
    policeNotified, policeReportNumber,
  } = await req.json()
  const [incident] = await db.update(ndisIncidents)
    .set({
      ...(incidentType       !== undefined && { incidentType }),
      ...(incidentCategory   !== undefined && { incidentCategory }),
      ...(isReportable       !== undefined && { isReportable }),
      ...(status             !== undefined && { status }),
      ...(severity           !== undefined && { severity }),
      ...(participantId      !== undefined && { participantId }),
      ...(participantName    !== undefined && { participantName }),
      ...(workerName         !== undefined && { workerName }),
      ...(workerRole         !== undefined && { workerRole }),
      ...(witnessNames       !== undefined && { witnessNames }),
      ...(title              !== undefined && { title }),
      ...(description        !== undefined && { description }),
      ...(location           !== undefined && { location }),
      ...(incidentDate       !== undefined && { incidentDate }),
      ...(discoveredDate     !== undefined && { discoveredDate }),
      ...(reportedInternally !== undefined && { reportedInternally }),
      ...(internalReportDate !== undefined && { internalReportDate }),
      ...(commissionNotified !== undefined && { commissionNotified }),
      ...(commissionNotifyDate !== undefined && { commissionNotifyDate }),
      ...(commissionRefNumber !== undefined && { commissionRefNumber }),
      ...(policeNotified     !== undefined && { policeNotified }),
      ...(policeReportNumber !== undefined && { policeReportNumber }),
      updatedAt: new Date(),
    })
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))
    .returning()

  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ incident })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  await db.delete(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
