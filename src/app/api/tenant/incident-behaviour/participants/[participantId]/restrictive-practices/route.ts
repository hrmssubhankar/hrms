/**
 * GET  /api/tenant/incident-behaviour/participants/[participantId]/restrictive-practices
 * POST /api/tenant/incident-behaviour/participants/[participantId]/restrictive-practices
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantRestrictivePractices } from '@/lib/db/schema'
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

  const practices = await db
    .select()
    .from(participantRestrictivePractices)
    .where(and(
      eq(participantRestrictivePractices.participantId, participantId),
      eq(participantRestrictivePractices.tenantId, tenantId),
    ))
    .orderBy(desc(participantRestrictivePractices.createdAt))

  return NextResponse.json({ practices })
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
    practiceType, description, authorisedBy, authorisedDate, expiryDate,
    regulatoryApproval, approvalReference, monitoringFrequency,
    lastReviewDate, nextReviewDate, status, notes,
  } = body

  if (!practiceType)  return NextResponse.json({ error: 'practiceType is required' }, { status: 400 })
  if (!description)   return NextResponse.json({ error: 'description is required' }, { status: 400 })

  const [created] = await db.insert(participantRestrictivePractices).values({
    tenantId,
    participantId,
    practiceType,
    description,
    authorisedBy:         authorisedBy         || null,
    authorisedDate:       authorisedDate        || null,
    expiryDate:           expiryDate            || null,
    regulatoryApproval:   regulatoryApproval    ?? false,
    approvalReference:    approvalReference     || null,
    monitoringFrequency:  monitoringFrequency   || null,
    lastReviewDate:       lastReviewDate        || null,
    nextReviewDate:       nextReviewDate        || null,
    status:               status                || 'active',
    notes:                notes                 || null,
    createdBy:            email,
  }).returning()

  return NextResponse.json({ practice: created }, { status: 201 })
}
