import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmContacts } from '@/lib/db/schema'
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
  const allowed = ['firstName','lastName','email','phone','mobile','jobTitle','department','accountId','assignedTo','notes','tags','isPrimary'] as const
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of allowed) if (f in body) updates[f] = body[f]

  const [contact] = await db.update(crmContacts)
    .set(updates)
    .where(and(eq(crmContacts.id, id), eq(crmContacts.tenantId, session.tenantId)))
    .returning()

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ contact })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(crmContacts)
    .where(and(eq(crmContacts.id, id), eq(crmContacts.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
