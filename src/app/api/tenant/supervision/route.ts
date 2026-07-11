import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { supervisionRecords, employees } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('supervision:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')
    const type       = searchParams.get('type')

    const conditions = [eq(supervisionRecords.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(supervisionRecords.status, status))
    if (employeeId) conditions.push(eq(supervisionRecords.employeeId, employeeId))
    if (type)       conditions.push(eq(supervisionRecords.type, type))

    const supervisorEmp = employees

    const records = await db
      .select({
        id:            supervisionRecords.id,
        employeeId:    supervisionRecords.employeeId,
        supervisorId:  supervisionRecords.supervisorId,
        scheduledDate: supervisionRecords.scheduledDate,
        conductedAt:   supervisionRecords.conductedAt,
        type:          supervisionRecords.type,
        status:        supervisionRecords.status,
        notes:         supervisionRecords.notes,
        actionItems:   supervisionRecords.actionItems,
        createdAt:     supervisionRecords.createdAt,
        employeeFirstName:    employees.firstName,
        employeeLastName:     employees.lastName,
        employeeEmail:        employees.email,
      })
      .from(supervisionRecords)
      .leftJoin(employees, eq(supervisionRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(supervisionRecords.scheduledDate))

    const all = await db
      .select({ status: supervisionRecords.status, scheduledDate: supervisionRecords.scheduledDate })
      .from(supervisionRecords)
      .where(eq(supervisionRecords.tenantId, session.tenantId))

    const today = new Date().toISOString().split('T')[0]
    const stats = {
      total:     all.length,
      scheduled: all.filter(r => r.status === 'scheduled').length,
      completed: all.filter(r => r.status === 'completed').length,
      overdue:   all.filter(r => r.status === 'scheduled' && r.scheduledDate < today).length,
    }

    return NextResponse.json({ records, stats })
  } catch (err) {
    console.error('GET /api/tenant/supervision', err)
    return NextResponse.json({ error: 'Failed to fetch supervision records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('supervision:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, supervisorId, scheduledDate, type, notes } = body
    if (!employeeId || !supervisorId || !scheduledDate) {
      return NextResponse.json({ error: 'employeeId, supervisorId, scheduledDate required' }, { status: 400 })
    }

    const [record] = await db.insert(supervisionRecords).values({
      tenantId:      session.tenantId,
      employeeId,
      supervisorId,
      scheduledDate,
      type:          type  || 'regular',
      notes:         notes || null,
      status:        'scheduled',
      actionItems:   [],
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/supervision', err)
    return NextResponse.json({ error: 'Failed to schedule supervision' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('supervision:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, notes, conductedAt, actionItems } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status      !== undefined) updates.status      = status
    if (notes       !== undefined) updates.notes       = notes
    if (actionItems !== undefined) updates.actionItems = actionItems
    if (conductedAt !== undefined) updates.conductedAt = conductedAt ? new Date(conductedAt) : null
    if (status === 'completed' && !conductedAt) updates.conductedAt = new Date()

    const [updated] = await db
      .update(supervisionRecords).set(updates)
      .where(and(eq(supervisionRecords.id, id), eq(supervisionRecords.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/supervision', err)
    return NextResponse.json({ error: 'Failed to update supervision record' }, { status: 500 })
  }
}
