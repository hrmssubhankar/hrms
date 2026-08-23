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

  let query = db
    .select()
    .from(superContributions)
    .where(eq(superContributions.tenantId, session.tenantId))
    .$dynamic()

  if (employeeId) {
    query = query.where(and(
      eq(superContributions.tenantId, session.tenantId),
      eq(superContributions.employeeId, employeeId),
    ))
  }
  if (superFundId) {
    query = query.where(and(
      eq(superContributions.tenantId, session.tenantId),
      eq(superContributions.superFundId, superFundId),
    ))
  }

  const contributions = await db
    .select()
    .from(superContributions)
    .where(
      employeeId
        ? and(eq(superContributions.tenantId, session.tenantId), eq(superContributions.employeeId, employeeId))
        : eq(superContributions.tenantId, session.tenantId)
    )
    .orderBy(desc(superContributions.periodEnd))

  return NextResponse.json({ contributions })
}

// POST /api/tenant/superannuation/contributions
export async function POST(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const body = await req.json()

  const [contribution] = await db
    .insert(superContributions)
    .values({
      ...body,
      tenantId: session.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return NextResponse.json({ contribution }, { status: 201 })
}

// PATCH /api/tenant/superannuation/contributions (update by query param id)
export async function PATCH(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()

  const [contribution] = await db
    .update(superContributions)
    .set({ ...body, updatedAt: new Date() })
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
