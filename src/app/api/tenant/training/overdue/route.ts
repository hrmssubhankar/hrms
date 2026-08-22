import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trainingRecords, courses, employees } from '@/lib/db/schema'
import { eq, and, lt, isNotNull, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('training:read')
  if (guard.error) return guard.error
  const { session } = guard

  const today = new Date().toISOString().slice(0, 10)

  const rows = await db
    .select({
      employeeId:   trainingRecords.employeeId,
      firstName:    employees.firstName,
      lastName:     employees.lastName,
      courseTitle:  courses.title,
      expiryDate:   trainingRecords.expiryDate,
    })
    .from(trainingRecords)
    .leftJoin(courses,   eq(trainingRecords.courseId,   courses.id))
    .leftJoin(employees, eq(trainingRecords.employeeId, employees.id))
    .where(and(
      eq(trainingRecords.tenantId, session.tenantId!),
      eq(employees.isActive, true),
      eq(courses.isMandatory, true),
      isNotNull(trainingRecords.expiryDate),
      lt(trainingRecords.expiryDate, today),
      ne(trainingRecords.status, 'cancelled'),
    ))
    .limit(10)

  return NextResponse.json({ overdue: rows })
}
