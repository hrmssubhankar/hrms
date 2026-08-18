/**
 * GET /api/tenant/roster-shifts/employees
 * Returns active employees for shift assignment
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const search = req.nextUrl.searchParams.get('search') || ''

  const rows = await db
    .select({
      id:        employees.id,
      firstName: employees.firstName,
      lastName:  employees.lastName,
      employmentType: employees.employmentType,
      email:     employees.email,
    })
    .from(employees)
    .where(and(
      eq(employees.tenantId, tenantId),
      eq(employees.isActive, true),
      search
        ? or(
            ilike(employees.firstName, `%${search}%`),
            ilike(employees.lastName,  `%${search}%`),
          )
        : undefined,
    ))

  return NextResponse.json({ employees: rows })
}
