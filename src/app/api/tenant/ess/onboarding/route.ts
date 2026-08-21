/**
 * GET   /api/tenant/ess/onboarding  — get current employee's onboarding submission
 * POST  /api/tenant/ess/onboarding  — create or update submission (upsert)
 * PATCH /api/tenant/ess/onboarding  — submit for HR review
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { essOnboarding, employees } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/** Find the employee record for the logged-in user */
async function getEmployeeId(tenantId: string, email: string): Promise<string | null> {
  const [emp] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.email, email)))
  return emp?.id ?? null
}

export async function GET() {
  const guard = await apiGuard('self_service:read')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const employeeId = await getEmployeeId(tenantId, email)
  if (!employeeId) return NextResponse.json({ submission: null })

  const [submission] = await db.select().from(essOnboarding)
    .where(and(eq(essOnboarding.tenantId, tenantId), eq(essOnboarding.employeeId, employeeId)))

  return NextResponse.json({ submission: submission ?? null })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const employeeId = await getEmployeeId(tenantId, email)
  if (!employeeId) return NextResponse.json({ error: 'No employee record found for your account' }, { status: 404 })

  const body = await req.json()

  // Remove status/review fields — only HR can set those
  const { status: _s, submittedAt: _sa, reviewedBy: _rb, reviewedAt: _ra, hrNotes: _hn, ...safeBody } = body

  // Check if exists
  const [existing] = await db.select({ id: essOnboarding.id })
    .from(essOnboarding)
    .where(and(eq(essOnboarding.tenantId, tenantId), eq(essOnboarding.employeeId, employeeId)))

  if (existing) {
    const [updated] = await db.update(essOnboarding)
      .set({ ...safeBody, updatedAt: new Date() })
      .where(and(eq(essOnboarding.tenantId, tenantId), eq(essOnboarding.employeeId, employeeId)))
      .returning()
    return NextResponse.json({ submission: updated })
  } else {
    const [created] = await db.insert(essOnboarding)
      .values({ tenantId, employeeId, ...safeBody })
      .returning()
    return NextResponse.json({ submission: created }, { status: 201 })
  }
}

export async function PATCH(req: NextRequest) {
  // Submit for HR review
  const guard = await apiGuard('self_service:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const employeeId = await getEmployeeId(tenantId, email)
  if (!employeeId) return NextResponse.json({ error: 'No employee record found' }, { status: 404 })

  const [submission] = await db.update(essOnboarding)
    .set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(essOnboarding.tenantId, tenantId),
      eq(essOnboarding.employeeId, employeeId),
      eq(essOnboarding.status, 'draft'),
    ))
    .returning()

  if (!submission) return NextResponse.json({ error: 'No draft submission found' }, { status: 404 })
  return NextResponse.json({ submission })
}
