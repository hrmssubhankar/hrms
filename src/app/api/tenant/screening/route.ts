import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { screeningRecords, employees } from '@/lib/db/schema'
import { eq, and, desc, or, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('compliance:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const checkType = searchParams.get('checkType')
  const search    = searchParams.get('search')

  const conditions = [eq(screeningRecords.tenantId, session.tenantId)]
  if (status)    conditions.push(eq(screeningRecords.status, status as any))
  if (checkType) conditions.push(eq(screeningRecords.checkType, checkType))

  const rows = await db
    .select({
      id:              screeningRecords.id,
      employeeId:      screeningRecords.employeeId,
      checkType:       screeningRecords.checkType,
      status:          screeningRecords.status,
      referenceNumber: screeningRecords.referenceNumber,
      issuedDate:      screeningRecords.issuedDate,
      expiryDate:      screeningRecords.expiryDate,
      notes:           screeningRecords.notes,
      verifiedAt:      screeningRecords.verifiedAt,
      createdAt:       screeningRecords.createdAt,
      updatedAt:       screeningRecords.updatedAt,
      firstName:       employees.firstName,
      lastName:        employees.lastName,
      email:           employees.email,
    })
    .from(screeningRecords)
    .leftJoin(employees, eq(employees.id, screeningRecords.employeeId))
    .where(and(...conditions))
    .orderBy(desc(screeningRecords.createdAt))

  const filtered = search
    ? rows.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.referenceNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  const today = new Date()
  const in30  = new Date(today); in30.setDate(in30.getDate() + 30)

  const stats = {
    total:    rows.length,
    green:    rows.filter(r => r.status === 'green').length,
    amber:    rows.filter(r => r.status === 'amber').length,
    red:      rows.filter(r => r.status === 'red').length,
    pending:  rows.filter(r => r.status === 'pending').length,
    expiringSoon: rows.filter(r =>
      r.expiryDate && new Date(r.expiryDate) <= in30 && new Date(r.expiryDate) >= today
    ).length,
  }

  return NextResponse.json({ records: filtered, stats })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('compliance:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { employeeId, checkType, referenceNumber, issuedDate, expiryDate, notes } = body

  if (!employeeId || !checkType) {
    return NextResponse.json({ error: 'employeeId and checkType are required' }, { status: 400 })
  }

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, session.tenantId)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const [record] = await db.insert(screeningRecords).values({
    tenantId:        session.tenantId,
    employeeId,
    checkType,
    referenceNumber: referenceNumber ?? null,
    issuedDate:      issuedDate ?? null,
    expiryDate:      expiryDate ?? null,
    notes:           notes ?? null,
    status:          'pending',
  }).returning()

  return NextResponse.json({ record }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('compliance:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { id, status, referenceNumber, issuedDate, expiryDate, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined)          updates.status          = status
  if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber
  if (issuedDate !== undefined)      updates.issuedDate      = issuedDate
  if (expiryDate !== undefined)      updates.expiryDate      = expiryDate
  if (notes !== undefined)           updates.notes           = notes
  if (status === 'green')            updates.verifiedAt      = new Date()

  const [updated] = await db
    .update(screeningRecords)
    .set(updates)
    .where(and(eq(screeningRecords.id, id), eq(screeningRecords.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ record: updated })
}

export async function DELETE(req: NextRequest) {
  const guard = await apiGuard('compliance:write')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db.delete(screeningRecords)
    .where(and(eq(screeningRecords.id, id), eq(screeningRecords.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
