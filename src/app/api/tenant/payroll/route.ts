import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRecords, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')

    const conditions = [eq(payrollRecords.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(payrollRecords.status, status))
    if (employeeId) conditions.push(eq(payrollRecords.employeeId, employeeId))

    const rows = await db.select({
      id: payrollRecords.id, employeeId: payrollRecords.employeeId,
      periodStart: payrollRecords.periodStart, periodEnd: payrollRecords.periodEnd,
      grossPay: payrollRecords.grossPay, netPay: payrollRecords.netPay,
      status: payrollRecords.status,
      exportedToXero: payrollRecords.exportedToXero, exportedAt: payrollRecords.exportedAt,
      createdAt: payrollRecords.createdAt,
      employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
      employeeEntityName: employees.entityName,
    }).from(payrollRecords)
      .leftJoin(employees, eq(payrollRecords.employeeId, employees.id))
      .where(and(...conditions)).orderBy(desc(payrollRecords.createdAt))

    const stats = {
      total:      rows.length,
      pending:    rows.filter(r => r.status === 'pending').length,
      approved:   rows.filter(r => r.status === 'approved').length,
      paid:       rows.filter(r => r.status === 'paid').length,
      xeroExported: rows.filter(r => r.exportedToXero).length,
      totalGross: rows.reduce((s, r) => s + Number(r.grossPay ?? 0), 0).toFixed(2),
    }

    return NextResponse.json({ records: rows, stats })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { employeeId, periodStart, periodEnd, grossPay, netPay } = await req.json()
    if (!employeeId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'employeeId, periodStart, periodEnd required' }, { status: 400 })
    }
    const [record] = await db.insert(payrollRecords).values({
      tenantId: session.tenantId, employeeId, periodStart, periodEnd,
      grossPay: grossPay || null, netPay: netPay || null, status: 'pending',
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, status, exportedToXero } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updates: Record<string, unknown> = {}
    if (status        !== undefined) updates.status        = status
    if (exportedToXero !== undefined) {
      updates.exportedToXero = exportedToXero
      if (exportedToXero) updates.exportedAt = new Date()
    }
    const [updated] = await db.update(payrollRecords).set(updates)
      .where(and(eq(payrollRecords.id, id), eq(payrollRecords.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
