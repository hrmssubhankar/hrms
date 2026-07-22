import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contracts, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('contracts:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const conditions = [eq(contracts.tenantId, session.tenantId)]
  if (status) conditions.push(eq(contracts.status, status))

  const rows = await db
    .select({
      id:          contracts.id,
      employeeId:  contracts.employeeId,
      type:        contracts.type,
      status:      contracts.status,
      sentAt:      contracts.sentAt,
      signedAt:    contracts.signedAt,
      tfnProvided: contracts.tfnProvided,
      superFund:   contracts.superFund,
      createdAt:   contracts.createdAt,
      firstName:   employees.firstName,
      lastName:    employees.lastName,
      email:       employees.email,
      employmentType: employees.employmentType,
    })
    .from(contracts)
    .leftJoin(employees, eq(employees.id, contracts.employeeId))
    .where(and(...conditions))
    .orderBy(desc(contracts.createdAt))

  const filtered = search
    ? rows.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  const stats = {
    total:   rows.length,
    draft:   rows.filter(r => r.status === 'draft').length,
    sent:    rows.filter(r => r.status === 'sent').length,
    signed:  rows.filter(r => r.status === 'signed').length,
    expired: rows.filter(r => r.status === 'expired').length,
  }

  return NextResponse.json({ contracts: filtered, stats })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { employeeId, type } = body
  if (!employeeId || !type) {
    return NextResponse.json({ error: 'employeeId and type are required' }, { status: 400 })
  }

  const [emp] = await db.select({ id: employees.id }).from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, session.tenantId)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const [contract] = await db.insert(contracts).values({
    tenantId:   session.tenantId,
    employeeId,
    type,
    status:     'draft',
  }).returning()

  return NextResponse.json({ contract }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { id, status, tfnProvided, superFund, bankBsb, bankAccount } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status      !== undefined) updates.status      = status
  if (tfnProvided !== undefined) updates.tfnProvided = tfnProvided
  if (superFund   !== undefined) updates.superFund   = superFund
  if (bankBsb     !== undefined) updates.bankBsb     = bankBsb
  if (bankAccount !== undefined) updates.bankAccount = bankAccount
  if (status === 'sent')   updates.sentAt   = new Date()
  if (status === 'signed') updates.signedAt = new Date()

  const [updated] = await db
    .update(contracts).set(updates)
    .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ contract: updated })
}
