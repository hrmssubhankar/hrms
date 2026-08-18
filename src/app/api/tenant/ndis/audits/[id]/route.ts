/**
 * GET    /api/tenant/ndis/audits/[id]  — fetch single audit
 * PATCH  /api/tenant/ndis/audits/[id]  — update audit
 * DELETE /api/tenant/ndis/audits/[id]  — delete audit
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisAudits, ndisAuditActions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis_audits:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const [audit] = await db.select().from(ndisAudits)
    .where(and(eq(ndisAudits.id, params.id), eq(ndisAudits.tenantId, tenantId)))
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actions = await db.select().from(ndisAuditActions)
    .where(and(eq(ndisAuditActions.auditId, params.id), eq(ndisAuditActions.tenantId, tenantId)))

  return NextResponse.json({ audit, actions })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const body = await req.json()
  const [audit] = await db.update(ndisAudits)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(ndisAudits.id, params.id), eq(ndisAudits.tenantId, tenantId)))
    .returning()

  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ audit })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  await db.delete(ndisAudits)
    .where(and(eq(ndisAudits.id, params.id), eq(ndisAudits.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
