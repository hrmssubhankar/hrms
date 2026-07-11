import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { complianceLockExceptions, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getSession } from '@/lib/auth/session'

// GET — list active compliance lock exceptions
export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('compliance:read')
    if (guard.error) return guard.error
    const { session } = guard

    const records = await db
      .select({
        id:          complianceLockExceptions.id,
        employeeId:  complianceLockExceptions.employeeId,
        reason:      complianceLockExceptions.reason,
        expiresAt:   complianceLockExceptions.expiresAt,
        approvedBy:  complianceLockExceptions.approvedBy,
        approvedAt:  complianceLockExceptions.approvedAt,
        isActive:    complianceLockExceptions.isActive,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
      })
      .from(complianceLockExceptions)
      .leftJoin(employees, eq(complianceLockExceptions.employeeId, employees.id))
      .where(eq(complianceLockExceptions.tenantId, session.tenantId))
      .orderBy(desc(complianceLockExceptions.approvedAt))

    return NextResponse.json({ records })
  } catch (err) {
    console.error('GET /api/tenant/compliance/lock', err)
    return NextResponse.json({ error: 'Failed to fetch lock exceptions' }, { status: 500 })
  }
}

// POST — grant a temporary compliance lock exception
export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('compliance:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, reason, expiresAt } = body

    if (!employeeId || !reason || !expiresAt) {
      return NextResponse.json({ error: 'employeeId, reason and expiresAt are required' }, { status: 400 })
    }

    const [record] = await db.insert(complianceLockExceptions).values({
      tenantId:   session.tenantId,
      employeeId,
      reason,
      expiresAt:  new Date(expiresAt),
      approvedBy: session.sub,
      approvedAt: new Date(),
      isActive:   true,
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/compliance/lock', err)
    return NextResponse.json({ error: 'Failed to create exception' }, { status: 500 })
  }
}

// PATCH — revoke an exception
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const [updated] = await db
      .update(complianceLockExceptions)
      .set({ isActive: isActive ?? false })
      .where(and(eq(complianceLockExceptions.id, id), eq(complianceLockExceptions.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/compliance/lock', err)
    return NextResponse.json({ error: 'Failed to update exception' }, { status: 500 })
  }
}
