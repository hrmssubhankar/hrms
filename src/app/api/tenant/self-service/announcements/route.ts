/**
 * GET  /api/tenant/self-service/announcements
 * POST /api/tenant/self-service/announcements  (admin: create)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { essAnnouncements } from '@/lib/db/schema'
import { eq, and, desc, or, isNull, gte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('self_service:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const now = new Date()
  const rows = await db
    .select()
    .from(essAnnouncements)
    .where(and(
      eq(essAnnouncements.tenantId, tenantId),
      or(isNull(essAnnouncements.expiresAt), gte(essAnnouncements.expiresAt, now)),
    ))
    .orderBy(desc(essAnnouncements.createdAt))

  return NextResponse.json({ announcements: rows })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const { title, body, priority, targetRole, publishedAt, expiresAt } = await req.json()
  if (!title || !body)
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })

  const [created] = await db.insert(essAnnouncements).values({
    tenantId,
    title,
    body,
    priority:    priority    || 'info',
    targetRole:  targetRole  || null,
    publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    expiresAt:   expiresAt   ? new Date(expiresAt)   : null,
    createdBy:   email,
  }).returning()

  return NextResponse.json({ announcement: created }, { status: 201 })
}
