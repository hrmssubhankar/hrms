import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { diversityData } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await apiGuard('dei:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { gender, indigenousStatus, disabilityStatus, culturalBackground, adjustmentsRequired } = await req.json()
    const [updated] = await db.update(diversityData).set({
      gender: gender || null,
      indigenousStatus: indigenousStatus ?? null,
      disabilityStatus: disabilityStatus ?? null,
      culturalBackground: culturalBackground || null,
      adjustmentsRequired: adjustmentsRequired || null,
    }).where(and(eq(diversityData.id, params.id), eq(diversityData.tenantId, session.tenantId))).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await apiGuard('dei:write')
    if (guard.error) return guard.error
    const { session } = guard
    await db.delete(diversityData).where(and(eq(diversityData.id, params.id), eq(diversityData.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
