import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  const rows = await db
    .select({ complianceStatus: employees.complianceStatus })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId!),
      eq(employees.isActive, true),
    ))

  const counts = { green: 0, amber: 0, red: 0, pending: 0 }
  for (const r of rows) {
    const s = r.complianceStatus as keyof typeof counts
    if (s in counts) counts[s]++
  }
  const total = rows.length
  const score = total > 0 ? Math.round((counts.green / total) * 100) : 0

  return NextResponse.json({ counts, total, score })
}
