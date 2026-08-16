/**
 * GET    /api/tenant/ndis-incidents/[id]  — get single incident with actions
 * PATCH  /api/tenant/ndis-incidents/[id]  — update incident
 * DELETE /api/tenant/ndis-incidents/[id]  — delete incident
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisIncidents, ndisIncidentActions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_incidents:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [incident] = await db
    .select()
    .from(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))

  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actions = await db
    .select()
    .from(ndisIncidentActions)
    .where(and(eq(ndisIncidentActions.incidentId, id), eq(ndisIncidentActions.tenantId, tenantId)))
    .orderBy(desc(ndisIncidentActions.createdAt))

  return NextResponse.json({ incident, actions })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [existing] = await db
    .select({ id: ndisIncidents.id })
    .from(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const editableFields = [
    'title', 'incidentType', 'incidentCategory', 'description',
    'severity', 'status', 'isReportable',
    'participantId', 'participantName', 'workerName', 'workerRole', 'witnessNames',
    'location', 'incidentDate', 'discoveredDate',
    'reportedInternally', 'internalReportDate',
    'commissionNotified', 'commissionNotifyDate', 'commissionRefNumber',
    'policeNotified', 'policeReportNumber',
    'immediateActions', 'rootCause', 'outcomeDescription',
    'evidenceUrl', 'assignedTo', 'notes',
  ] as const

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of editableFields) {
    if (f in body) {
      if ((f === 'incidentDate' || f === 'discoveredDate') && body[f]) {
        updates[f] = new Date(body[f])
      } else {
        updates[f] = body[f] ?? null
      }
    }
  }

  const [updated] = await db
    .update(ndisIncidents)
    .set(updates)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))
    .returning()

  return NextResponse.json({ incident: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  await db
    .delete(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
