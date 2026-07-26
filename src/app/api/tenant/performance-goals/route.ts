import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceGoals, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard, apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/performance-goals
 *
 * Managers: ?employeeId=  to fetch goals for a specific employee
 *           ?reviewId=    to fetch goals linked to a specific review
 * Employees: always returns own goals only (via apiAuth — no permission needed)
 */
export async function GET(req: NextRequest) {
  // Try manager access first, fall back to own-data access
  const managerGuard = await apiGuard('performance:read')
  const isManager = !managerGuard.error

  let session: any
  if (isManager) {
    session = managerGuard.session
  } else {
    const ownGuard = await apiAuth()
    if (ownGuard.error) return ownGuard.error
    session = ownGuard.session
  }

  const { searchParams } = req.nextUrl
  const employeeIdParam = searchParams.get('employeeId')
  const reviewId        = searchParams.get('reviewId')

  const conditions: any[] = [eq(performanceGoals.tenantId, session.tenantId)]

  if (isManager && employeeIdParam) {
    conditions.push(eq(performanceGoals.employeeId, employeeIdParam))
  } else if (!isManager) {
    // Resolve own employee record
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId),
        eq(employees.userId, session.sub as string),
      ))
    if (!emp) return NextResponse.json({ goals: [] })
    conditions.push(eq(performanceGoals.employeeId, emp.id))
  }

  if (reviewId) conditions.push(eq(performanceGoals.reviewId, reviewId))

  const goals = await db
    .select()
    .from(performanceGoals)
    .where(and(...conditions))
    .orderBy(desc(performanceGoals.createdAt))

  return NextResponse.json({ goals })
}

/**
 * POST /api/tenant/performance-goals
 *
 * Creates a new goal. Managers can create for any employee; employees create for themselves.
 * Body: { employeeId?, reviewId?, title, description?, category?, targetDate?, status?, progress? }
 */
export async function POST(req: NextRequest) {
  const managerGuard = await apiGuard('performance:write')
  const isManager = !managerGuard.error

  let session: any
  if (isManager) {
    session = managerGuard.session
  } else {
    const ownGuard = await apiAuth()
    if (ownGuard.error) return ownGuard.error
    session = ownGuard.session
  }

  const body = await req.json()
  const { reviewId, title, description, category, targetDate, status, progress } = body
  let { employeeId } = body

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  // If not a manager, always scope to own employee
  if (!isManager) {
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId),
        eq(employees.userId, session.sub as string),
      ))
    if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 403 })
    employeeId = emp.id
  }

  if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })

  const [goal] = await db.insert(performanceGoals).values({
    tenantId:    session.tenantId,
    employeeId,
    reviewId:    reviewId    || null,
    title,
    description: description || null,
    category:    category    || null,
    targetDate:  targetDate  || null,
    status:      status      || 'active',
    progress:    progress    ?? 0,
  }).returning()

  return NextResponse.json({ goal }, { status: 201 })
}

/**
 * PATCH /api/tenant/performance-goals
 *
 * Updates a goal. Managers can set managerRating/managerNote.
 * Employees can update progress, selfRating, status, description.
 * Body: { id, ...fields }
 */
export async function PATCH(req: NextRequest) {
  const managerGuard = await apiGuard('performance:write')
  const isManager = !managerGuard.error

  let session: any
  if (isManager) {
    session = managerGuard.session
  } else {
    const ownGuard = await apiAuth()
    if (ownGuard.error) return ownGuard.error
    session = ownGuard.session
  }

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify goal belongs to this tenant
  const conditions: any[] = [
    eq(performanceGoals.id, id),
    eq(performanceGoals.tenantId, session.tenantId),
  ]

  if (!isManager) {
    // Employee can only update own goals
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId),
        eq(employees.userId, session.sub as string),
      ))
    if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 403 })
    conditions.push(eq(performanceGoals.employeeId, emp.id))
  }

  const updates: Record<string, any> = { updatedAt: new Date() }

  // Fields any authenticated user can update on own goals
  if (body.title       !== undefined) updates.title       = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.category    !== undefined) updates.category    = body.category
  if (body.targetDate  !== undefined) updates.targetDate  = body.targetDate
  if (body.status      !== undefined) updates.status      = body.status
  if (body.progress    !== undefined) updates.progress    = body.progress
  if (body.selfRating  !== undefined) updates.selfRating  = body.selfRating

  // Manager-only fields
  if (isManager) {
    if (body.managerRating !== undefined) updates.managerRating = body.managerRating
    if (body.managerNote   !== undefined) updates.managerNote   = body.managerNote
  }

  const [updated] = await db
    .update(performanceGoals)
    .set(updates)
    .where(and(...conditions))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  return NextResponse.json({ goal: updated })
}

/**
 * DELETE /api/tenant/performance-goals?id=
 *
 * Managers can delete any goal. Employees can delete own goals only.
 */
export async function DELETE(req: NextRequest) {
  const managerGuard = await apiGuard('performance:write')
  const isManager = !managerGuard.error

  let session: any
  if (isManager) {
    session = managerGuard.session
  } else {
    const ownGuard = await apiAuth()
    if (ownGuard.error) return ownGuard.error
    session = ownGuard.session
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const conditions: any[] = [
    eq(performanceGoals.id, id),
    eq(performanceGoals.tenantId, session.tenantId),
  ]

  if (!isManager) {
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId),
        eq(employees.userId, session.sub as string),
      ))
    if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 403 })
    conditions.push(eq(performanceGoals.employeeId, emp.id))
  }

  const [deleted] = await db
    .delete(performanceGoals)
    .where(and(...conditions))
    .returning({ id: performanceGoals.id })

  if (!deleted) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
