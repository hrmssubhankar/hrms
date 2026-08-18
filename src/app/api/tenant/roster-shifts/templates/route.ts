/**
 * GET  /api/tenant/roster-shifts/templates
 * POST /api/tenant/roster-shifts/templates
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rosterTemplates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('roster_shifts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const templates = await db
    .select()
    .from(rosterTemplates)
    .where(eq(rosterTemplates.tenantId, tenantId))
    .orderBy(desc(rosterTemplates.createdAt))

  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const [created] = await db.insert(rosterTemplates).values({
    tenantId,
    name,
    description: description || null,
    status:      'active',
    createdBy:   email,
  }).returning()

  return NextResponse.json({ template: created }, { status: 201 })
}
