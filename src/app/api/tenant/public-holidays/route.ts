import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicHolidays } from '@/lib/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// ── GET /api/tenant/public-holidays ──────────────────────────────────────────
// Returns public holidays for the tenant.
// Query params: year (defaults to current year), country (default 'AU')
export async function GET(req: NextRequest) {
  const guard = await apiGuard('leave:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = req.nextUrl
  const year    = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const country = searchParams.get('country') ?? 'AU'

  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const rows = await db
    .select({
      id:         publicHolidays.id,
      name:       publicHolidays.name,
      date:       publicHolidays.date,
      country:    publicHolidays.country,
      state:      publicHolidays.state,
      isNational: publicHolidays.isNational,
    })
    .from(publicHolidays)
    .where(
      and(
        eq(publicHolidays.tenantId, session.tenantId),
        eq(publicHolidays.country, country),
        gte(publicHolidays.date, from),
        lte(publicHolidays.date, to),
      )
    )
    .orderBy(asc(publicHolidays.date))

  return NextResponse.json({ holidays: rows, year, country })
}
