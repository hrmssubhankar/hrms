import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRecords, employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/tenant/onboarding/[id]
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [record] = await db
      .select({
        id:          onboardingRecords.id,
        employeeId:  onboardingRecords.employeeId,
        stage:       onboardingRecords.stage,
        status:      onboardingRecords.status,
        completedAt: onboardingRecords.completedAt,
        buddyId:     onboardingRecords.buddyId,
        checklist:   onboardingRecords.checklist,
        notes:       onboardingRecords.notes,
        createdAt:   onboardingRecords.createdAt,
        updatedAt:   onboardingRecords.updatedAt,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
        employeePositionId: employees.positionId,
        employeeStartDate: employees.startDate,
        employeePhotoUrl:  employees.photoUrl,
      })
      .from(onboardingRecords)
      .leftJoin(employees, eq(onboardingRecords.employeeId, employees.id))
      .where(and(eq(onboardingRecords.id, id), eq(onboardingRecords.tenantId, session.tenantId)))

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record })
  } catch (err) {
    console.error('GET /api/tenant/onboarding/[id]', err)
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 })
  }
}

// PATCH /api/tenant/onboarding/[id]
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { checklist, status, stage, buddyId, notes } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (checklist !== undefined) updates.checklist = checklist
    if (status    !== undefined) updates.status    = status
    if (stage     !== undefined) updates.stage     = stage
    if (buddyId   !== undefined) updates.buddyId   = buddyId
    if (notes     !== undefined) updates.notes     = notes

    // Auto-derive status from checklist if no explicit status given
    if (checklist && Array.isArray(checklist) && status === undefined) {
      const allDone = checklist.every((t: any) => t.done)
      if (allDone) {
        updates.status      = 'completed'
        updates.completedAt = new Date()
      } else {
        updates.status = 'in_progress'
      }
    }

    const [updated] = await db
      .update(onboardingRecords)
      .set(updates)
      .where(and(eq(onboardingRecords.id, id), eq(onboardingRecords.tenantId, session.tenantId)))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/onboarding/[id]', err)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}
