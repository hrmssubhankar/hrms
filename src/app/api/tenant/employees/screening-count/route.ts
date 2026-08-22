import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { screeningRecords } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const today = new Date()
  const in30  = new Date(today); in30.setDate(in30.getDate() + 30)

  const rows = await db
    .select({ id: screeningRecords.id })
    .from(screeningRecords)
    .where(and(
      eq(screeningRecords.tenantId, tenantId),
      isNotNull(screeningRecords.expiryDate),
      gte(screeningRecords.expiryDate, today.toISOString().slice(0, 10)),
      lte(screeningRecords.expiryDate, in30.toISOString().slice(0, 10)),
    ))

  return NextResponse.json({ count: rows.length })
}
