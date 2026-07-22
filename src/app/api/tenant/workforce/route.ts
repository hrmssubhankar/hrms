import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, departments, positions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('workforce_planning:read')
  if (guard.error) return guard.error
  const { session } = guard

  const [emps, depts, posts] = await Promise.all([
    db.select({
      id:             employees.id,
      firstName:      employees.firstName,
      lastName:       employees.lastName,
      email:          employees.email,
      employmentType: employees.employmentType,
      departmentId:   employees.departmentId,
      positionId:     employees.positionId,
      startDate:      employees.startDate,
      isActive:       employees.isActive,
    }).from(employees).where(and(eq(employees.tenantId, session.tenantId), eq(employees.isActive, true))),

    db.select().from(departments).where(eq(departments.tenantId, session.tenantId)),

    db.select().from(positions).where(and(eq(positions.tenantId, session.tenantId), eq(positions.isActive, true))),
  ])

  // Build headcount by department
  const byDept: Record<string, { name: string; count: number; positions: number }> = {}
  for (const d of depts) {
    byDept[d.id] = { name: d.name, count: 0, positions: posts.filter(p => p.departmentId === d.id).length }
  }
  for (const e of emps) {
    if (e.departmentId && byDept[e.departmentId]) byDept[e.departmentId].count++
  }

  return NextResponse.json({
    employees: emps,
    departments: depts,
    positions: posts,
    headcountByDepartment: Object.entries(byDept).map(([id, v]) => ({ id, ...v })),
    summary: {
      totalActive:  emps.length,
      fullTime:     emps.filter(e => e.employmentType === 'full_time').length,
      partTime:     emps.filter(e => e.employmentType === 'part_time').length,
      casual:       emps.filter(e => e.employmentType === 'casual').length,
      contractor:   emps.filter(e => e.employmentType === 'contractor').length,
      departments:  depts.length,
      positions:    posts.length,
    },
  })
}
