import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaveRequests, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-leave
 *
 * Returns the authenticated employee's own leave requests and a summary.
 * No manager permission required — own data only.
 *
 * Response: { requests, employeeLinked, stats }
 */
export async function GET() {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const [emp] = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId, session.sub as string),
    ))

  if (!emp) return NextResponse.json({ requests: [], employeeLinked: false, stats: null })

  const rows = await db
    .select({
      id:           leaveRequests.id,
      leaveType:    leaveRequests.leaveType,
      startDate:    leaveRequests.startDate,
      endDate:      leaveRequests.endDate,
      totalDays:    leaveRequests.totalDays,
      reason:       leaveRequests.reason,
      status:       leaveRequests.status,
      reviewedAt:   leaveRequests.reviewedAt,
      reviewNote:   leaveRequests.reviewNote,
      createdAt:    leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .where(and(
      eq(leaveRequests.tenantId, session.tenantId),
      eq(leaveRequests.employeeId, emp.id),
    ))
    .orderBy(desc(leaveRequests.createdAt))

  const stats = {
    total:             rows.length,
    pending:           rows.filter(r => r.status === 'pending').length,
    approved:          rows.filter(r => r.status === 'approved').length,
    rejected:          rows.filter(r => r.status === 'rejected').length,
    cancelled:         rows.filter(r => r.status === 'cancelled').length,
    totalDaysApproved: rows.filter(r => r.status === 'approved').reduce((s, r) => s + (r.totalDays ?? 0), 0),
    totalDaysPending:  rows.filter(r => r.status === 'pending').reduce((s, r) => s + (r.totalDays ?? 0), 0),
  }

  return NextResponse.json({ requests: rows, employeeLinked: true, stats, employee: emp })
}
