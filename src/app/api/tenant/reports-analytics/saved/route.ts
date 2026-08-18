/**
 * GET  /api/tenant/reports-analytics/saved
 * POST /api/tenant/reports-analytics/saved
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('reports_analytics:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const reports = await db
    .select()
    .from(savedReports)
    .where(eq(savedReports.tenantId, tenantId))
    .orderBy(desc(savedReports.updatedAt))

  return NextResponse.json({ reports })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('reports_analytics:read')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const { name, reportType, filters, columns, sortBy, sortDir, isShared } = await req.json()
  if (!name || !reportType)
    return NextResponse.json({ error: 'name and reportType are required' }, { status: 400 })

  const [created] = await db.insert(savedReports).values({
    tenantId,
    name,
    reportType,
    filters:  filters  ?? {},
    columns:  columns  ?? [],
    sortBy:   sortBy   || null,
    sortDir:  sortDir  || 'asc',
    isShared: isShared ?? false,
    createdBy: email,
  }).returning()

  return NextResponse.json({ report: created }, { status: 201 })
}
