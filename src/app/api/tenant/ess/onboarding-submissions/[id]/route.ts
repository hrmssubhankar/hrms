/**
 * GET   /api/tenant/ess/onboarding-submissions/[id]  — HR: get full submission
 * PATCH /api/tenant/ess/onboarding-submissions/[id]  — HR: update status / notes
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { essOnboarding } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const [submission] = await db.select().from(essOnboarding)
    .where(and(eq(essOnboarding.id, params.id), eq(essOnboarding.tenantId, tenantId)))
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ submission })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()
  // HR can set status (hr_reviewed, completed), hrNotes, reviewedBy
  const { status, hrNotes } = body

  const updatePayload: Record<string, unknown> = { updatedAt: new Date() }
  if (status) updatePayload.status = status
  if (hrNotes !== undefined) updatePayload.hrNotes = hrNotes
  if (status === 'hr_reviewed' || status === 'completed') {
    updatePayload.reviewedBy  = email
    updatePayload.reviewedAt  = new Date()
  }

  const [submission] = await db.update(essOnboarding)
    .set(updatePayload)
    .where(and(eq(essOnboarding.id, params.id), eq(essOnboarding.tenantId, tenantId)))
    .returning()

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ submission })
}
