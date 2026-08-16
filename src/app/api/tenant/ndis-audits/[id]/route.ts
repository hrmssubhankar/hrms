/**
 * GET   /api/tenant/ndis-audits/[id]  — get single audit with actions
 * PATCH /api/tenant/ndis-audits/[id]  — update audit
 * DELETE /api/tenant/ndis-audits/[id] — delete audit
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisAudits, ndisAuditActions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_audits:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [audit] = await db
    .select()
    .from(ndisAudits)
    .where(and(eq(ndisAudits.id, id), eq(ndisAudits.tenantId, tenantId)))

  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actions = await db
    .select()
    .from(ndisAuditActions)
    .where(and(eq(ndisAuditActions.auditId, id), eq(ndisAuditActions.tenantId, tenantId)))
    .orderBy(desc(ndisAuditActions.createdAt))

  return NextResponse.json({ audit, actions })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [existing] = await db
    .select({ id: ndisAudits.id })
    .from(ndisAudits)
    .where(and(eq(ndisAudits.id, id), eq(ndisAudits.tenantId, tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const editableFields = [
    'title', 'auditType', 'standard', 'outcomeGroup', 'status', 'result',
    'riskRating', 'scheduledDate', 'completedDate', 'nextReviewDate',
    'auditorName', 'auditorOrg', 'findingSummary', 'correctiveActions',
    'evidenceUrl', 'notes', 'assignedTo',
  ] as const

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of editableFields) {
    if (f in body) updates[f] = body[f] ?? null
  }

  // Auto-set completedDate when status → completed
  if (body.status === 'completed' && !body.completedDate) {
    updates.completedDate = new Date().toISOString().split('T')[0]
  }

  const [updated] = await db
    .update(ndisAudits)
    .set(updates)
    .where(and(eq(ndisAudits.id, id), eq(ndisAudits.tenantId, tenantId)))
    .returning()

  return NextResponse.json({ audit: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  await db
    .delete(ndisAudits)
    .where(and(eq(ndisAudits.id, id), eq(ndisAudits.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
