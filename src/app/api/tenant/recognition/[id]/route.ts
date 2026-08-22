import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recognitions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await apiGuard('recognition:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { recipientId, nominatedBy, type, reason, period, isPublic } = await req.json()
    if (!recipientId || !type) return NextResponse.json({ error: 'recipientId and type required' }, { status: 400 })
    const [record] = await db.update(recognitions)
      .set({ recipientId, nominatedBy: nominatedBy || null, type, reason: reason || null, period: period || null, isPublic: isPublic ?? true })
      .where(and(eq(recognitions.id, params.id), eq(recognitions.tenantId, session.tenantId)))
      .returning()
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await apiGuard('recognition:write')
    if (guard.error) return guard.error
    const { session } = guard
    const [record] = await db.delete(recognitions)
      .where(and(eq(recognitions.id, params.id), eq(recognitions.tenantId, session.tenantId)))
      .returning()
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
