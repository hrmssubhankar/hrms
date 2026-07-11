import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assets, assetAssignments, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('assets:read')
    if (guard.error) return guard.error
    const { session } = guard
    const { searchParams } = req.nextUrl
    const category   = searchParams.get('category')
    const assetStatus = searchParams.get('status')

    const conditions = [eq(assets.tenantId, session.tenantId)]
    if (category)    conditions.push(eq(assets.category, category))
    if (assetStatus) conditions.push(eq(assets.status, assetStatus))

    const assetList = await db.select().from(assets).where(and(...conditions)).orderBy(assets.category, assets.name)

    // Active assignments
    const assignments = await db.select({
      id: assetAssignments.id, assetId: assetAssignments.assetId,
      employeeId: assetAssignments.employeeId, issuedAt: assetAssignments.issuedAt,
      returnedAt: assetAssignments.returnedAt, condition: assetAssignments.condition,
      notes: assetAssignments.notes,
      employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
    }).from(assetAssignments)
      .leftJoin(employees, eq(assetAssignments.employeeId, employees.id))
      .where(eq(assetAssignments.tenantId, session.tenantId))
      .orderBy(desc(assetAssignments.issuedAt))

    const stats = {
      total:     assetList.length,
      available: assetList.filter(a => a.status === 'available').length,
      assigned:  assetList.filter(a => a.status === 'assigned').length,
      retired:   assetList.filter(a => a.status === 'retired').length,
    }

    return NextResponse.json({ assets: assetList, assignments, stats })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('assets:write')
    if (guard.error) return guard.error
    const { session } = guard
    const body = await req.json()

    if (body._type === 'assignment') {
      const { assetId, employeeId, condition, notes } = body
      if (!assetId || !employeeId) return NextResponse.json({ error: 'assetId and employeeId required' }, { status: 400 })
      await db.update(assets).set({ status: 'assigned' })
        .where(and(eq(assets.id, assetId), eq(assets.tenantId, session.tenantId)))
      const [record] = await db.insert(assetAssignments).values({
        tenantId: session.tenantId, assetId, employeeId,
        issuedBy: session.sub ?? null, condition: condition || null, notes: notes || null,
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    const { name, category, serialNumber, notes } = body
    if (!name || !category) return NextResponse.json({ error: 'name and category required' }, { status: 400 })
    const [record] = await db.insert(assets).values({
      tenantId: session.tenantId, name, category,
      serialNumber: serialNumber || null, notes: notes || null, status: 'available',
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('assets:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { id, _type = 'asset', status, returnedAt, condition } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    if (_type === 'return') {
      // Return asset
      const [assignment] = await db.select().from(assetAssignments)
        .where(and(eq(assetAssignments.id, id), eq(assetAssignments.tenantId, session.tenantId)))
      if (assignment) {
        await db.update(assetAssignments).set({ returnedAt: new Date(), condition: condition || assignment.condition })
          .where(eq(assetAssignments.id, id))
        await db.update(assets).set({ status: 'available' })
          .where(eq(assets.id, assignment.assetId))
      }
      return NextResponse.json({ ok: true })
    }

    const [updated] = await db.update(assets).set({ status })
      .where(and(eq(assets.id, id), eq(assets.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
