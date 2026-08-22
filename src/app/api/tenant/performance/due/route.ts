import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceReviews, employees } from '@/lib/db/schema'
import { eq, and, lte, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('performance:read')
  if (guard.error) return guard.error
  const { session } = guard

  const in14 = new Date()
  in14.setDate(in14.getDate() + 14)

  const rows = await db
    .select({
      id:            performanceReviews.id,
      employeeId:    performanceReviews.employeeId,
      type:          performanceReviews.type,
      scheduledDate: performanceReviews.scheduledDate,
      firstName:     employees.firstName,
      lastName:      employees.lastName,
    })
    .from(performanceReviews)
    .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .where(and(
      eq(performanceReviews.tenantId, session.tenantId!),
      ne(performanceReviews.status, 'completed'),
      ne(performanceReviews.status, 'cancelled'),
      lte(performanceReviews.scheduledDate, in14.toISOString().slice(0, 10)),
    ))
    .limit(10)

  return NextResponse.json({ due: rows })
}
