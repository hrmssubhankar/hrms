/**
 * GET  /api/tenant/medication-health/participants/[participantId]/medications
 * POST /api/tenant/medication-health/participants/[participantId]/medications
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, participantMedications } from '@/lib/db/schema'
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

  const medications = await db
    .select()
    .from(participantMedications)
    .where(and(
      eq(participantMedications.participantId, participantId),
      eq(participantMedications.tenantId, tenantId),
    ))
    .orderBy(desc(participantMedications.createdAt))

  return NextResponse.json({ medications })
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
    medicationName, genericName, dosage, form, route, frequency,
    prescribedBy, indication, instructions, startDate, endDate,
    status, requiresAssist, refrigerated, notes,
  } = body

  if (!medicationName) return NextResponse.json({ error: 'medicationName is required' }, { status: 400 })

  const [created] = await db.insert(participantMedications).values({
    tenantId,
    participantId,
    medicationName,
    genericName:   genericName   || null,
    dosage:        dosage        || null,
    form:          form          || 'tablet',
    route:         route         || 'oral',
    frequency:     frequency     || null,
    prescribedBy:  prescribedBy  || null,
    indication:    indication    || null,
    instructions:  instructions  || null,
    startDate:     startDate     || null,
    endDate:       endDate       || null,
    status:        status        || 'active',
    requiresAssist: requiresAssist ?? true,
    refrigerated:  refrigerated  ?? false,
    notes:         notes         || null,
    createdBy:     email,
  }).returning()

  return NextResponse.json({ medication: created }, { status: 201 })
}
