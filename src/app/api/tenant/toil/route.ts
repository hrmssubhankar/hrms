import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { toilEntries, employees } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { upsertBalance } from './_helpers'

export const dynamic = 'force-dynamic'

// GET /api/tenant/toil — list TOIL entries
export async function GET(req: NextRequest) {
  const { error, session } = await apiGuard('toil:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')
  const status = searchParams.get('status')

  const rows = await db
    .select({
      entry: toilEntries,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as('employee_name'),
    })
    .from(toilEntries)
    .leftJoin(employees, eq(toilEntries.employeeId, employees.id))
    .where(and(
      eq(toilEntries.tenantId, session.tenantId),
      employeeId ? eq(toilEntries.employeeId, employeeId) : undefined,
      status ? eq(toilEntries.status, status) : undefined,
    ))
    .orderBy(desc(toilEntries.workDate))
    .limit(200)

  const entries = rows.map(r => ({ ...r.entry, employeeName: r.employeeName }))
  return NextResponse.json({ entries })
}

// POST /api/tenant/toil — record accrual or take request
export async function POST(req: NextRequest) {
  const { error, session } = await apiGuard('toil:write')
  if (error) return error

  const body = await req.json()
  const { employeeId, entryType = 'accrual', hours, multiplier = 1.0, workDate, ...rest } = body

  if (!employeeId || !hours || !workDate) {
    return NextResponse.json({ error: 'employeeId, hours, and workDate required' }, { status: 400 })
  }

  // Accruals are auto-approved; take requests need approval
  const status = entryType === 'accrual' ? 'approved' : 'pending'

  const [entry] = await db
    .insert(toilEntries)
    .values({
      ...rest,
      tenantId: session.tenantId,
      employeeId,
      entryType,
      hours: String(hours),
      multiplier: String(multiplier),
      workDate,
      status,
      requestedAt: entryType !== 'accrual' ? new Date() : undefined,
      createdBy: session.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  // Update balance immediately for approved entries
  if (status === 'approved') {
    await upsertBalance(session.tenantId, employeeId, parseFloat(String(hours)), entryType)
  }

  return NextResponse.json({ entry }, { status: 201 })
}
