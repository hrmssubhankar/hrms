import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promotionRequests, promotionEvents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET /api/tenant/promotions/[id]  — detail + history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('performance:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [promotion] = await db
    .select()
    .from(promotionRequests)
    .where(and(eq(promotionRequests.id, id), eq(promotionRequests.tenantId, session.tenantId)))

  if (!promotion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const events = await db
    .select()
    .from(promotionEvents)
    .where(eq(promotionEvents.promotionId, id))
    .orderBy(desc(promotionEvents.createdAt))

  return NextResponse.json({ promotion, events })
}

// PATCH /api/tenant/promotions/[id]  — review / approve / reject / implement
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('performance:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: promotionRequests.id, status: promotionRequests.status })
    .from(promotionRequests)
    .where(and(eq(promotionRequests.id, id), eq(promotionRequests.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  let eventType = 'updated'
  let eventNote = body._note ?? 'Details updated'

  // Allow updating justification, proposedTitle, proposedSalary, effectiveDate, currentTitle, currentSalary
  const editableFields = ['justification','proposedTitle','proposedSalary','effectiveDate','currentTitle','currentSalary'] as const
  for (const f of editableFields) {
    if (f in body) updates[f] = body[f] ?? null
  }

  // Status transitions with proper guards
  if (body.status && body.status !== existing.status) {
    updates.status = body.status
    switch (body.status) {
      case 'under_review':
        eventType = 'submitted_for_review'
        eventNote = 'Case submitted for HR/Director review'
        break
      case 'approved':
        updates.reviewedBy  = session.email
        updates.reviewedAt  = new Date()
        updates.reviewNotes = body.reviewNotes ?? null
        eventType = 'approved'
        eventNote = body.reviewNotes ? `Approved — ${body.reviewNotes}` : 'Promotion approved'
        break
      case 'rejected':
        updates.reviewedBy  = session.email
        updates.reviewedAt  = new Date()
        updates.reviewNotes = body.reviewNotes ?? null
        eventType = 'rejected'
        eventNote = body.reviewNotes ? `Rejected — ${body.reviewNotes}` : 'Promotion rejected'
        break
      case 'implemented':
        updates.implementedAt = new Date()
        eventType = 'implemented'
        eventNote = 'Promotion implemented — employee record updated'
        break
    }
  }

  // Explicit review notes patch (without status change)
  if (body.reviewNotes !== undefined && !body.status) {
    updates.reviewNotes = body.reviewNotes
    eventType = 'note_added'
    eventNote = body.reviewNotes
  }

  const [updated] = await db
    .update(promotionRequests)
    .set(updates)
    .where(and(eq(promotionRequests.id, id), eq(promotionRequests.tenantId, session.tenantId)))
    .returning()

  await db.insert(promotionEvents).values({
    tenantId:    session.tenantId,
    promotionId: id,
    event:       eventType,
    note:        eventNote,
    performedBy: session.email,
  })

  return NextResponse.json({ promotion: updated })
}
