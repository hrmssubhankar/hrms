/**
 * GET   /api/tenant/crm/leads/[id]
 * PATCH /api/tenant/crm/leads/[id]
 * DELETE /api/tenant/crm/leads/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmLeads } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [lead] = await db.select().from(crmLeads)
    .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, session.tenantId)))

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const body = await req.json()
  const allowed = ['firstName','lastName','email','phone','company','jobTitle','source','stage','status','assignedTo','notes','tags','score'] as const
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of allowed) if (f in body) updates[f] = body[f]

  // Handle conversion
  if (body.status === 'converted') {
    updates.convertedAt = new Date()
    if (body.convertedToId) updates.convertedToId = body.convertedToId
  }

  const [lead] = await db.update(crmLeads)
    .set(updates)
    .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, session.tenantId)))
    .returning()

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(crmLeads)
    .where(and(eq(crmLeads.id, id), eq(crmLeads.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
