/**
 * GET  /api/tenant/incident-behaviour/participants/[participantId]/incidents
 * POST /api/tenant/incident-behaviour/participants/[participantId]/incidents
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantIncidents } from '@/lib/db/schema'
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

  const incidents = await db
    .select()
    .from(participantIncidents)
    .where(and(
      eq(participantIncidents.participantId, participantId),
      eq(participantIncidents.tenantId, tenantId),
    ))
    .orderBy(desc(participantIncidents.incidentDate))

  return NextResponse.json({ incidents })
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
    incidentDate, incidentTime, location, incidentType, severity,
    description, immediateAction, witnesses, reportedBy, reportedTo,
    ndisReportable, policeReport, policeReportNumber,
    status, outcome, followUpRequired, followUpDate, followUpNotes,
  } = body

  if (!incidentDate) return NextResponse.json({ error: 'incidentDate is required' }, { status: 400 })
  if (!description)  return NextResponse.json({ error: 'description is required' }, { status: 400 })

  const [created] = await db.insert(participantIncidents).values({
    tenantId,
    participantId,
    incidentDate,
    incidentTime:        incidentTime        || null,
    location:            location            || null,
    incidentType:        incidentType        || 'general',
    severity:            severity            || 'minor',
    description,
    immediateAction:     immediateAction     || null,
    witnesses:           witnesses           || null,
    reportedBy:          reportedBy          || null,
    reportedTo:          reportedTo          || null,
    ndisReportable:      ndisReportable      ?? false,
    policeReport:        policeReport        ?? false,
    policeReportNumber:  policeReportNumber  || null,
    status:              status              || 'open',
    outcome:             outcome             || null,
    followUpRequired:    followUpRequired    ?? false,
    followUpDate:        followUpDate        || null,
    followUpNotes:       followUpNotes       || null,
    createdBy:           email,
  }).returning()

  return NextResponse.json({ incident: created }, { status: 201 })
}
