import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const guard = await apiGuard('referrals:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { referredName, referredEmail, bonusAmount, notes, status } = await req.json()
    if (!referredName) return NextResponse.json({ error: 'referredName required' }, { status: 400 })
    const [updated] = await db.update(referrals).set({
      referredName, referredEmail: referredEmail || null,
      bonusAmount: bonusAmount || null, notes: notes || null,
      ...(status ? { status } : {}),
    }).where(and(eq(referrals.id, id), eq(referrals.tenantId, session.tenantId))).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const guard = await apiGuard('referrals:write')
    if (guard.error) return guard.error
    const { session } = guard
    await db.delete(referrals).where(and(eq(referrals.id, id), eq(referrals.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
