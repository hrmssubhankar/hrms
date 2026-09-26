/**
 * PATCH  /api/tenant/medication-health/participants/[participantId]/conditions/[conditionId]
 * DELETE /api/tenant/medication-health/participants/[participantId]/conditions/[conditionId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantHealthConditions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ participantId: string; conditionId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { conditionId } = await params

  const {
    conditionName, conditionType, icdCode, severity, diagnosedDate,
    diagnosedBy, status, description, managementPlan, alerts,
  } = await req.json()
  const [updated] = await db.update(participantHealthConditions)
    .set({
      ...(conditionName    !== undefined && { conditionName }),
      ...(conditionType    !== undefined && { conditionType }),
      ...(icdCode          !== undefined && { icdCode }),
      ...(severity         !== undefined && { severity }),
      ...(diagnosedDate    !== undefined && { diagnosedDate }),
      ...(diagnosedBy      !== undefined && { diagnosedBy }),
      ...(status           !== undefined && { status }),
      ...(description      !== undefined && { description }),
      ...(managementPlan   !== undefined && { managementPlan }),
      ...(alerts           !== undefined && { alerts }),
      updatedAt: new Date(),
    })
    .where(and(
      eq(participantHealthConditions.id, conditionId),
      eq(participantHealthConditions.tenantId, tenantId),
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ condition: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await apiGuard('medication_health:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { conditionId } = await params

  await db.delete(participantHealthConditions)
    .where(and(
      eq(participantHealthConditions.id, conditionId),
      eq(participantHealthConditions.tenantId, tenantId),
    ))

  return NextResponse.json({ success: true })
}
