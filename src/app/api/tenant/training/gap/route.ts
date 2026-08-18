/**
 * GET /api/tenant/training/gap
 * Returns employees missing mandatory courses
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, courses, trainingRecords } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('training:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  // Get all mandatory courses for this tenant
  const mandatoryCourses = await db
    .select({ id: courses.id, title: courses.title, category: courses.category })
    .from(courses)
    .where(and(eq(courses.tenantId, tenantId), eq(courses.isMandatory, true), eq(courses.isActive, true)))

  if (mandatoryCourses.length === 0) return NextResponse.json({ gaps: [], mandatoryCourses: [] })

  // Get all active employees
  const activeEmployees = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, employmentType: employees.employmentType, email: employees.email })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.isActive, true)))

  // Get all completed (non-expired) training records for mandatory courses
  const completed = await db
    .select({ employeeId: trainingRecords.employeeId, courseId: trainingRecords.courseId, status: trainingRecords.status, expiryDate: trainingRecords.expiryDate })
    .from(trainingRecords)
    .where(and(
      eq(trainingRecords.tenantId, tenantId),
      sql`${trainingRecords.courseId} = ANY(ARRAY[${sql.join(mandatoryCourses.map(c => sql`${c.id}::uuid`), sql`, `)}])`,
    ))

  const now = new Date()

  // Build gap matrix
  const gaps: {
    employeeId: string
    firstName: string
    lastName: string
    employmentType: string
    email: string
    missingCourses: { id: string; title: string; category: string | null }[]
    expiredCourses: { id: string; title: string; category: string | null; expiredOn: string }[]
  }[] = []

  for (const emp of activeEmployees) {
    const empRecords = completed.filter(r => r.employeeId === emp.id)
    const missing: typeof gaps[0]['missingCourses'] = []
    const expired: typeof gaps[0]['expiredCourses'] = []

    for (const course of mandatoryCourses) {
      const record = empRecords.find(r => r.courseId === course.id && r.status === 'completed')
      if (!record) {
        missing.push({ id: course.id, title: course.title, category: course.category })
      } else if (record.expiryDate && new Date(record.expiryDate) < now) {
        expired.push({ id: course.id, title: course.title, category: course.category, expiredOn: record.expiryDate })
      }
    }

    if (missing.length > 0 || expired.length > 0) {
      gaps.push({ employeeId: emp.id, firstName: emp.firstName, lastName: emp.lastName, employmentType: emp.employmentType, email: emp.email, missingCourses: missing, expiredCourses: expired })
    }
  }

  return NextResponse.json({ gaps, mandatoryCourses })
}
