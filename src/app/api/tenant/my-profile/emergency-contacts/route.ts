/**
 * POST   /api/tenant/my-profile/emergency-contacts  — add emergency contact
 * PATCH  /api/tenant/my-profile/emergency-contacts  — update emergency contact
 * DELETE /api/tenant/my-profile/emergency-contacts?id=  — delete emergency contact
 *
 * All operations are scoped to the authenticated user's own employee record.
 * Uses apiAuth (no special role required).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, emergencyContacts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

async function resolveEmployee(tenantId: string, userId: string) {
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.userId, userId)))
    .limit(1)
  return emp ?? null
}

export async function POST(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const emp = await resolveEmployee(session.tenantId, session.sub as string)
  if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })

  const body = await req.json()
  const { name, relationship, phone, email, isPrimary = false } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // If setting as primary, clear existing primary flag first
  if (isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.employeeId, emp.id))
  }

  const [contact] = await db
    .insert(emergencyContacts)
    .values({
      employeeId:   emp.id,
      name:         name.trim(),
      relationship: relationship?.trim() || null,
      phone:        phone?.trim()        || null,
      email:        email?.trim()        || null,
      isPrimary,
    })
    .returning()

  return NextResponse.json({ contact }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const emp = await resolveEmployee(session.tenantId, session.sub as string)
  if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })

  const body = await req.json()
  const { id, name, relationship, phone, email, isPrimary } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify the contact belongs to this employee
  const [existing] = await db
    .select({ id: emergencyContacts.id })
    .from(emergencyContacts)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.employeeId, emp.id)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // If setting as primary, clear existing primary flag first
  if (isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.employeeId, emp.id))
  }

  const updates: Record<string, unknown> = {}
  if (name         !== undefined) updates.name         = name.trim()
  if (relationship !== undefined) updates.relationship = relationship?.trim() || null
  if (phone        !== undefined) updates.phone        = phone?.trim()        || null
  if (email        !== undefined) updates.email        = email?.trim()        || null
  if (isPrimary    !== undefined) updates.isPrimary    = isPrimary

  const [updated] = await db
    .update(emergencyContacts)
    .set(updates)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.employeeId, emp.id)))
    .returning()

  return NextResponse.json({ contact: updated })
}

export async function DELETE(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const emp = await resolveEmployee(session.tenantId, session.sub as string)
  if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db
    .delete(emergencyContacts)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.employeeId, emp.id)))

  return NextResponse.json({ ok: true })
}
