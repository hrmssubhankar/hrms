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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const [incident] = await db.select().from(ndisIncidents)
    .where(and(eq(ndisIncidents.id, params.id), eq(ndisIncidents.tenantId, tenantId)))
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actions = await db.select().from(ndisIncidentActions)
    .where(and(eq(ndisIncidentActions.incidentId, params.id), eq(ndisIncidentActions.tenantId, tenantId)))

  return NextResponse.json({ incident, actions })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const body = await req.json()
  const [incident] = await db.update(ndisIncidents)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(ndisIncidents.id, params.id), eq(ndisIncidents.tenantId, tenantId)))
    .returning()

  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ incident })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  await db.delete(ndisIncidents)
    .where(and(eq(ndisIncidents.id, params.id), eq(ndisIncidents.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
