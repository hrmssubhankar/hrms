import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmDeals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const body = await req.json()
  const allowed = ['title','accountId','contactId','value','stage','probability','closeDate','source','assignedTo','notes','lostReason','tags'] as const
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of allowed) if (f in body) updates[f] = body[f]

  const [deal] = await db.update(crmDeals)
    .set(updates)
    .where(and(eq(crmDeals.id, id), eq(crmDeals.tenantId, session.tenantId)))
    .returning()

  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ deal })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(crmDeals)
    .where(and(eq(crmDeals.id, id), eq(crmDeals.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
