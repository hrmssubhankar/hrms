import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { platformAnnouncements, tenants } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { getTenantRoleEmails } from '@/lib/email/emailHelper'
import { sendEmail } from '@/lib/email/resend'

const PRIORITY_LABEL: Record<string, string> = {
  info:     'ℹ️ Information',
  warning:  '⚠️ Important Notice',
  critical: '🚨 Critical Alert',
}

/** Fire-and-forget: email directors + hr_officers in all target tenants */
async function deliverAnnouncementEmail(
  title: string,
  body: string,
  priority: string,
  targetTenants: string,
  createdBy: string,
) {
  try {
    let tenantIds: string[]
    if (targetTenants === 'all') {
      const rows = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.isActive, true))
      tenantIds = rows.map(r => r.id)
    } else {
      tenantIds = Array.isArray(targetTenants) ? targetTenants : JSON.parse(targetTenants)
    }

    const priorityLabel = PRIORITY_LABEL[priority] ?? priority

    for (const tid of tenantIds) {
      const emails = await getTenantRoleEmails(tid, ['director', 'hr_officer'])
      if (emails.length === 0) continue
      await sendEmail({
        to: emails,
        subject: `[HRMS Platform] ${title}`,
        html: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#111827;padding:22px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;">HRMS Platform</span>
            </div>
            <div style="padding:28px 32px;">
              <p style="display:inline-block;background:${priority === 'critical' ? '#fee2e2' : priority === 'warning' ? '#fef9c3' : '#dbeafe'};color:${priority === 'critical' ? '#991b1b' : priority === 'warning' ? '#854d0e' : '#1e40af'};padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:0 0 16px;">${priorityLabel}</p>
              <h2 style="color:#111827;font-size:18px;font-weight:700;margin:0 0 12px;">${title}</h2>
              <p style="color:#4b5563;font-size:15px;margin:0 0 16px;line-height:1.6;white-space:pre-wrap;">${body}</p>
              <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">Sent by ${createdBy} via HRMS Platform.</p>
            </div>
            <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">This message was sent from the <strong>HRMS Platform</strong> by Yahweh Care Pty Ltd.</p>
            </div>
          </div>
        `,
        text: `${priorityLabel}\n\n${title}\n\n${body}\n\n— ${createdBy}`,
      }).catch(err => console.error('[announcement-email]', tid, err))
    }
  } catch (err) {
    console.error('[announcement-email-delivery]', err)
  }
}

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

    // Deliver notification email (fire-and-forget — never blocks the 201 response)
    deliverAnnouncementEmail(
      title.trim(),
      body.trim(),
      priority,
      typeof targetTenants === 'string' ? targetTenants : JSON.stringify(targetTenants),
      session!.email,
    )

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
