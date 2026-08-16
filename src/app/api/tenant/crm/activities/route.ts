import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmActivities } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const relatedId   = searchParams.get('relatedId')
  const relatedType = searchParams.get('relatedType')
  const isDone      = searchParams.get('isDone')

  const conditions = [eq(crmActivities.tenantId, session.tenantId)]
  if (relatedId)   conditions.push(eq(crmActivities.relatedId, relatedId))
  if (relatedType) conditions.push(eq(crmActivities.relatedType, relatedType))
  if (isDone !== null && isDone !== undefined) conditions.push(eq(crmActivities.isDone, isDone === 'true'))

  const activities = await db.select().from(crmActivities)
    .where(and(...conditions))
    .orderBy(desc(crmActivities.createdAt))

  return NextResponse.json({ activities })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { type, subject, notes, dueDate, relatedType, relatedId, assignedTo } = body

  if (!type || !subject) return NextResponse.json({ error: 'type and subject required' }, { status: 400 })

  const [activity] = await db.insert(crmActivities).values({
    tenantId:    session.tenantId,
    type,
    subject,
    notes:       notes       ?? null,
    dueDate:     dueDate     ? new Date(dueDate) : null,
    relatedType: relatedType ?? null,
    relatedId:   relatedId   ?? null,
    assignedTo:  assignedTo  ?? session.email,
    createdBy:   session.email,
  }).returning()

  return NextResponse.json({ activity }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { id, isDone, notes, dueDate } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (isDone !== undefined) {
    updates.isDone = isDone
    if (isDone) updates.completedAt = new Date()
  }
  if (notes    !== undefined) updates.notes   = notes
  if (dueDate  !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null

  const [activity] = await db.update(crmActivities)
    .set(updates)
    .where(and(eq(crmActivities.id, id), eq(crmActivities.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ activity })
}
