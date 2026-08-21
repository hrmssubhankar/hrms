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

  const body = await req.json()
  const [updated] = await db.update(participantHealthConditions)
    .set({ ...body, updatedAt: new Date() })
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
