import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeBenefits, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('benefits:read')
    if (guard.error) return guard.error
    const { session } = guard
    const { searchParams } = req.nextUrl
    const employeeId = searchParams.get('employeeId')
    const conditions = [eq(employeeBenefits.tenantId, session.tenantId)]
    if (employeeId) conditions.push(eq(employeeBenefits.employeeId, employeeId))
    const rows = await db.select({
      id: employeeBenefits.id, employeeId: employeeBenefits.employeeId,
      type: employeeBenefits.type, description: employeeBenefits.description,
      startDate: employeeBenefits.startDate, endDate: employeeBenefits.endDate,
      notes: employeeBenefits.notes, createdAt: employeeBenefits.createdAt,
      employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
    }).from(employeeBenefits)
      .leftJoin(employees, eq(employeeBenefits.employeeId, employees.id))
      .where(and(...conditions)).orderBy(desc(employeeBenefits.createdAt))
    return NextResponse.json({ benefits: rows })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('benefits:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { employeeId, type, description, startDate, endDate, notes } = await req.json()
    if (!employeeId || !type) return NextResponse.json({ error: 'employeeId and type required' }, { status: 400 })
    const [record] = await db.insert(employeeBenefits).values({
      tenantId: session.tenantId, employeeId, type,
      description: description || null, startDate: startDate || null,
      endDate: endDate || null, notes: notes || null,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.delete(employeeBenefits)
      .where(and(eq(employeeBenefits.id, id), eq(employeeBenefits.tenantId, session.tenantId)))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
