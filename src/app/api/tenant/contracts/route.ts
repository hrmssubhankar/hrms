import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contracts, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('contracts:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')

    const conditions = [eq(contracts.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(contracts.status, status))
    if (employeeId) conditions.push(eq(contracts.employeeId, employeeId))

    const rows = await db
      .select({
        id:             contracts.id,
        employeeId:     contracts.employeeId,
        type:           contracts.type,
        status:         contracts.status,
        pdfUrl:         contracts.pdfUrl,
        signedPdfUrl:   contracts.signedPdfUrl,
        sentAt:         contracts.sentAt,
        signedAt:       contracts.signedAt,
        tfnProvided:    contracts.tfnProvided,
        superFund:      contracts.superFund,
        createdAt:      contracts.createdAt,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
        employeeEntityName: employees.entityName,
      })
      .from(contracts)
      .leftJoin(employees, eq(contracts.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(contracts.createdAt))

    const all = await db.select({ status: contracts.status })
      .from(contracts).where(eq(contracts.tenantId, session.tenantId))

    const stats = {
      total:  all.length,
      draft:  all.filter(c => c.status === 'draft').length,
      sent:   all.filter(c => c.status === 'sent').length,
      signed: all.filter(c => c.status === 'signed').length,
    }

    return NextResponse.json({ contracts: rows, stats })
  } catch (err) {
    console.error('GET /api/tenant/contracts', err)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('contracts:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, type, pdfUrl, superFund, tfnProvided } = body
    if (!employeeId || !type) return NextResponse.json({ error: 'employeeId and type required' }, { status: 400 })

    const [record] = await db.insert(contracts).values({
      tenantId:    session.tenantId,
      employeeId,
      type,
      pdfUrl:      pdfUrl    || null,
      superFund:   superFund || null,
      tfnProvided: tfnProvided ?? false,
      status:      'draft',
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/contracts', err)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('contracts:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, tfnProvided, superFund, bankBsb, bankAccount, signatureData } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status        !== undefined) updates.status        = status
    if (tfnProvided   !== undefined) updates.tfnProvided   = tfnProvided
    if (superFund     !== undefined) updates.superFund     = superFund
    if (bankBsb       !== undefined) updates.bankBsb       = bankBsb
    if (bankAccount   !== undefined) updates.bankAccount   = bankAccount
    if (signatureData !== undefined) { updates.signatureData = signatureData; updates.signedAt = new Date() }
    if (status === 'sent')   updates.sentAt   = new Date()
    if (status === 'signed') updates.signedAt = new Date()

    const [updated] = await db.update(contracts).set(updates)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/contracts', err)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}
