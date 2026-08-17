/**
 * GET  /api/tenant/medication-health/participants/[participantId]/medications/[medicationId]/logs
 * POST /api/tenant/medication-health/participants/[participantId]/medications/[medicationId]/logs
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantMedications, participantMedicationLogs } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ participantId: string; medicationId: string }> },
) {
  const guard = await apiGuard('medication_health:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { medicationId } = await params

  const logs = await db
    .select()
    .from(participantMedicationLogs)
    .where(and(
      eq(participantMedicationLogs.medicationId, medicationId),
      eq(participantMedicationLogs.tenantId, tenantId),
    ))
    .orderBy(desc(participantMedicationLogs.scheduledTime))

  return NextResponse.json({ logs })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string; medicationId: string }> },
) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session
  const { participantId, medicationId } = await params

  const [med] = await db.select({ id: participantMedications.id }).from(participantMedications)
    .where(and(eq(participantMedications.id, medicationId), eq(participantMedications.tenantId, tenantId)))
  if (!med) return NextResponse.json({ error: 'Medication not found' }, { status: 404 })

  const body = await req.json()
  const { scheduledTime, administeredAt, outcome, notes } = body

  if (!scheduledTime) return NextResponse.json({ error: 'scheduledTime is required' }, { status: 400 })

  const [created] = await db.insert(participantMedicationLogs).values({
    tenantId,
    medicationId,
    participantId,
    scheduledTime:  new Date(scheduledTime),
    administeredAt: administeredAt ? new Date(administeredAt) : null,
    outcome:        outcome        || 'given',
    administeredBy: email,
    notes:          notes          || null,
  }).returning()

  return NextResponse.json({ log: created }, { status: 201 })
}
