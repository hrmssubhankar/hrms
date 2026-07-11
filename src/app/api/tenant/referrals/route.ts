import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrals, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('referrals:read')
    if (guard.error) return guard.error
    const { session } = guard
    const rows = await db.select({
      id: referrals.id, referrerId: referrals.referrerId,
      referredName: referrals.referredName, referredEmail: referrals.referredEmail,
      status: referrals.status, bonusAmount: referrals.bonusAmount,
      bonusPaidAt: referrals.bonusPaidAt, notes: referrals.notes, createdAt: referrals.createdAt,
      referrerFirstName: employees.firstName, referrerLastName: employees.lastName,
    }).from(referrals)
      .leftJoin(employees, eq(referrals.referrerId, employees.id))
      .where(eq(referrals.tenantId, session.tenantId))
      .orderBy(desc(referrals.createdAt))
    const stats = {
      total: rows.length,
      pending: rows.filter(r => r.status === 'pending').length,
      hired:   rows.filter(r => r.status === 'hired').length,
      bonusPaid: rows.filter(r => r.bonusPaidAt !== null).length,
    }
    return NextResponse.json({ referrals: rows, stats })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('referrals:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { referrerId, referredName, referredEmail, bonusAmount, notes } = await req.json()
    if (!referrerId || !referredName) return NextResponse.json({ error: 'referrerId and referredName required' }, { status: 400 })
    const [record] = await db.insert(referrals).values({
      tenantId: session.tenantId, referrerId, referredName,
      referredEmail: referredEmail || null, bonusAmount: bonusAmount || null,
      notes: notes || null, status: 'pending',
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, status, bonusPaidAt } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updates: Record<string, unknown> = {}
    if (status     !== undefined) updates.status     = status
    if (bonusPaidAt !== undefined) updates.bonusPaidAt = bonusPaidAt ? new Date(bonusPaidAt) : null
    const [updated] = await db.update(referrals).set(updates)
      .where(and(eq(referrals.id, id), eq(referrals.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
