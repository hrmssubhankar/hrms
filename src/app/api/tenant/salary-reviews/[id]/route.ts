import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { salaryReviews } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/tenant/salary-reviews/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('salary_review:read')
  if (error) return error

  const { id } = await params

  const [review] = await db
    .select()
    .from(salaryReviews)
    .where(and(
      eq(salaryReviews.id, id),
      eq(salaryReviews.tenantId, session.tenantId),
    ))

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ review })
}

// PATCH /api/tenant/salary-reviews/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('salary_review:write')
  if (error) return error

  const { id } = await params
  const body = await req.json()

  // Stamp workflow timestamps based on status transitions
  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() }

  if (body.status === 'submitted') {
    updates.submittedBy = session.email
    updates.submittedAt = new Date()
  }
  if (body.status === 'under_review') {
    updates.reviewedBy = session.email
    updates.reviewedAt = new Date()
  }
  if (body.status === 'approved') {
    updates.approvedBy = session.email
    updates.approvedAt = new Date()
  }
  if (body.status === 'rejected') {
    updates.reviewedBy = session.email
    updates.reviewedAt = new Date()
  }

  const [review] = await db
    .update(salaryReviews)
    .set(updates)
    .where(and(
      eq(salaryReviews.id, id),
      eq(salaryReviews.tenantId, session.tenantId),
    ))
    .returning()

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ review })
}

// DELETE /api/tenant/salary-reviews/[id] (only draft)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('salary_review:write')
  if (error) return error

  const { id } = await params

  const [review] = await db
    .delete(salaryReviews)
    .where(and(
      eq(salaryReviews.id, id),
      eq(salaryReviews.tenantId, session.tenantId),
    ))
    .returning()

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
