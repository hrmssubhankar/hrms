/**
 * GET /api/tenant/employees/screening-expiry
 * Returns the nearest upcoming screening expiry date per active employee.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { screeningRecords, employees } from '@/lib/db/schema'
import { eq, and, isNotNull, gte, sql } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const today = new Date().toISOString().split('T')[0]

  const rows = await db
    .select({
      employeeId: screeningRecords.employeeId,
      expiryDate: sql<string>`MIN(${screeningRecords.expiryDate})`.as('expiry_date'),
    })
    .from(screeningRecords)
    .innerJoin(employees, eq(employees.id, screeningRecords.employeeId))
    .where(and(
      eq(screeningRecords.tenantId, tenantId),
      eq(employees.isActive, true),
      isNotNull(screeningRecords.expiryDate),
      gte(screeningRecords.expiryDate, today),
    ))
    .groupBy(screeningRecords.employeeId)

  const now = new Date()
  const result: Record<string, { expiryDate: string; daysUntil: number }> = {}

  for (const r of rows) {
    const exp = new Date(r.expiryDate)
    const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / 86400000)
    result[r.employeeId] = { expiryDate: r.expiryDate, daysUntil }
  }

  return NextResponse.json({ screeningExpiry: result })
}
