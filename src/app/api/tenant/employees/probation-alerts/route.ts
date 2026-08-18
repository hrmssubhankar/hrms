/**
 * GET /api/tenant/employees/probation-alerts
 * Returns employees whose probation ends within 14 days
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const today = new Date().toISOString().split('T')[0]
  const in14  = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const rows = await db
    .select({
      id:               employees.id,
      firstName:        employees.firstName,
      lastName:         employees.lastName,
      email:            employees.email,
      probationEndDate: employees.probationEndDate,
      employmentType:   employees.employmentType,
    })
    .from(employees)
    .where(and(
      eq(employees.tenantId, tenantId),
      eq(employees.isActive, true),
      isNotNull(employees.probationEndDate),
      gte(employees.probationEndDate, today),
      lte(employees.probationEndDate, in14),
    ))

  return NextResponse.json({ alerts: rows })
}
