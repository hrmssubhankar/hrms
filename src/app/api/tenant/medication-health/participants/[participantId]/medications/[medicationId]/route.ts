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

  const body = await req.json()
  const [updated] = await db.update(participantMedications)
    .set({ ...body, updatedAt: new Date() })
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
