/**
 * GET  /api/tenant/self-service/leave-requests  — own requests
 * POST /api/tenant/self-service/leave-requests  — submit new request
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaveRequests, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('self_service:read')
  if (guard.error) return guard.error
  const { tenantId, sub } = guard.session

  // Resolve employee id from userId
  const [emp] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.userId, sub)))

  if (!emp) return NextResponse.json({ leaveRequests: [] })

  const rows = await db
    .select()
    .from(leaveRequests)
    .where(and(
      eq(leaveRequests.tenantId, tenantId),
      eq(leaveRequests.employeeId, emp.id),
    ))
    .orderBy(desc(leaveRequests.createdAt))

  return NextResponse.json({ leaveRequests: rows })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId, sub } = guard.session

  const [emp] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.userId, sub)))

  if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })

  const { leaveType, startDate, endDate, totalDays, reason } = await req.json()
  if (!leaveType || !startDate || !endDate)
    return NextResponse.json({ error: 'leaveType, startDate, endDate are required' }, { status: 400 })

  const [created] = await db.insert(leaveRequests).values({
    tenantId,
    employeeId: emp.id,
    leaveType,
    startDate,
    endDate,
    totalDays:  totalDays ?? 1,
    reason:     reason    || null,
    status:     'pending',
  }).returning()

  return NextResponse.json({ leaveRequest: created }, { status: 201 })
}
