/**
 * PUT    /api/tenant/incident-behaviour/participants/[participantId]/restrictive-practices/[practiceId]
 * DELETE /api/tenant/incident-behaviour/participants/[participantId]/restrictive-practices/[practiceId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantRestrictivePractices } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; practiceId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { practiceId } = await params

  const body = await req.json()
  const [updated] = await db.update(participantRestrictivePractices)
    .set({ ...body, updatedAt: new Date() })
    .where(and(
      eq(participantRestrictivePractices.id, practiceId),
      eq(participantRestrictivePractices.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ practice: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { practiceId } = await params

  await db.delete(participantRestrictivePractices)
    .where(and(
      eq(participantRestrictivePractices.id, practiceId),
      eq(participantRestrictivePractices.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
