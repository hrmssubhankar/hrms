import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmAccounts, crmContacts, crmDeals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [account] = await db.select().from(crmAccounts)
    .where(and(eq(crmAccounts.id, id), eq(crmAccounts.tenantId, session.tenantId)))

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [contacts, deals] = await Promise.all([
    db.select().from(crmContacts).where(and(eq(crmContacts.accountId, id), eq(crmContacts.tenantId, session.tenantId))),
    db.select().from(crmDeals).where(and(eq(crmDeals.accountId, id), eq(crmDeals.tenantId, session.tenantId))),
  ])

  return NextResponse.json({ account, contacts, deals })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const body = await req.json()
  const allowed = ['name','industry','website','phone','email','address','city','state','country','abn','type','status','revenue','employees','assignedTo','notes','tags'] as const
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of allowed) if (f in body) updates[f] = body[f]

  const [account] = await db.update(crmAccounts)
    .set(updates)
    .where(and(eq(crmAccounts.id, id), eq(crmAccounts.tenantId, session.tenantId)))
    .returning()

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ account })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(crmAccounts)
    .where(and(eq(crmAccounts.id, id), eq(crmAccounts.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
