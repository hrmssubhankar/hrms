/**
 * GET  /api/tenant/participants/[id]/contacts
 * POST /api/tenant/participants/[id]/contacts
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantContacts } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
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

  const contacts = await db
    .select()
    .from(participantContacts)
    .where(and(eq(participantContacts.participantId, id), eq(participantContacts.tenantId, tenantId)))
    .orderBy(asc(participantContacts.isPrimary), asc(participantContacts.firstName))

  return NextResponse.json({ contacts })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [p] = await db.select({ id: participants.id }).from(participants)
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))
  if (!p) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  const body = await req.json()
  const { contactType, firstName, lastName, relationship, phone, email, address, isPrimary, notes } = body

  if (!firstName) return NextResponse.json({ error: 'firstName is required' }, { status: 400 })

  const [created] = await db.insert(participantContacts).values({
    tenantId,
    participantId: id,
    contactType:  contactType  || 'emergency',
    firstName,
    lastName:     lastName     || null,
    relationship: relationship || null,
    phone:        phone        || null,
    email:        email        || null,
    address:      address      || null,
    isPrimary:    isPrimary    ?? false,
    notes:        notes        || null,
  }).returning()

  return NextResponse.json({ contact: created }, { status: 201 })
}
