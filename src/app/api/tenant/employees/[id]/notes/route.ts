import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeNotes, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/tenant/employees/[id]/notes
export async function GET(_: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await ctx.params

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const notes = await db
    .select()
    .from(employeeNotes)
    .where(and(eq(employeeNotes.employeeId, id), eq(employeeNotes.tenantId, session.tenantId!)))
    .orderBy(desc(employeeNotes.createdAt))

  return NextResponse.json({ notes })
}

// POST /api/tenant/employees/[id]/notes
export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await ctx.params

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const [created] = await db
    .insert(employeeNotes)
    .values({
      tenantId:    session.tenantId!,
      employeeId:  id,
      authorId:    session.sub,
      authorEmail: session.email,
      content:     content.trim(),
    })
    .returning()

  return NextResponse.json({ note: created }, { status: 201 })
}
