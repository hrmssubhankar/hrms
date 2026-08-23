import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { surveys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await apiGuard('engagement:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { title, type, isAnonymous } = await req.json()
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const [updated] = await db.update(surveys).set({
      title, type: type || null, isAnonymous: isAnonymous ?? true,
    }).where(and(eq(surveys.id, params.id), eq(surveys.tenantId, session.tenantId))).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await apiGuard('engagement:write')
    if (guard.error) return guard.error
    const { session } = guard
    await db.delete(surveys).where(and(eq(surveys.id, params.id), eq(surveys.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
