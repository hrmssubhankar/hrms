/**
 * PATCH  /api/tenant/medication-health/participants/[participantId]/medications/[medicationId]
 * DELETE /api/tenant/medication-health/participants/[participantId]/medications/[medicationId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantMedications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; medicationId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { medicationId } = await params

  const {
    medicationName, genericName, dosage, form, route, frequency, prescribedBy,
    indication, instructions, startDate, endDate, status, requiresAssist, refrigerated, notes,
  } = await req.json()
  const [updated] = await db.update(participantMedications)
    .set({
      ...(medicationName !== undefined && { medicationName }),
      ...(genericName    !== undefined && { genericName }),
      ...(dosage         !== undefined && { dosage }),
      ...(form           !== undefined && { form }),
      ...(route          !== undefined && { route }),
      ...(frequency      !== undefined && { frequency }),
      ...(prescribedBy   !== undefined && { prescribedBy }),
      ...(indication     !== undefined && { indication }),
      ...(instructions   !== undefined && { instructions }),
      ...(startDate      !== undefined && { startDate }),
      ...(endDate        !== undefined && { endDate }),
      ...(status         !== undefined && { status }),
      ...(requiresAssist !== undefined && { requiresAssist }),
      ...(refrigerated   !== undefined && { refrigerated }),
      ...(notes          !== undefined && { notes }),
      updatedAt: new Date(),
    })
    .where(and(
      eq(participantMedications.id, medicationId),
      eq(participantMedications.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ medication: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { medicationId } = await params

  await db.delete(participantMedications)
    .where(and(
      eq(participantMedications.id, medicationId),
      eq(participantMedications.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
