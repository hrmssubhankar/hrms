import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { isActive } = await req.json()
  const [row] = await db.update(employees)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
    .returning({ id: employees.id, isActive: employees.isActive })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}
