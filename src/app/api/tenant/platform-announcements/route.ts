/**
 * GET /api/tenant/platform-announcements
 *
 * Returns active, non-expired platform announcements visible to the
 * current tenant. Used by the tenant layout banner.
 *
 * Access: any authenticated tenant user (no specific permission needed —
 *         platform notices are informational and safe for all roles).
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformAnnouncements } from '@/lib/db/schema'
import { apiGuard } from '@/lib/auth/apiGuard'
import { and, eq, or, isNull, gt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await apiGuard('employees:read') // lightest permission — any logged-in user
  if (guard.error) return guard.error

  const { session } = guard
  const tenantId = session.tenantId

  try {
    const now = new Date()

    const rows = await db
      .select({
        id:       platformAnnouncements.id,
        title:    platformAnnouncements.title,
        body:     platformAnnouncements.body,
        priority: platformAnnouncements.priority,
        expiresAt: platformAnnouncements.expiresAt,
        createdAt: platformAnnouncements.createdAt,
      })
      .from(platformAnnouncements)
      .where(
        and(
          eq(platformAnnouncements.isActive, true),
          // Not yet expired (null expiresAt = never expires)
          or(
            isNull(platformAnnouncements.expiresAt),
            gt(platformAnnouncements.expiresAt, now),
          ),
        ),
      )
      .orderBy(platformAnnouncements.createdAt)

    // Filter by targetTenants: 'all' shows to everyone; otherwise a JSON array of tenant IDs
    const visible = rows.filter(r => {
      const raw = (r as any).targetTenants ?? 'all'
      if (raw === 'all') return true
      try {
        const ids: string[] = typeof raw === 'string' ? JSON.parse(raw) : raw
        return ids.includes(tenantId)
      } catch {
        return false
      }
    })

    return NextResponse.json({ announcements: visible })
  } catch (err: any) {
    console.error('GET /api/tenant/platform-announcements error:', err)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}
