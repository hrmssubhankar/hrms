import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformAnnouncements } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

function guard(session: any) {
  return !session || session.role !== 'super_admin'
}

// GET /api/super-admin/announcements
export async function GET() {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const announcements = await db
      .select()
      .from(platformAnnouncements)
      .orderBy(desc(platformAnnouncements.createdAt))

    return NextResponse.json({ announcements })
  } catch (err) {
    console.error('GET /api/super-admin/announcements error:', err)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST /api/super-admin/announcements — create
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, body, priority = 'info', targetTenants = 'all', expiresAt } = await req.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const [announcement] = await db
      .insert(platformAnnouncements)
      .values({
        title:         title.trim(),
        body:          body.trim(),
        priority:      priority as 'info' | 'warning' | 'critical',
        targetTenants: typeof targetTenants === 'string' ? targetTenants : JSON.stringify(targetTenants),
        expiresAt:     expiresAt ? new Date(expiresAt) : null,
        isActive:      true,
        createdBy:     session!.email,
      })
      .returning()

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (err) {
    console.error('POST /api/super-admin/announcements error:', err)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

// PATCH /api/super-admin/announcements — toggle active
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, isActive, title, body, priority, expiresAt } = await req.json()

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const updates: Partial<typeof platformAnnouncements.$inferInsert> = {}
    if (isActive     !== undefined) updates.isActive   = isActive
    if (title        !== undefined) updates.title      = title.trim()
    if (body         !== undefined) updates.body       = body.trim()
    if (priority     !== undefined) updates.priority   = priority
    if (expiresAt    !== undefined) updates.expiresAt  = expiresAt ? new Date(expiresAt) : null

    const [updated] = await db
      .update(platformAnnouncements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformAnnouncements.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

    return NextResponse.json({ announcement: updated })
  } catch (err) {
    console.error('PATCH /api/super-admin/announcements error:', err)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE /api/super-admin/announcements?id=...
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.delete(platformAnnouncements).where(eq(platformAnnouncements.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/super-admin/announcements error:', err)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
