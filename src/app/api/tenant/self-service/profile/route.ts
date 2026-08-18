/**
 * GET /api/tenant/self-service/profile
 * Returns the logged-in employee's own profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('self_service:read')
  if (guard.error) return guard.error
  const { tenantId, sub } = guard.session

  const [employee] = await db
    .select({
      id:              employees.id,
      employeeNumber:  employees.employeeNumber,
      firstName:       employees.firstName,
      lastName:        employees.lastName,
      preferredName:   employees.preferredName,
      email:           employees.email,
      phone:           employees.phone,
      photoUrl:        employees.photoUrl,
      employmentType:  employees.employmentType,
      startDate:       employees.startDate,
      awardClassification: employees.awardClassification,
      hourlyRate:      employees.hourlyRate,
      annualSalary:    employees.annualSalary,
      isActive:        employees.isActive,
    })
    .from(employees)
    .where(and(
      eq(employees.tenantId, tenantId),
      eq(employees.userId, sub),
    ))

  if (!employee) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
  return NextResponse.json({ employee })
}
