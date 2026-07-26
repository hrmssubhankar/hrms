import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headcountPlan, departments, positions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('workforce_planning:read')
    if (guard.error) return guard.error
    const { session } = guard

    const rows = await db
      .select({
        id:           headcountPlan.id,
        departmentId: headcountPlan.departmentId,
        positionId:   headcountPlan.positionId,
        plannedCount: headcountPlan.plannedCount,
        currentCount: headcountPlan.currentCount,
        vacancyCount: headcountPlan.vacancyCount,
        targetDate:   headcountPlan.targetDate,
        status:       headcountPlan.status,
        notes:        headcountPlan.notes,
        createdAt:    headcountPlan.createdAt,
        departmentName: departments.name,
        positionTitle:  positions.title,
      })
      .from(headcountPlan)
      .leftJoin(departments, eq(headcountPlan.departmentId, departments.id))
      .leftJoin(positions,   eq(headcountPlan.positionId,   positions.id))
      .where(eq(headcountPlan.tenantId, session.tenantId))
      .orderBy(desc(headcountPlan.createdAt))

    const stats = {
      totalPlanned:  rows.reduce((s, r) => s + r.plannedCount, 0),
      totalCurrent:  rows.reduce((s, r) => s + r.currentCount, 0),
      totalVacancies: rows.reduce((s, r) => s + r.vacancyCount, 0),
      openRoles:     rows.filter(r => r.status === 'open').length,
    }

    return NextResponse.json({ plans: rows, stats })
  } catch (err) {
    console.error('GET /api/tenant/workforce-planning', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('workforce_planning:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { departmentId, positionId, plannedCount, currentCount, vacancyCount, targetDate, notes } = await req.json()
    if (!plannedCount) return NextResponse.json({ error: 'plannedCount required' }, { status: 400 })
    const [record] = await db.insert(headcountPlan).values({
      tenantId: session.tenantId,
      departmentId: departmentId || null, positionId: positionId || null,
      plannedCount, currentCount: currentCount ?? 0, vacancyCount: vacancyCount ?? 0,
      targetDate: targetDate || null, notes: notes || null, status: 'open',
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/workforce-planning', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { id, status, plannedCount, currentCount, vacancyCount, targetDate, notes, departmentId, positionId } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updates: Record<string, unknown> = {}
    if (status       !== undefined) updates.status       = status
    if (plannedCount !== undefined) updates.plannedCount = plannedCount
    if (currentCount !== undefined) updates.currentCount = currentCount
    if (vacancyCount !== undefined) updates.vacancyCount = vacancyCount
    if (targetDate   !== undefined) updates.targetDate   = targetDate || null
    if (notes        !== undefined) updates.notes        = notes || null
    if (departmentId !== undefined) updates.departmentId = departmentId || null
    if (positionId   !== undefined) updates.positionId   = positionId || null
    const [updated] = await db.update(headcountPlan).set(updates)
      .where(and(eq(headcountPlan.id, id), eq(headcountPlan.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await apiGuard('workforce_planning:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.delete(headcountPlan)
      .where(and(eq(headcountPlan.id, id), eq(headcountPlan.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
