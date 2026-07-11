import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { complianceTracking, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status   = searchParams.get('status')
    const search   = searchParams.get('search') ?? ''

    const conditions = [eq(complianceTracking.tenantId, session.tenantId)]
    if (status) conditions.push(eq(complianceTracking.status, status as any))

    const records = await db
      .select({
        id:            complianceTracking.id,
        employeeId:    complianceTracking.employeeId,
        itemType:      complianceTracking.itemType,
        status:        complianceTracking.status,
        dueDate:       complianceTracking.dueDate,
        lastCheckedAt: complianceTracking.lastCheckedAt,
        escalatedAt:   complianceTracking.escalatedAt,
        notes:         complianceTracking.notes,
        updatedAt:     complianceTracking.updatedAt,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
        employeeIsActive:  employees.isActive,
      })
      .from(complianceTracking)
      .leftJoin(employees, eq(complianceTracking.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(complianceTracking.updatedAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase())
        )
      : records

    const all = await db
      .select({ status: complianceTracking.status })
      .from(complianceTracking)
      .where(eq(complianceTracking.tenantId, session.tenantId))

    const stats = {
      total:   all.length,
      green:   all.filter(r => r.status === 'green').length,
      amber:   all.filter(r => r.status === 'amber').length,
      red:     all.filter(r => r.status === 'red').length,
      pending: all.filter(r => r.status === 'pending').length,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/compliance/tracking', err)
    return NextResponse.json({ error: 'Failed to fetch compliance tracking' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { employeeId, itemType, dueDate, notes } = body

    if (!employeeId || !itemType) {
      return NextResponse.json({ error: 'employeeId and itemType are required' }, { status: 400 })
    }

    const [record] = await db.insert(complianceTracking).values({
      tenantId:   session.tenantId,
      employeeId,
      itemType,
      status:     'pending',
      dueDate:    dueDate || null,
      notes:      notes   || null,
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/compliance/tracking', err)
    return NextResponse.json({ error: 'Failed to create tracking record' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, status, dueDate, notes } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = { updatedAt: new Date(), lastCheckedAt: new Date() }
    if (status  !== undefined) updates.status  = status
    if (dueDate !== undefined) updates.dueDate = dueDate || null
    if (notes   !== undefined) updates.notes   = notes

    const [updated] = await db
      .update(complianceTracking)
      .set(updates)
      .where(and(eq(complianceTracking.id, id), eq(complianceTracking.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/compliance/tracking', err)
    return NextResponse.json({ error: 'Failed to update tracking record' }, { status: 500 })
  }
}
