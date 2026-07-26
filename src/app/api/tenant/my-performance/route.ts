import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceReviews, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-performance
 *
 * Returns the authenticated employee's own performance reviews.
 * No manager permission required — own data only.
 *
 * Response: { reviews, employeeLinked }
 */
export async function GET() {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId, session.sub as string),
    ))

  if (!emp) return NextResponse.json({ reviews: [], employeeLinked: false })

  const reviews = await db
    .select({
      id:              performanceReviews.id,
      type:            performanceReviews.type,
      status:          performanceReviews.status,
      scheduledDate:   performanceReviews.scheduledDate,
      completedAt:     performanceReviews.completedAt,
      overallRating:   performanceReviews.overallRating,
      kpis:            performanceReviews.kpis,
      developmentPlan: performanceReviews.developmentPlan,
      outcome:         performanceReviews.outcome,
      employeeInput:   performanceReviews.employeeInput,
      createdAt:       performanceReviews.createdAt,
    })
    .from(performanceReviews)
    .where(and(
      eq(performanceReviews.tenantId, session.tenantId),
      eq(performanceReviews.employeeId, emp.id),
    ))
    .orderBy(desc(performanceReviews.createdAt))

  return NextResponse.json({ reviews, employeeLinked: true })
}
