import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeBenefits, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-benefits
 *
 * Returns the authenticated employee's own benefit assignments.
 * No manager permission required — own data only.
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

  if (!emp) return NextResponse.json({ benefits: [], employeeLinked: false })

  const benefits = await db
    .select({
      id:          employeeBenefits.id,
      type:        employeeBenefits.type,
      description: employeeBenefits.description,
      startDate:   employeeBenefits.startDate,
      endDate:     employeeBenefits.endDate,
      notes:       employeeBenefits.notes,
      createdAt:   employeeBenefits.createdAt,
    })
    .from(employeeBenefits)
    .where(and(
      eq(employeeBenefits.tenantId, session.tenantId),
      eq(employeeBenefits.employeeId, emp.id),
    ))
    .orderBy(desc(employeeBenefits.createdAt))

  return NextResponse.json({ benefits, employeeLinked: true, employee: emp })
}
