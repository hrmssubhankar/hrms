/**
 * GET  /api/tenant/incident-behaviour/participants/[participantId]/behaviour-plans
 * POST /api/tenant/incident-behaviour/participants/[participantId]/behaviour-plans
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantBehaviourPlans } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> },
) {
  const guard = await apiGuard('incident_behaviour:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { participantId } = await params

  const plans = await db
    .select()
    .from(participantBehaviourPlans)
    .where(and(
      eq(participantBehaviourPlans.participantId, participantId),
      eq(participantBehaviourPlans.tenantId, tenantId),
    ))
    .orderBy(desc(participantBehaviourPlans.createdAt))

  return NextResponse.json({ plans })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> },
) {
  const guard = await apiGuard('incident_behaviour:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { participantId } = await params

  const [p] = await db.select({ id: participants.id }).from(participants)
    .where(and(eq(participants.id, participantId), eq(participants.tenantId, tenantId)))
  if (!p) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  const body = await req.json()
  const {
    planName, behaviourType, triggers, earlyWarnings,
    preventionStrategies, deEscalationStrategies, responseStrategies,
    postIncidentSupport, authorisedBy, reviewDate, status, notes,
  } = body

  if (!planName) return NextResponse.json({ error: 'planName is required' }, { status: 400 })

  const [created] = await db.insert(participantBehaviourPlans).values({
    tenantId,
    participantId,
    planName,
    behaviourType:            behaviourType            || null,
    triggers:                 triggers                 || null,
    earlyWarnings:            earlyWarnings            || null,
    preventionStrategies:     preventionStrategies     || null,
    deEscalationStrategies:   deEscalationStrategies   || null,
    responseStrategies:       responseStrategies       || null,
    postIncidentSupport:      postIncidentSupport      || null,
    authorisedBy:             authorisedBy             || null,
    reviewDate:               reviewDate               || null,
    status:                   status                   || 'active',
    notes:                    notes                    || null,
    createdBy:                email,
  }).returning()

  return NextResponse.json({ plan: created }, { status: 201 })
}
