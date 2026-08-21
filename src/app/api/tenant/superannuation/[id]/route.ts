import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { superFunds } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// PATCH /api/tenant/superannuation/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const { id } = await params
  const body = await req.json()

  const [fund] = await db
    .update(superFunds)
    .set({ ...body, updatedAt: new Date() })
    .where(and(
      eq(superFunds.id, id),
      eq(superFunds.tenantId, session.tenantId),
    ))
    .returning()

  if (!fund) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ fund })
}

// DELETE /api/tenant/superannuation/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const { id } = await params

  const [fund] = await db
    .delete(superFunds)
    .where(and(
      eq(superFunds.id, id),
      eq(superFunds.tenantId, session.tenantId),
    ))
    .returning()

  if (!fund) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
