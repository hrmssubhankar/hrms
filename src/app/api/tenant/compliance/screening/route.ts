import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { screeningRecords, employees } from '@/lib/db/schema'
import { eq, and, desc, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('compliance:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const checkType  = searchParams.get('checkType')
    const employeeId = searchParams.get('employeeId')
    const search     = searchParams.get('search') ?? ''

    const conditions = [eq(screeningRecords.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(screeningRecords.status, status as any))
    if (checkType)  conditions.push(eq(screeningRecords.checkType, checkType))
    if (employeeId) conditions.push(eq(screeningRecords.employeeId, employeeId))

    const records = await db
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
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
        employeeIsActive:  employees.isActive,
        employeeNdis:      employees.ndisWorker,
      })
      .from(screeningRecords)
      .leftJoin(employees, eq(screeningRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(screeningRecords.createdAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (r.referenceNumber ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : records

    // Stats
    const all = await db
      .select({ status: screeningRecords.status })
      .from(screeningRecords)
      .where(eq(screeningRecords.tenantId, session.tenantId))

    // Expiry alerts — check dates on JS side since we don't have sql helpers here
    const today    = new Date()
    const in30days = new Date(today.getTime() + 30 * 86400000)
    const expiring = records.filter(r => {
      if (!r.expiryDate) return false
      const d = new Date(r.expiryDate)
      return d > today && d <= in30days
    }).length
    const expired = records.filter(r => r.expiryDate && new Date(r.expiryDate) < today && r.status !== 'pending').length

    const stats = {
      total:    all.length,
      green:    all.filter(r => r.status === 'green').length,
      amber:    all.filter(r => r.status === 'amber').length,
      red:      all.filter(r => r.status === 'red').length,
      pending:  all.filter(r => r.status === 'pending').length,
      expiring,
      expired,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/compliance/screening', err)
    return NextResponse.json({ error: 'Failed to fetch screening records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('compliance:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, checkType, referenceNumber, issuedDate, expiryDate, notes } = body

    if (!employeeId || !checkType) {
      return NextResponse.json({ error: 'employeeId and checkType are required' }, { status: 400 })
    }

    const [record] = await db.insert(screeningRecords).values({
      tenantId:        session.tenantId,
      employeeId,
      checkType,
      status:          'pending',
      referenceNumber: referenceNumber || null,
      issuedDate:      issuedDate  ? issuedDate  : null,
      expiryDate:      expiryDate  ? expiryDate  : null,
      notes:           notes       || null,
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/compliance/screening', err)
    return NextResponse.json({ error: 'Failed to create screening record' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('compliance:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, referenceNumber, issuedDate, expiryDate, notes } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (status          !== undefined) updates.status          = status
    if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber
    if (issuedDate      !== undefined) updates.issuedDate      = issuedDate || null
    if (expiryDate      !== undefined) updates.expiryDate      = expiryDate || null
    if (notes           !== undefined) updates.notes           = notes
    if (status === 'green') { updates.verifiedAt = new Date(); updates.verifiedBy = session.sub }

    const [updated] = await db
      .update(screeningRecords)
      .set(updates)
      .where(and(eq(screeningRecords.id, id), eq(screeningRecords.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/compliance/screening', err)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}
