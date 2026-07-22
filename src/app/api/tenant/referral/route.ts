import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrals, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('referrals:read')
  if (guard.error) return guard.error
  const { session } = guard

  const rows = await db
    .select({
      id:                 referrals.id,
      referrerId:         referrals.referrerId,
      referredEmployeeId: referrals.referredEmployeeId,
      referredName:       referrals.referredName,
      referredEmail:      referrals.referredEmail,
      status:             referrals.status,
      bonusAmount:        referrals.bonusAmount,
      bonusPaidAt:        referrals.bonusPaidAt,
      notes:              referrals.notes,
      createdAt:          referrals.createdAt,
      referrerFirstName:  employees.firstName,
      referrerLastName:   employees.lastName,
    })
    .from(referrals)
    .leftJoin(employees, eq(employees.id, referrals.referrerId))
    .where(eq(referrals.tenantId, session.tenantId))
    .orderBy(desc(referrals.createdAt))

  const stats = {
    total:    rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    hired:    rows.filter(r => r.status === 'hired').length,
    paid:     rows.filter(r => r.bonusPaidAt !== null).length,
  }

  return NextResponse.json({ referrals: rows, stats })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('referrals:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { referrerId, referredName, referredEmail, notes } = body
  if (!referrerId || !referredName) {
    return NextResponse.json({ error: 'referrerId and referredName required' }, { status: 400 })
  }

  const [emp] = await db.select({ id: employees.id }).from(employees)
    .where(and(eq(employees.id, referrerId), eq(employees.tenantId, session.tenantId)))
  if (!emp) return NextResponse.json({ error: 'Referrer not found' }, { status: 404 })

  const [referral] = await db.insert(referrals).values({
    tenantId:     session.tenantId,
    referrerId,
    referredName,
    referredEmail: referredEmail ?? null,
    notes:         notes ?? null,
    status:        'pending',
  }).returning()

  return NextResponse.json({ referral }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('referrals:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { id, status, bonusAmount, bonusPaidAt, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status      !== undefined) updates.status      = status
  if (bonusAmount !== undefined) updates.bonusAmount = bonusAmount
  if (bonusPaidAt !== undefined) updates.bonusPaidAt = bonusPaidAt ? new Date(bonusPaidAt) : null
  if (notes       !== undefined) updates.notes       = notes

  const [updated] = await db
    .update(referrals).set(updates)
    .where(and(eq(referrals.id, id), eq(referrals.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ referral: updated })
}
