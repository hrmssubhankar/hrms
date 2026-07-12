import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaveRequests, employees, tenants } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { hasPermission } from '@/lib/auth/permissions'
import { mergeLeaveTypes, entitlementDays, type LeaveTypeConfig } from '@/lib/leave/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/leave/balances
 *
 * Returns leave balance per type for a specific employee and year.
 *
 * Query params:
 *   employeeId  — required for managers; employees get their own automatically
 *   year        — defaults to current calendar year
 *
 * Response per leave type:
 *   { key, label, emoji, color, entitlement, taken, pending, remaining }
 *
 * Balance = entitlement – taken – pending
 * "taken"   = sum of totalDays for approved requests in [year-01-01, year-12-31]
 * "pending" = sum of totalDays for pending requests in the same window
 */
export async function GET(req: NextRequest) {
  const guard = await apiGuard('leave:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const canApprove = hasPermission(session.userRole, 'leave:approve')

  // Resolve which employee to compute for
  let targetEmployeeId = searchParams.get('employeeId')
  let employmentType   = 'full_time'

  if (!canApprove || !targetEmployeeId) {
    // Scope to own employee record
    const [emp] = await db
      .select({ id: employees.id, employmentType: employees.employmentType })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId),
        eq(employees.userId, session.sub as string),
      ))
    if (!emp) return NextResponse.json({ balances: [], employeeLinked: false })
    targetEmployeeId = emp.id
    employmentType   = emp.employmentType
  } else {
    // Manager requested a specific employee — verify it belongs to tenant
    const [emp] = await db
      .select({ id: employees.id, employmentType: employees.employmentType })
      .from(employees)
      .where(and(
        eq(employees.id,       targetEmployeeId),
        eq(employees.tenantId, session.tenantId),
      ))
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    employmentType = emp.employmentType
  }

  // Load leave type config
  const [tenantRow] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, session.tenantId))

  const saved   = ((tenantRow?.settings as Record<string, unknown> | null)?.leaveTypes ?? []) as Partial<LeaveTypeConfig>[]
  const configs = mergeLeaveTypes(saved).filter(t => t.isActive)

  // Load all leave requests for this employee in this year
  const rows = await db
    .select({
      leaveType:  leaveRequests.leaveType,
      totalDays:  leaveRequests.totalDays,
      status:     leaveRequests.status,
    })
    .from(leaveRequests)
    .where(and(
      eq(leaveRequests.tenantId,   session.tenantId),
      eq(leaveRequests.employeeId, targetEmployeeId),
      gte(leaveRequests.startDate, from),
      lte(leaveRequests.startDate, to),
    ))

  // Compute balances per type
  const balances = configs.map(cfg => {
    const typeRows   = rows.filter(r => r.leaveType === cfg.key)
    const taken      = typeRows.filter(r => r.status === 'approved').reduce((s, r) => s + (r.totalDays ?? 0), 0)
    const pending    = typeRows.filter(r => r.status === 'pending').reduce((s, r) => s + (r.totalDays ?? 0), 0)
    const entitlement = cfg.key === 'unpaid' ? null : entitlementDays(cfg, employmentType)
    const remaining   = entitlement == null ? null : Math.max(0, entitlement - taken)

    return {
      key:          cfg.key,
      label:        cfg.label,
      emoji:        cfg.emoji,
      color:        cfg.color,
      accrualNote:  cfg.accrualNote,
      entitlement,
      taken,
      pending,
      remaining,
    }
  })

  return NextResponse.json({
    balances,
    employeeId: targetEmployeeId,
    employmentType,
    year,
    employeeLinked: true,
  })
}
