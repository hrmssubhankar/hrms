/**
 * GET  /api/tenant/participants/[id]/support-plans
 * POST /api/tenant/participants/[id]/support-plans
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantSupportPlans } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const plans = await db
    .select()
    .from(participantSupportPlans)
    .where(and(eq(participantSupportPlans.participantId, id), eq(participantSupportPlans.tenantId, tenantId)))
    .orderBy(desc(participantSupportPlans.createdAt))

  return NextResponse.json({ plans })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { id } = await params

  const [p] = await db.select({ id: participants.id }).from(participants)
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))
  if (!p) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  const body = await req.json()
  const {
    planType, title, status, planStartDate, planEndDate, reviewDate,
    totalBudget, fundedSupports, coordinatorName, coordinatorOrg, coordinatorEmail, notes,
  } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const [created] = await db.insert(participantSupportPlans).values({
    tenantId,
    participantId:    id,
    planType:         planType         || 'initial',
    title,
    status:           status           || 'draft',
    planStartDate:    planStartDate    || null,
    planEndDate:      planEndDate      || null,
    reviewDate:       reviewDate       || null,
    totalBudget:      totalBudget      ?? null,
    fundedSupports:   fundedSupports   || null,
    coordinatorName:  coordinatorName  || null,
    coordinatorOrg:   coordinatorOrg   || null,
    coordinatorEmail: coordinatorEmail || null,
    notes:            notes            || null,
    createdBy:        email,
  }).returning()

  return NextResponse.json({ plan: created }, { status: 201 })
}
