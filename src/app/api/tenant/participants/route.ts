/**
 * GET  /api/tenant/participants  — list participants
 * POST /api/tenant/participants  — create participant
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/lib/db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('participant_mgmt:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const search     = req.nextUrl.searchParams.get('search')     ?? ''
  const activeOnly = req.nextUrl.searchParams.get('active')     !== 'false'
  const fundingBody = req.nextUrl.searchParams.get('fundingBody') ?? ''

  const conditions: ReturnType<typeof eq>[] = [eq(participants.tenantId, tenantId)]
  if (activeOnly)  conditions.push(eq(participants.isActive, true))
  if (fundingBody) conditions.push(eq(participants.fundingBody, fundingBody))

  let rows = await db
    .select()
    .from(participants)
    .where(
      and(
        ...conditions,
        search
          ? or(
              ilike(participants.firstName,  `%${search}%`),
              ilike(participants.lastName,   `%${search}%`),
              ilike(participants.ndisNumber, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(participants.firstName, participants.lastName)

  return NextResponse.json({ participants: rows })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('participant_mgmt:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()
  const {
    firstName, lastName, preferredName, ndisNumber, dateOfBirth,
    address, phone, email: participantEmail, supportLevel, fundingBody,
    planStartDate, planEndDate, notes,
  } = body

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
  }

  const [row] = await db.insert(participants).values({
    tenantId,
    firstName,
    lastName,
    preferredName:  preferredName  || null,
    ndisNumber:     ndisNumber     || null,
    dateOfBirth:    dateOfBirth    || null,
    address:        address        || null,
    phone:          phone          || null,
    email:          participantEmail || null,
    supportLevel:   supportLevel   || null,
    fundingBody:    fundingBody    || 'NDIS',
    planStartDate:  planStartDate  || null,
    planEndDate:    planEndDate    || null,
    notes:          notes          || null,
  }).returning()

  return NextResponse.json({ participant: row }, { status: 201 })
}
