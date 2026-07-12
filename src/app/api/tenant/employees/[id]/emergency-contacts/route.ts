import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emergencyContacts, employees } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/tenant/employees/[id]/emergency-contacts
export async function GET(_: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await ctx.params

  // Verify employee belongs to this tenant
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const contacts = await db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.employeeId, id))
    .orderBy(asc(emergencyContacts.isPrimary))  // primary first (desc would need desc import)

  // Sort primary first in JS
  contacts.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))

  return NextResponse.json({ contacts })
}

// POST /api/tenant/employees/[id]/emergency-contacts
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

  const { name, relationship, phone, email, isPrimary } = await req.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // If marking as primary, clear existing primaries first
  if (isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.employeeId, id))
  }

  const [created] = await db
    .insert(emergencyContacts)
    .values({ employeeId: id, name, relationship: relationship ?? null, phone: phone ?? null, email: email ?? null, isPrimary: isPrimary ?? false })
    .returning()

  return NextResponse.json({ contact: created }, { status: 201 })
}

// PATCH /api/tenant/employees/[id]/emergency-contacts — update one contact
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await ctx.params

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const { contactId, name, relationship, phone, email, isPrimary } = await req.json()
  if (!contactId) return NextResponse.json({ error: 'contactId is required' }, { status: 400 })

  if (isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.employeeId, id))
  }

  const updates: Partial<typeof emergencyContacts.$inferInsert> = {}
  if (name         !== undefined) updates.name         = name
  if (relationship !== undefined) updates.relationship = relationship
  if (phone        !== undefined) updates.phone        = phone
  if (email        !== undefined) updates.email        = email
  if (isPrimary    !== undefined) updates.isPrimary    = isPrimary

  const [updated] = await db
    .update(emergencyContacts)
    .set(updates)
    .where(and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.employeeId, id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  return NextResponse.json({ contact: updated })
}

// DELETE /api/tenant/employees/[id]/emergency-contacts
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { id } = await ctx.params

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, session.tenantId!)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const { contactId } = await req.json()
  if (!contactId) return NextResponse.json({ error: 'contactId is required' }, { status: 400 })

  await db
    .delete(emergencyContacts)
    .where(and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.employeeId, id)))

  return NextResponse.json({ ok: true })
}
