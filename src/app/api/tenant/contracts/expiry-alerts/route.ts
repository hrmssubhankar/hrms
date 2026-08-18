/**
 * GET /api/tenant/contracts/expiry-alerts
 * Returns fixed-term contracts ending within 30 days
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contracts, employees } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('contracts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const today = new Date().toISOString().split('T')[0]
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const rows = await db
    .select({
      contractId:    contracts.id,
      type:          contracts.type,
      status:        contracts.status,
      endDate:       contracts.endDate,
      firstName:     employees.firstName,
      lastName:      employees.lastName,
      email:         employees.email,
      employmentType: employees.employmentType,
    })
    .from(contracts)
    .innerJoin(employees, eq(employees.id, contracts.employeeId))
    .where(and(
      eq(contracts.tenantId, tenantId),
      isNotNull(contracts.endDate),
      gte(contracts.endDate, today),
      lte(contracts.endDate, in30),
    ))

  return NextResponse.json({ alerts: rows })
}
