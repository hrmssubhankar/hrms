/**
 * GET    /api/tenant/expenses/[id]  — get single claim
 * PATCH  /api/tenant/expenses/[id]  — approve / reject / mark paid
 * DELETE /api/tenant/expenses/[id]  — withdraw (pending only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expenseClaims, employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('expenses:read')
  if (guard.error) return guard.error

  const { tenantId } = guard.session
  const { id } = await params

  const [row] = await db
    .select({
      id:          expenseClaims.id,
      title:       expenseClaims.title,
      category:    expenseClaims.category,
      amount:      expenseClaims.amount,
      currency:    expenseClaims.currency,
      expenseDate: expenseClaims.expenseDate,
      description: expenseClaims.description,
      receiptUrl:  expenseClaims.receiptUrl,
      status:      expenseClaims.status,
      submittedAt: expenseClaims.submittedAt,
      reviewedBy:  expenseClaims.reviewedBy,
      reviewedAt:  expenseClaims.reviewedAt,
      reviewNotes: expenseClaims.reviewNotes,
      paidAt:      expenseClaims.paidAt,
      employeeId:        expenseClaims.employeeId,
      employeeFirstName: employees.firstName,
      employeeLastName:  employees.lastName,
    })
    .from(expenseClaims)
    .leftJoin(employees, eq(expenseClaims.employeeId, employees.id))
    .where(and(eq(expenseClaims.id, id), eq(expenseClaims.tenantId, tenantId)))
    .limit(1)

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('expenses:write')
  if (guard.error) return guard.error

  const { tenantId } = guard.session
  const userEmail = guard.session.email
  const { id } = await params

  const [existing] = await db.select({ status: expenseClaims.status })
    .from(expenseClaims)
    .where(and(eq(expenseClaims.id, id), eq(expenseClaims.tenantId, tenantId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const action = body.action as 'approve' | 'reject' | 'pay' | undefined

  const updates: Record<string, any> = { updatedAt: new Date() }

  if (action === 'approve') {
    if (existing.status !== 'pending') return NextResponse.json({ error: 'Can only approve pending claims' }, { status: 409 })
    updates.status      = 'approved'
    updates.reviewedBy  = userEmail ?? 'admin'
    updates.reviewedAt  = new Date()
    updates.reviewNotes = body.reviewNotes ?? null
  } else if (action === 'reject') {
    if (existing.status !== 'pending') return NextResponse.json({ error: 'Can only reject pending claims' }, { status: 409 })
    updates.status      = 'rejected'
    updates.reviewedBy  = userEmail ?? 'admin'
    updates.reviewedAt  = new Date()
    updates.reviewNotes = body.reviewNotes ?? null
  } else if (action === 'pay') {
    if (existing.status !== 'approved') return NextResponse.json({ error: 'Can only pay approved claims' }, { status: 409 })
    updates.status = 'paid'
    updates.paidAt = new Date()
  } else {
    if (existing.status !== 'pending') return NextResponse.json({ error: 'Cannot edit a processed claim' }, { status: 409 })
    if (body.title)       updates.title       = body.title
    if (body.category)    updates.category    = body.category
    if (body.amount)      updates.amount      = body.amount
    if (body.expenseDate) updates.expenseDate = body.expenseDate
    if (body.description !== undefined) updates.description = body.description
  }

  const [updated] = await db.update(expenseClaims)
    .set(updates)
    .where(and(eq(expenseClaims.id, id), eq(expenseClaims.tenantId, tenantId)))
    .returning({ id: expenseClaims.id, status: expenseClaims.status })

  return NextResponse.json({ ok: true, ...updated })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await apiGuard('expenses:write')
  if (guard.error) return guard.error

  const { tenantId } = guard.session
  const { id } = await params

  const [existing] = await db
    .select({ status: expenseClaims.status })
    .from(expenseClaims)
    .where(and(eq(expenseClaims.id, id), eq(expenseClaims.tenantId, tenantId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending claims can be withdrawn' }, { status: 409 })

  await db.delete(expenseClaims).where(and(eq(expenseClaims.id, id), eq(expenseClaims.tenantId, tenantId)))
  return NextResponse.json({ ok: true })
}
