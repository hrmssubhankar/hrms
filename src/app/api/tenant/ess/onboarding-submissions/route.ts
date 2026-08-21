/**
 * GET   /api/tenant/ess/onboarding-submissions  — HR: list all submissions
 * PATCH /api/tenant/ess/onboarding-submissions/[id]  — see [id]/route.ts
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { essOnboarding, employees } from '@/lib/db/schema'
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') ?? ''

  const conditions = [eq(essOnboarding.tenantId, tenantId)]
  if (status && status !== 'all') {
    conditions.push(eq(essOnboarding.status, status))
  }

  const rows = await db
    .select({
      id:              essOnboarding.id,
      employeeId:      essOnboarding.employeeId,
      preferredName:   essOnboarding.preferredName,
      status:          essOnboarding.status,
      submittedAt:     essOnboarding.submittedAt,
      reviewedAt:      essOnboarding.reviewedAt,
      reviewedBy:      essOnboarding.reviewedBy,
      hrNotes:         essOnboarding.hrNotes,
      updatedAt:       essOnboarding.updatedAt,
      // employee info
      employeeName:    sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as('employee_name'),
      employeeEmail:   employees.email,
      departmentId:    employees.departmentId,
      positionId:      employees.positionId,
    })
    .from(essOnboarding)
    .innerJoin(employees, and(
      eq(employees.id, essOnboarding.employeeId),
      eq(employees.tenantId, tenantId),
    ))
    .where(
      search
        ? and(
            ...conditions,
            or(
              ilike(employees.firstName, `%${search}%`),
              ilike(employees.lastName, `%${search}%`),
              ilike(employees.email, `%${search}%`),
            )
          )
        : and(...conditions)
    )
    .orderBy(desc(essOnboarding.submittedAt))

  return NextResponse.json({ submissions: rows })
}
