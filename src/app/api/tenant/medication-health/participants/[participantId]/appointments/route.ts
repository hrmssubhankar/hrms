/**
 * GET  /api/tenant/medication-health/participants/[participantId]/appointments
 * POST /api/tenant/medication-health/participants/[participantId]/appointments
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantHealthAppointments } from '@/lib/db/schema'
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

  const appointments = await db
    .select()
    .from(participantHealthAppointments)
    .where(and(
      eq(participantHealthAppointments.participantId, participantId),
      eq(participantHealthAppointments.tenantId, tenantId),
    ))
    .orderBy(desc(participantHealthAppointments.appointmentDate))

  return NextResponse.json({ appointments })
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
    appointmentType, providerName, providerOrg, appointmentDate, appointmentTime,
    location, purpose, outcome, followUpDate, followUpNotes,
    status, requiresTransport, supportWorkerNeeded,
  } = body

  if (!appointmentDate) return NextResponse.json({ error: 'appointmentDate is required' }, { status: 400 })

  const [created] = await db.insert(participantHealthAppointments).values({
    tenantId,
    participantId,
    appointmentType:      appointmentType      || 'gp',
    providerName:         providerName         || null,
    providerOrg:          providerOrg          || null,
    appointmentDate,
    appointmentTime:      appointmentTime      || null,
    location:             location             || null,
    purpose:              purpose              || null,
    outcome:              outcome              || null,
    followUpDate:         followUpDate         || null,
    followUpNotes:        followUpNotes        || null,
    status:               status               || 'scheduled',
    requiresTransport:    requiresTransport    ?? false,
    supportWorkerNeeded:  supportWorkerNeeded  ?? false,
    createdBy:            email,
  }).returning()

  return NextResponse.json({ appointment: created }, { status: 201 })
}
