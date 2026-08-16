/**
 * POST /api/tenant/ndis-audits/[id]/actions — add a corrective action
 * GET  /api/tenant/ndis-audits/[id]/actions — list actions for audit
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

  const actions = await db
    .select()
    .from(ndisAuditActions)
    .where(and(eq(ndisAuditActions.auditId, id), eq(ndisAuditActions.tenantId, tenantId)))
    .orderBy(desc(ndisAuditActions.createdAt))

  return NextResponse.json({ actions })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { id } = await params

  // Verify audit exists for this tenant
  const [audit] = await db
    .select({ id: ndisAudits.id })
    .from(ndisAudits)
    .where(and(eq(ndisAudits.id, id), eq(ndisAudits.tenantId, tenantId)))

  if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

  const body = await req.json()
  const { description, priority, dueDate, assignedTo, notes } = body

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  const [created] = await db
    .insert(ndisAuditActions)
    .values({
      tenantId,
      auditId:    id,
      description,
      priority:   priority ?? 'medium',
      status:     'open',
      dueDate:    dueDate ?? null,
      assignedTo: assignedTo ?? null,
      notes:      notes ?? null,
      createdBy:  email,
    })
    .returning()

  return NextResponse.json({ action: created }, { status: 201 })
}
