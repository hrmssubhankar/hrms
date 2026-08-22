/**
 * GET    /api/tenant/self-service/announcements
 * POST   /api/tenant/self-service/announcements  (admin: create)
 * PATCH  /api/tenant/self-service/announcements  (admin: update by id)
 * DELETE /api/tenant/self-service/announcements  (admin: delete by id)
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

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { id, title, body, priority, targetRole, publishedAt, expiresAt } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!title || !body) return NextResponse.json({ error: 'title and body are required' }, { status: 400 })

  const [updated] = await db
    .update(essAnnouncements)
    .set({
      title,
      body,
      priority:    priority   || 'info',
      targetRole:  targetRole || null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt:   expiresAt   ? new Date(expiresAt)   : null,
    })
    .where(and(eq(essAnnouncements.id, id), eq(essAnnouncements.tenantId, tenantId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ announcement: updated })
}

export async function DELETE(req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

  const [deleted] = await db
    .delete(essAnnouncements)
    .where(and(eq(essAnnouncements.id, id), eq(essAnnouncements.tenantId, tenantId)))
    .returning()

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
