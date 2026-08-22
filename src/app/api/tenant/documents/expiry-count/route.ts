import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq, and, lte, gte, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET() {
  const guard = await apiGuard('documents:read')
  if (guard.error) return guard.error
  const { session } = guard

  const today = new Date()
  const in30  = new Date(today); in30.setDate(in30.getDate() + 30)

  const rows = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(
      eq(documents.tenantId, session.tenantId!),
      ne(documents.status, 'archived'),
      lte(documents.expiryDate, in30.toISOString().slice(0, 10)),
      gte(documents.expiryDate, today.toISOString().slice(0, 10)),
    ))

  return NextResponse.json({ count: rows.length })
}
