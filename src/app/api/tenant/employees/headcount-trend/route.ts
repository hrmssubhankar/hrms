import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and, lte, gte, or, isNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  const months: { label: string; count: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const iso = endOfMonth.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-AU', { month: 'short' })

    const rows = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.tenantId, session.tenantId!),
        lte(employees.startDate, iso),
        or(isNull(employees.endDate), gte(employees.endDate, iso)),
        eq(employees.isActive, true),
      ))

    months.push({ label, count: rows.length })
  }

  return NextResponse.json({ months })
}
