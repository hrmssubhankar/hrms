/**
 * GET  /api/tenant/medication-health/participants/[participantId]/conditions
 * POST /api/tenant/medication-health/participants/[participantId]/conditions
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantHealthConditions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> },
) {
  const guard = await apiGuard('medication_health:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { participantId } = await params

  const conditions = await db
    .select()
    .from(participantHealthConditions)
    .where(and(
      eq(participantHealthConditions.participantId, participantId),
      eq(participantHealthConditions.tenantId, tenantId),
    ))
    .orderBy(desc(participantHealthConditions.createdAt))

  return NextResponse.json({ conditions })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> },
) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { participantId } = await params

  const [p] = await db.select({ id: participants.id }).from(participants)
    .where(and(eq(participants.id, participantId), eq(participants.tenantId, tenantId)))
  if (!p) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  const body = await req.json()
  const {
    conditionName, conditionType, icdCode, severity,
    diagnosedDate, diagnosedBy, status, description, managementPlan, alerts,
  } = body

  if (!conditionName) return NextResponse.json({ error: 'conditionName is required' }, { status: 400 })

  const [created] = await db.insert(participantHealthConditions).values({
    tenantId,
    participantId,
    conditionName,
    conditionType:  conditionType  || 'chronic',
    icdCode:        icdCode        || null,
    severity:       severity       || 'moderate',
    diagnosedDate:  diagnosedDate  || null,
    diagnosedBy:    diagnosedBy    || null,
    status:         status         || 'active',
    description:    description    || null,
    managementPlan: managementPlan || null,
    alerts:         alerts         || null,
    createdBy:      email,
  }).returning()

  return NextResponse.json({ condition: created }, { status: 201 })
}
