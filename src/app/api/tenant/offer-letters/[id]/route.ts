import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { offerLetters, offerLetterEvents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET /api/tenant/offer-letters/[id]  — detail + event history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('contracts:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [offer] = await db
    .select()
    .from(offerLetters)
    .where(and(eq(offerLetters.id, id), eq(offerLetters.tenantId, session.tenantId)))

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const events = await db
    .select()
    .from(offerLetterEvents)
    .where(eq(offerLetterEvents.offerId, id))
    .orderBy(desc(offerLetterEvents.createdAt))

  return NextResponse.json({ offer, events })
}

// PATCH /api/tenant/offer-letters/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: offerLetters.id, status: offerLetters.status, candidateName: offerLetters.candidateName })
    .from(offerLetters)
    .where(and(eq(offerLetters.id, id), eq(offerLetters.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  const eventNote: string[] = []

  const fields = [
    'candidateName','candidateEmail','position','department',
    'employmentType','startDate','salaryAmount','salaryCycle',
    'templateContent','notes','expiresAt','pdfUrl',
  ] as const

  for (const f of fields) {
    if (f in body) updates[f] = body[f] ?? null
  }

  // Status transitions
  if (body.status && body.status !== existing.status) {
    updates.status = body.status
    if (body.status === 'sent')      { updates.sentAt = new Date();     eventNote.push('offer sent') }
    if (body.status === 'accepted')  { updates.acceptedAt = new Date(); eventNote.push('offer accepted by candidate') }
    if (body.status === 'rejected')  { updates.rejectedAt = new Date(); eventNote.push('offer rejected by candidate') }
    if (body.status === 'expired')   { eventNote.push('offer expired') }
    if (body.status === 'withdrawn') { eventNote.push('offer withdrawn') }
  }

  const [updated] = await db
    .update(offerLetters)
    .set(updates)
    .where(and(eq(offerLetters.id, id), eq(offerLetters.tenantId, session.tenantId)))
    .returning()

  // Log event
  await db.insert(offerLetterEvents).values({
    tenantId:    session.tenantId,
    offerId:     id,
    event:       body.status ?? 'updated',
    note:        eventNote.length ? eventNote.join('; ') : (body._note ?? 'Details updated'),
    performedBy: session.email,
  })

  return NextResponse.json({ offer: updated })
}

// DELETE /api/tenant/offer-letters/[id]  — only drafts can be deleted
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: offerLetters.id, status: offerLetters.status })
    .from(offerLetters)
    .where(and(eq(offerLetters.id, id), eq(offerLetters.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'draft') return NextResponse.json({ error: 'Only draft offers can be deleted' }, { status: 400 })

  await db.delete(offerLetters).where(eq(offerLetters.id, id))
  return NextResponse.json({ ok: true })
}
