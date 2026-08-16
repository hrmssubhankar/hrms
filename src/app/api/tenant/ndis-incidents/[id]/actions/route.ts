/**
 * GET  /api/tenant/ndis-incidents/[id]/actions — list actions for incident
 * POST /api/tenant/ndis-incidents/[id]/actions — add an action
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

  const actions = await db
    .select()
    .from(ndisIncidentActions)
    .where(and(eq(ndisIncidentActions.incidentId, id), eq(ndisIncidentActions.tenantId, tenantId)))
    .orderBy(desc(ndisIncidentActions.createdAt))

  return NextResponse.json({ actions })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { id } = await params

  // Verify incident exists for this tenant
  const [incident] = await db
    .select({ id: ndisIncidents.id })
    .from(ndisIncidents)
    .where(and(eq(ndisIncidents.id, id), eq(ndisIncidents.tenantId, tenantId)))

  if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  const body = await req.json()
  const { description, actionType, priority, dueDate, assignedTo, notes } = body

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  const [created] = await db
    .insert(ndisIncidentActions)
    .values({
      tenantId,
      incidentId:  id,
      description,
      actionType:  actionType ?? 'corrective',
      priority:    priority ?? 'medium',
      status:      'open',
      dueDate:     dueDate ?? null,
      assignedTo:  assignedTo ?? null,
      notes:       notes ?? null,
      createdBy:   email,
    })
    .returning()

  return NextResponse.json({ action: created }, { status: 201 })
}
