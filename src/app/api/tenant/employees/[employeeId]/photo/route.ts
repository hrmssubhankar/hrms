/**
 * POST /api/tenant/employees/[employeeId]/photo
 * Upload a profile photo URL for an employee
 * Body: { photoUrl: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { employeeId: string } }) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { photoUrl } = await req.json()
  if (!photoUrl) return NextResponse.json({ error: 'photoUrl is required' }, { status: 400 })

  const [updated] = await db
    .update(employees)
    .set({ photoUrl, updatedAt: new Date() })
    .where(and(eq(employees.id, params.employeeId), eq(employees.tenantId, tenantId)))
    .returning({ id: employees.id, photoUrl: employees.photoUrl })

  if (!updated) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  return NextResponse.json({ employee: updated })
}
