/**
 * GET  /api/tenant/roster-shifts/templates/[templateId]/slots
 * POST /api/tenant/roster-shifts/templates/[templateId]/slots
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rosterTemplates, rosterTemplateSlots } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const guard = await apiGuard('roster_shifts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { templateId } = await params

  const slots = await db
    .select()
    .from(rosterTemplateSlots)
    .where(and(
      eq(rosterTemplateSlots.templateId, templateId),
      eq(rosterTemplateSlots.tenantId, tenantId),
    ))
    .orderBy(rosterTemplateSlots.dayOfWeek, rosterTemplateSlots.startTime)

  return NextResponse.json({ slots })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { templateId } = await params

  // Verify template belongs to tenant
  const [tpl] = await db.select({ id: rosterTemplates.id }).from(rosterTemplates)
    .where(and(eq(rosterTemplates.id, templateId), eq(rosterTemplates.tenantId, tenantId)))
  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const body = await req.json()
  const { dayOfWeek, startTime, endTime, shiftType, location, participantId, requiredStaff, notes } = body

  if (dayOfWeek === undefined || !startTime || !endTime)
    return NextResponse.json({ error: 'dayOfWeek, startTime, endTime are required' }, { status: 400 })

  const [created] = await db.insert(rosterTemplateSlots).values({
    tenantId,
    templateId,
    dayOfWeek:     Number(dayOfWeek),
    startTime,
    endTime,
    shiftType:     shiftType     || 'standard',
    location:      location      || null,
    participantId: participantId || null,
    requiredStaff: requiredStaff ?? 1,
    notes:         notes         || null,
  }).returning()

  return NextResponse.json({ slot: created }, { status: 201 })
}
