import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { toilBalances, employees } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/tenant/toil/balance — get TOIL balance(s)
export async function GET(req: NextRequest) {
  const { error, session } = await apiGuard('toil:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')

  if (employeeId) {
    const [balance] = await db
      .select()
      .from(toilBalances)
      .where(and(
        eq(toilBalances.tenantId, session.tenantId),
        eq(toilBalances.employeeId, employeeId),
      ))

    return NextResponse.json({ balance: balance ?? null })
  }

  // All balances with employee names
  const rows = await db
    .select({
      balance: toilBalances,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as('employee_name'),
      employeeEmail: employees.email,
    })
    .from(toilBalances)
    .leftJoin(employees, eq(toilBalances.employeeId, employees.id))
    .where(eq(toilBalances.tenantId, session.tenantId))
    .orderBy(employees.firstName)

  const balances = rows.map(r => ({
    ...r.balance,
    employeeName: r.employeeName,
    employeeEmail: r.employeeEmail,
  }))

  return NextResponse.json({ balances })
}
