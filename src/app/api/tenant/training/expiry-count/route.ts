import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trainingRecords, courses } from '@/lib/db/schema'
import { eq, and, lte, gte, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('training:read')
  if (guard.error) return guard.error
  const { session } = guard

  const today = new Date()
  const in30  = new Date(today); in30.setDate(in30.getDate() + 30)

  const rows = await db
    .select({ id: trainingRecords.id })
    .from(trainingRecords)
    .leftJoin(courses, eq(trainingRecords.courseId, courses.id))
    .where(and(
      eq(trainingRecords.tenantId, session.tenantId!),
      ne(trainingRecords.status, 'cancelled'),
      lte(trainingRecords.expiryDate, in30.toISOString().slice(0, 10)),
      gte(trainingRecords.expiryDate, today.toISOString().slice(0, 10)),
    ))

  return NextResponse.json({ count: rows.length })
}
