/**
 * GET  /api/tenant/participants/[id]/notes
 * POST /api/tenant/participants/[id]/notes
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantNotes } from '@/lib/db/schema'
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

  const notes = await db
    .select()
    .from(participantNotes)
    .where(and(eq(participantNotes.participantId, id), eq(participantNotes.tenantId, tenantId)))
    .orderBy(desc(participantNotes.createdAt))

  return NextResponse.json({ notes })
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
  const { noteType, title, content, visibility } = body

  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const [created] = await db.insert(participantNotes).values({
    tenantId,
    participantId: id,
    noteType:   noteType    || 'case_note',
    title:      title       || null,
    content,
    visibility: visibility  || 'internal',
    createdBy:  email,
  }).returning()

  return NextResponse.json({ note: created }, { status: 201 })
}
