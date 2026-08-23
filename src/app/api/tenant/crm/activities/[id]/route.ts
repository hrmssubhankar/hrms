import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmActivities } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  await db.delete(crmActivities)
    .where(and(eq(crmActivities.id, id), eq(crmActivities.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
