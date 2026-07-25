/**
 * GET    /api/tenant/roster/availability  — list availability for the week's employees
 * POST   /api/tenant/roster/availability  — upsert an availability slot
 * DELETE /api/tenant/roster/availability?id=  — delete a slot
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeAvailability, employees } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('rostering:read')
  if (guard.error) return guard.error
  const { session } = guard

  const empIdParam = req.nextUrl.searchParams.get('employeeId')
  const isManager  = hasPermission(session.userRole, 'rostering:write')

  try {
    let empIds: string[] | null = empIdParam ? [empIdParam] : null

    // Non-managers can only see their own availability
    if (!isManager) {
      const [myEmp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.userId, session.sub), eq(employees.tenantId, session.tenantId)))
        .limit(1)
      if (!myEmp) return NextResponse.json({ availability: [] })
      empIds = [myEmp.id]
    }

    const conditions = [eq(employeeAvailability.tenantId, session.tenantId)]
    if (empIds) conditions.push(inArray(employeeAvailability.employeeId, empIds))

    const rows = await db
      .select()
      .from(employeeAvailability)
      .where(and(...conditions))
      .orderBy(employeeAvailability.employeeId, employeeAvailability.dayOfWeek)

    return NextResponse.json({ availability: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('rostering:read') // employees can set their own
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { employeeId, dayOfWeek, startTime, endTime, isAvailable = true, note } = body

    if (!employeeId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'employeeId, dayOfWeek, startTime, endTime are required' },
        { status: 400 }
      )
    }

    const isManager = hasPermission(session.userRole, 'rostering:write')

    // Employees can only set their own availability
    if (!isManager) {
      const [myEmp] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.userId, session.sub), eq(employees.tenantId, session.tenantId)))
        .limit(1)
      if (!myEmp || myEmp.id !== employeeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Delete existing slot for same employee + day, then insert (upsert pattern)
    await db
      .delete(employeeAvailability)
      .where(
        and(
          eq(employeeAvailability.tenantId,   session.tenantId),
          eq(employeeAvailability.employeeId,  employeeId),
          eq(employeeAvailability.dayOfWeek,   dayOfWeek),
        )
      )

    const [row] = await db
      .insert(employeeAvailability)
      .values({
        tenantId:    session.tenantId,
        employeeId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
        note: note || null,
      })
      .returning()

    return NextResponse.json({ availability: row }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await apiGuard('rostering:read')
  if (guard.error) return guard.error
  const { session } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await db
      .delete(employeeAvailability)
      .where(
        and(
          eq(employeeAvailability.id,       id),
          eq(employeeAvailability.tenantId, session.tenantId),
        )
      )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
