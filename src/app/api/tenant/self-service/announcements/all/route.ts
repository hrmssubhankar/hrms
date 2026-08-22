/**
 * GET /api/tenant/self-service/announcements/all
 * Admin view — returns ALL announcements (including expired) for the tenant.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { essAnnouncements } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const rows = await db
    .select()
    .from(essAnnouncements)
    .where(eq(essAnnouncements.tenantId, tenantId))
    .orderBy(desc(essAnnouncements.createdAt))

  return NextResponse.json({ announcements: rows })
}
