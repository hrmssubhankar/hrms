import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

// GET — fetch notifications for the current user
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'tenant_user') {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.sub))
      .orderBy(desc(notifications.createdAt))
      .limit(20)

    return NextResponse.json({ notifications: items })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

// PATCH — mark read (all or single)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'tenant_user') {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    if (body.id) {
      // Mark single notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, session.sub)))
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.sub))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
