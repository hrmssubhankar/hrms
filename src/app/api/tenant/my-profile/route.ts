import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, emergencyContacts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-profile
 * Returns the logged-in user's own employee profile + emergency contacts.
 *
 * PATCH /api/tenant/my-profile
 * Allows employees to update their own limited fields:
 *   phone, address, preferredName
 * HR-managed fields (name, startDate, salary, etc.) cannot be self-updated.
 *
 * Uses apiAuth (authentication only, no role permission) — all authenticated
 * tenant users can view/edit their own profile regardless of role.
 * Cross-tenant isolation is enforced by session.tenantId + session.sub in queries.
 */

export async function GET() {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const [emp] = await db
    .select({
      id:               employees.id,
      employeeNumber:   employees.employeeNumber,
      firstName:        employees.firstName,
      lastName:         employees.lastName,
      preferredName:    employees.preferredName,
      email:            employees.email,
      phone:            employees.phone,
      address:          employees.address,
      dateOfBirth:      employees.dateOfBirth,
      gender:           employees.gender,
      photoUrl:         employees.photoUrl,
      entityName:       employees.entityName,
      employmentType:   employees.employmentType,
      startDate:        employees.startDate,
      isActive:         employees.isActive,
    })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId,   session.sub as string),
    ))

  if (!emp) {
    return NextResponse.json({ profile: null, employeeLinked: false })
  }

  const contacts = await db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.employeeId, emp.id))

  return NextResponse.json({ profile: emp, emergencyContacts: contacts, employeeLinked: true })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId,   session.sub as string),
    ))

  if (!emp) {
    return NextResponse.json({ error: 'No employee profile linked to your account.' }, { status: 404 })
  }

  const body = await req.json()
  // Only self-editable fields — HR fields are intentionally excluded
  const { preferredName, phone, address } = body
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (preferredName !== undefined) updates.preferredName = preferredName || null
  if (phone         !== undefined) updates.phone         = phone || null
  if (address       !== undefined) updates.address       = address || null

  const [updated] = await db
    .update(employees)
    .set(updates)
    .where(and(
      eq(employees.id,       emp.id),
      eq(employees.tenantId, session.tenantId),
    ))
    .returning()

  return NextResponse.json({ profile: updated })
}
