import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await apiGuard('assets:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { id } = await params
    const body = await req.json()
    const { name, category, serialNumber, notes, status } = body
    if (!name || !category) return NextResponse.json({ error: 'name and category required' }, { status: 400 })
    const [updated] = await db.update(assets)
      .set({ name, category, serialNumber: serialNumber || null, notes: notes || null, status: status || 'available' })
      .where(and(eq(assets.id, id), eq(assets.tenantId, session.tenantId)))
      .returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await apiGuard('assets:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { id } = await params
    const [deleted] = await db.delete(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, session.tenantId)))
      .returning()
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
