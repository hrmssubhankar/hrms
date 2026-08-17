/**
 * GET /api/tenant/incident-behaviour/participants
 * Returns active participants for this tenant (participant picker)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/lib/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('incident_behaviour:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const search = req.nextUrl.searchParams.get('search') || ''

  const rows = await db
    .select({
      id:            participants.id,
      firstName:     participants.firstName,
      lastName:      participants.lastName,
      preferredName: participants.preferredName,
      ndisNumber:    participants.ndisNumber,
      isActive:      participants.isActive,
    })
    .from(participants)
    .where(and(
      eq(participants.tenantId, tenantId),
      eq(participants.isActive, true),
      search
        ? or(
            ilike(participants.firstName, `%${search}%`),
            ilike(participants.lastName,  `%${search}%`),
          )
        : undefined,
    ))

  return NextResponse.json({ participants: rows })
}
