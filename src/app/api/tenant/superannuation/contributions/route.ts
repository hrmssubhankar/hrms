import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { superContributions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/tenant/superannuation/contributions
export async function GET(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')
  const superFundId = searchParams.get('superFundId')

  const conditions = [eq(superContributions.tenantId, session.tenantId)]
  if (employeeId)  conditions.push(eq(superContributions.employeeId, employeeId))
  if (superFundId) conditions.push(eq(superContributions.superFundId, superFundId))

  const contributions = await db
    .select()
    .from(superContributions)
    .where(and(...conditions))
    .orderBy(desc(superContributions.periodEnd))

  return NextResponse.json({ contributions })
}

// POST /api/tenant/superannuation/contributions
export async function POST(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const {
    employeeId, superFundId, periodStart, periodEnd, dueDate,
    paidDate, grossEarnings, sgRate, sgAmount, voluntaryAmount,
    totalContribution, status, paymentReference, notes,
  } = await req.json()

  const [contribution] = await db
    .insert(superContributions)
    .values({
      tenantId: session.tenantId,
      employeeId,
      superFundId,
      periodStart,
      periodEnd,
      dueDate,
      ...(paidDate             !== undefined && { paidDate }),
      ...(grossEarnings        !== undefined && { grossEarnings }),
      ...(sgRate               !== undefined && { sgRate }),
      ...(sgAmount             !== undefined && { sgAmount }),
      ...(voluntaryAmount      !== undefined && { voluntaryAmount }),
      ...(totalContribution    !== undefined && { totalContribution }),
      ...(status               !== undefined && { status }),
      ...(paymentReference     !== undefined && { paymentReference }),
      ...(notes                !== undefined && { notes }),
    })
    .returning()

  return NextResponse.json({ contribution }, { status: 201 })
}

// PATCH /api/tenant/superannuation/contributions?id=...
export async function PATCH(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const {
    periodStart, periodEnd, dueDate, paidDate, grossEarnings,
    sgRate, sgAmount, voluntaryAmount, totalContribution,
    status, paymentReference, notes,
  } = await req.json()

  const [contribution] = await db
    .update(superContributions)
    .set({
      ...(periodStart          !== undefined && { periodStart }),
      ...(periodEnd            !== undefined && { periodEnd }),
      ...(dueDate              !== undefined && { dueDate }),
      ...(paidDate             !== undefined && { paidDate }),
      ...(grossEarnings        !== undefined && { grossEarnings }),
      ...(sgRate               !== undefined && { sgRate }),
      ...(sgAmount             !== undefined && { sgAmount }),
      ...(voluntaryAmount      !== undefined && { voluntaryAmount }),
      ...(totalContribution    !== undefined && { totalContribution }),
      ...(status               !== undefined && { status }),
      ...(paymentReference     !== undefined && { paymentReference }),
      ...(notes                !== undefined && { notes }),
      updatedAt: new Date(),
    })
    .where(and(
      eq(superContributions.id, id),
      eq(superContributions.tenantId, session.tenantId),
    ))
    .returning()

  if (!contribution) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ contribution })
}

// DELETE /api/tenant/superannuation/contributions?id=...
export async function DELETE(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [deleted] = await db
    .delete(superContributions)
    .where(and(
      eq(superContributions.id, id),
      eq(superContributions.tenantId, session.tenantId),
    ))
    .returning()

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
