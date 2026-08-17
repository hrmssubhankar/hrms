/**
 * GET  /api/tenant/participants/[id]/goals  — list goals
 * POST /api/tenant/participants/[id]/goals  — create goal
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantGoals } from '@/lib/db/schema'
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

  const goals = await db
    .select()
    .from(participantGoals)
    .where(and(eq(participantGoals.participantId, id), eq(participantGoals.tenantId, tenantId)))
    .orderBy(desc(participantGoals.createdAt))

  return NextResponse.json({ goals })
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
  const { goalCategory, title, description, status, targetDate, achievedDate, progressNotes } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const [created] = await db.insert(participantGoals).values({
    tenantId,
    participantId: id,
    goalCategory:  goalCategory   || 'daily_living',
    title,
    description:   description    || null,
    status:        status         || 'not_started',
    targetDate:    targetDate     || null,
    achievedDate:  achievedDate   || null,
    progressNotes: progressNotes  || null,
    createdBy:     email,
  }).returning()

  return NextResponse.json({ goal: created }, { status: 201 })
}
