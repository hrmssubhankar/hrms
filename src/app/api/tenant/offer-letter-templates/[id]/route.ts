import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { offerLetterTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// DELETE /api/tenant/offer-letter-templates/[id] — soft-delete (deactivate)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: offerLetterTemplates.id })
    .from(offerLetterTemplates)
    .where(and(
      eq(offerLetterTemplates.id, id),
      eq(offerLetterTemplates.tenantId, session.tenantId),
    ))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db
    .update(offerLetterTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(offerLetterTemplates.id, id))

  return NextResponse.json({ ok: true })
}

// PATCH /api/tenant/offer-letter-templates/[id] — rename / update content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const body = await req.json() as { name?: string; content?: string }
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name)    updates.name    = body.name.trim()
  if (body.content) updates.content = body.content.trim()

  const [updated] = await db
    .update(offerLetterTemplates)
    .set(updates)
    .where(and(
      eq(offerLetterTemplates.id, id),
      eq(offerLetterTemplates.tenantId, session.tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ template: updated })
}
