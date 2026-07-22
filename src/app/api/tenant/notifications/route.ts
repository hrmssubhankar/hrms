import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET — fetch notifications for the current user
export async function GET() {
  const guard = await apiGuard()
  if (guard.error) return guard.error
  const { session } = guard

  const userId = session.sub
  if (!userId) return NextResponse.json({ notifications: [] })

  try {
    const items = await db
      .select({
        id:        notifications.id,
        type:      notifications.type,
        title:     notifications.title,
        body:      notifications.body,
        isRead:    notifications.isRead,
        link:      notifications.link,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, session.tenantId),
          eq(notifications.userId, userId),
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    return NextResponse.json({ notifications: items })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

// PATCH — mark read (all or single)
export async function PATCH(req: NextRequest) {
  const guard = await apiGuard()
  if (guard.error) return guard.error
  const { session } = guard

  const userId = session.sub
  if (!userId) return NextResponse.json({ ok: true })

  try {
    const body = await req.json().catch(() => ({}))

    if (body.id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, body.id),
            eq(notifications.userId, userId),
            eq(notifications.tenantId, session.tenantId),
          )
        )
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.tenantId, session.tenantId),
          )
        )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
