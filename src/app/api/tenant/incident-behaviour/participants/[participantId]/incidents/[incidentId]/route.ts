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

  const body = await req.json()
  const [updated] = await db.update(participantIncidents)
    .set({ ...body, updatedAt: new Date() })
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
