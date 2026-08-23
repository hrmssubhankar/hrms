import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { toilEntries } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { upsertBalance } from '../_helpers'

export const dynamic = 'force-dynamic'

// PATCH /api/tenant/toil/[id] — approve or reject a take request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('toil:write')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { status, rejectedReason } = body

  // Fetch entry first
  const [existing] = await db
    .select()
    .from(toilEntries)
    .where(and(eq(toilEntries.id, id), eq(toilEntries.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { status, updatedAt: new Date() }
  if (status === 'approved') {
    updates.approvedBy = session.email
    updates.approvedAt = new Date()
  }
  if (status === 'rejected') {
    updates.rejectedReason = rejectedReason
  }

  const [entry] = await db
    .update(toilEntries)
    .set(updates)
    .where(and(eq(toilEntries.id, id), eq(toilEntries.tenantId, session.tenantId)))
    .returning()

  // Update balance when approving a take request
  if (status === 'approved' && existing.entryType !== 'accrual') {
    await upsertBalance(session.tenantId, existing.employeeId, parseFloat(existing.hours), existing.entryType)
  }

  return NextResponse.json({ entry })
}

// DELETE /api/tenant/toil/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('toil:write')
  if (error) return error

  const { id } = await params

  const [deleted] = await db
    .delete(toilEntries)
    .where(and(eq(toilEntries.id, id), eq(toilEntries.tenantId, session.tenantId)))
    .returning()

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
