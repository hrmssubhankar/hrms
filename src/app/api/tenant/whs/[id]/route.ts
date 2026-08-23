import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { whsIncidents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('whs:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(whsIncidents)
    .where(and(eq(whsIncidents.id, id), eq(whsIncidents.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
