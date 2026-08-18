/**
 * DELETE /api/tenant/reports-analytics/saved/[reportId]
 * PATCH  /api/tenant/reports-analytics/saved/[reportId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { reportId: string } }) {
  const guard = await apiGuard('reports_analytics:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const body = await req.json()
  const [updated] = await db
    .update(savedReports)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(savedReports.id, params.reportId), eq(savedReports.tenantId, tenantId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ report: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { reportId: string } }) {
  const guard = await apiGuard('reports_analytics:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  await db
    .delete(savedReports)
    .where(and(eq(savedReports.id, params.reportId), eq(savedReports.tenantId, tenantId)))

  return NextResponse.json({ ok: true })
}
