import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { grievances } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('grievances:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(grievances)
    .where(and(eq(grievances.id, id), eq(grievances.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
