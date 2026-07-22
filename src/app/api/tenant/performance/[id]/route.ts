import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceReviews, performanceGoals, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET /api/tenant/performance/[id] — detail + goals
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('performance:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [review] = await db
    .select({
      id:              performanceReviews.id,
      employeeId:      performanceReviews.employeeId,
      reviewerId:      performanceReviews.reviewerId,
      type:            performanceReviews.type,
      status:          performanceReviews.status,
      scheduledDate:   performanceReviews.scheduledDate,
      completedAt:     performanceReviews.completedAt,
      overallRating:   performanceReviews.overallRating,
      kpis:            performanceReviews.kpis,
      developmentPlan: performanceReviews.developmentPlan,
      outcome:         performanceReviews.outcome,
      employeeInput:   performanceReviews.employeeInput,
      managerInput:    performanceReviews.managerInput,
      createdAt:       performanceReviews.createdAt,
      employeeFirstName:  employees.firstName,
      employeeLastName:   employees.lastName,
      employeeEmail:      employees.email,
      employeeStartDate:  employees.startDate,
    })
    .from(performanceReviews)
    .leftJoin(employees, eq(employees.id, performanceReviews.employeeId))
    .where(and(
      eq(performanceReviews.id, id),
      eq(performanceReviews.tenantId, session.tenantId),
    ))

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const goals = await db
    .select()
    .from(performanceGoals)
    .where(and(
      eq(performanceGoals.reviewId, id),
      eq(performanceGoals.tenantId, session.tenantId),
    ))
    .orderBy(desc(performanceGoals.createdAt))

  return NextResponse.json({ review, goals })
}

// PATCH /api/tenant/performance/[id] — update review fields + status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('performance:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: performanceReviews.id, status: performanceReviews.status })
    .from(performanceReviews)
    .where(and(eq(performanceReviews.id, id), eq(performanceReviews.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  // Handle goal operations inline: { _addGoal, _updateGoal, _deleteGoalId }
  if (body._addGoal) {
    const { title, description, category, targetDate } = body._addGoal
    if (!title) return NextResponse.json({ error: 'Goal title required' }, { status: 400 })
    const [rev] = await db
      .select({ employeeId: performanceReviews.employeeId })
      .from(performanceReviews)
      .where(eq(performanceReviews.id, id))
    const [goal] = await db.insert(performanceGoals).values({
      tenantId:    session.tenantId,
      employeeId:  rev.employeeId,
      reviewId:    id,
      title,
      description: description ?? null,
      category:    category ?? null,
      targetDate:  targetDate ?? null,
    }).returning()
    return NextResponse.json({ goal })
  }

  if (body._updateGoal) {
    const { goalId, progress, selfRating, managerRating, managerNote, status: goalStatus } = body._updateGoal
    const updates: Record<string, unknown> = {}
    if (progress      !== undefined) updates.progress      = progress
    if (selfRating    !== undefined) updates.selfRating    = selfRating
    if (managerRating !== undefined) updates.managerRating = managerRating
    if (managerNote   !== undefined) updates.managerNote   = managerNote
    if (goalStatus    !== undefined) updates.status        = goalStatus
    await db.update(performanceGoals).set(updates)
      .where(and(eq(performanceGoals.id, goalId), eq(performanceGoals.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  }

  if (body._deleteGoalId) {
    await db.delete(performanceGoals)
      .where(and(eq(performanceGoals.id, body._deleteGoalId), eq(performanceGoals.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  }

  // Standard field updates
  const updates: Record<string, unknown> = {}
  const allowed = ['status', 'scheduledDate', 'overallRating', 'kpis', 'developmentPlan',
    'outcome', 'employeeInput', 'managerInput', 'reviewerId'] as const
  for (const f of allowed) {
    if (f in body) updates[f] = body[f] ?? null
  }
  if (body.status === 'completed' && existing.status !== 'completed') {
    updates.completedAt = new Date()
  }

  const [updated] = await db
    .update(performanceReviews)
    .set(updates)
    .where(and(eq(performanceReviews.id, id), eq(performanceReviews.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ review: updated })
}

// DELETE /api/tenant/performance/[id] — only scheduled reviews can be deleted
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('performance:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ status: performanceReviews.status })
    .from(performanceReviews)
    .where(and(eq(performanceReviews.id, id), eq(performanceReviews.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status === 'completed') {
    return NextResponse.json({ error: 'Completed reviews cannot be deleted' }, { status: 400 })
  }

  await db.delete(performanceReviews)
    .where(and(eq(performanceReviews.id, id), eq(performanceReviews.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
