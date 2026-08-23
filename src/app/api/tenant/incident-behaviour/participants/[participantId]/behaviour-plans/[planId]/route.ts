/**
 * PUT    /api/tenant/incident-behaviour/participants/[participantId]/behaviour-plans/[planId]
 * DELETE /api/tenant/incident-behaviour/participants/[participantId]/behaviour-plans/[planId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantBehaviourPlans } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; planId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { planId } = await params

  const body = await req.json()
  const [updated] = await db.update(participantBehaviourPlans)
    .set({ ...body, updatedAt: new Date() })
    .where(and(
      eq(participantBehaviourPlans.id, planId),
      eq(participantBehaviourPlans.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ plan: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { planId } = await params

  await db.delete(participantBehaviourPlans)
    .where(and(
      eq(participantBehaviourPlans.id, planId),
      eq(participantBehaviourPlans.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
