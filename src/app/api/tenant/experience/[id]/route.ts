import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeExperience } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// PATCH — update an experience record
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard

  const { id } = await ctx.params

  try {
    const body = await req.json()
    const { companyName, jobTitle, employmentType, startDate, endDate, isCurrent, location, description, reasonForLeaving } = body

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (companyName      !== undefined) updates.companyName      = companyName
    if (jobTitle         !== undefined) updates.jobTitle         = jobTitle
    if (employmentType   !== undefined) updates.employmentType   = employmentType
    if (startDate        !== undefined) updates.startDate        = startDate
    if (endDate          !== undefined) updates.endDate          = endDate || null
    if (isCurrent        !== undefined) updates.isCurrent        = isCurrent
    if (location         !== undefined) updates.location         = location || null
    if (description      !== undefined) updates.description      = description || null
    if (reasonForLeaving !== undefined) updates.reasonForLeaving = reasonForLeaving || null

    await db.update(employeeExperience)
      .set(updates)
      .where(and(eq(employeeExperience.id, id), eq(employeeExperience.tenantId, session.tenantId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Experience PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE — remove an experience record
export async function DELETE(_: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard

  const { id } = await ctx.params

  try {
    await db.delete(employeeExperience)
      .where(and(eq(employeeExperience.id, id), eq(employeeExperience.tenantId, session.tenantId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Experience DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
