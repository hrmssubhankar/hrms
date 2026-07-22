/**
 * GET  /api/tenant/participants   — list NDIS participants
 * POST /api/tenant/participants   — create participant
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/lib/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('rostering:read')
  if (guard.error) return guard.error
  const { session } = guard

  const search   = req.nextUrl.searchParams.get('search') ?? ''
  const activeOnly = req.nextUrl.searchParams.get('active') !== 'false'

  try {
    const rows = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.tenantId, session.tenantId),
          activeOnly ? eq(participants.isActive, true) : undefined,
          search
            ? or(
                ilike(participants.firstName, `%${search}%`),
                ilike(participants.lastName,  `%${search}%`),
                ilike(participants.ndisNumber, `%${search}%`),
              )
            : undefined,
        )
      )
      .orderBy(participants.firstName)

    return NextResponse.json({ participants: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('rostering:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { firstName, lastName, preferredName, ndisNumber, dateOfBirth,
            address, phone, email, supportLevel, fundingBody,
            planStartDate, planEndDate, notes } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    const [row] = await db.insert(participants).values({
      tenantId:      session.tenantId,
      firstName,
      lastName,
      preferredName: preferredName || null,
      ndisNumber:    ndisNumber    || null,
      dateOfBirth:   dateOfBirth   || null,
      address:       address       || null,
      phone:         phone         || null,
      email:         email         || null,
      supportLevel:  supportLevel  || null,
      fundingBody:   fundingBody   || 'NDIS',
      planStartDate: planStartDate || null,
      planEndDate:   planEndDate   || null,
      notes:         notes         || null,
    }).returning()

    return NextResponse.json({ participant: row }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
