import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { separationRecords, separationEvents, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET /api/tenant/separation/[id]  — detail + event history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('separation:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [record] = await db
    .select({
      id:                  separationRecords.id,
      employeeId:          separationRecords.employeeId,
      type:                separationRecords.type,
      reason:              separationRecords.reason,
      noticeDate:          separationRecords.noticeDate,
      lastWorkingDay:      separationRecords.lastWorkingDay,
      exitInterviewAt:     separationRecords.exitInterviewAt,
      exitInterviewNotes:  separationRecords.exitInterviewNotes,
      checklistComplete:   separationRecords.checklistComplete,
      assetsReturned:      separationRecords.assetsReturned,
      systemAccessRevoked: separationRecords.systemAccessRevoked,
      status:              separationRecords.status,
      createdAt:           separationRecords.createdAt,
      employeeFirstName:   employees.firstName,
      employeeLastName:    employees.lastName,
      employeeEmail:       employees.email,
    })
    .from(separationRecords)
    .leftJoin(employees, eq(employees.id, separationRecords.employeeId))
    .where(and(eq(separationRecords.id, id), eq(separationRecords.tenantId, session.tenantId)))

  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const events = await db
    .select()
    .from(separationEvents)
    .where(eq(separationEvents.separationId, id))
    .orderBy(desc(separationEvents.createdAt))

  return NextResponse.json({ record, events })
}

// PATCH /api/tenant/separation/[id]  — update status, checklist, add notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard('separation:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await params

  const [existing] = await db
    .select({ id: separationRecords.id, status: separationRecords.status })
    .from(separationRecords)
    .where(and(eq(separationRecords.id, id), eq(separationRecords.tenantId, session.tenantId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  let eventType = 'updated'
  let eventNote = body._note ?? 'Record updated'

  const fields = [
    'reason','noticeDate','lastWorkingDay','exitInterviewAt',
    'exitInterviewNotes','checklistComplete','assetsReturned','systemAccessRevoked',
  ] as const
  for (const f of fields) {
    if (f in body) updates[f] = body[f] ?? null
  }

  if (body.status && body.status !== existing.status) {
    updates.status = body.status
    switch (body.status) {
      case 'active':    eventType = 'notice_received';      eventNote = 'Notice period commenced'; break
      case 'completed': eventType = 'completed';            eventNote = 'Separation process completed'; break
    }
  }

  if (body.checklistComplete === true) { eventType = 'checklist_completed'; eventNote = 'Exit checklist marked complete' }
  if (body.assetsReturned    === true) { eventType = 'assets_returned';     eventNote = 'Assets returned by employee' }
  if (body.systemAccessRevoked === true) { eventType = 'access_revoked';    eventNote = 'System access revoked' }
  if (body.exitInterviewAt)            { eventType = 'exit_interview_scheduled'; eventNote = `Exit interview scheduled for ${body.exitInterviewAt}` }

  if (Object.keys(updates).length) {
    await db
      .update(separationRecords)
      .set(updates)
      .where(and(eq(separationRecords.id, id), eq(separationRecords.tenantId, session.tenantId)))
  }

  // Always log an event
  await db.insert(separationEvents).values({
    tenantId:     session.tenantId,
    separationId: id,
    event:        eventType,
    note:         eventNote,
    performedBy:  session.email,
  })

  const [updated] = await db
    .select()
    .from(separationRecords)
    .where(eq(separationRecords.id, id))

  return NextResponse.json({ record: updated })
}
