import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRecords, employees } from '@/lib/db/schema'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { onboardingWelcomeEmail } from '@/lib/email/templates'
import { eq, desc, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { notifyRole } from '@/lib/notifications/notify'

// GET /api/tenant/onboarding
export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('onboarding:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const stage  = searchParams.get('stage')
    const search = searchParams.get('search') ?? ''

    const conditions = [eq(onboardingRecords.tenantId, session.tenantId)]
    if (status) conditions.push(eq(onboardingRecords.status, status))
    if (stage)  conditions.push(eq(onboardingRecords.stage, stage))

    const records = await db
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
        employeeIsActive:  employees.isActive,
      })
      .from(onboardingRecords)
      .leftJoin(employees, eq(onboardingRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(onboardingRecords.createdAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (r.employeeEmail ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : records

    // Stats always use full tenant scope (no filters)
    const all = await db
      .select({ status: onboardingRecords.status, stage: onboardingRecords.stage, completedAt: onboardingRecords.completedAt, createdAt: onboardingRecords.createdAt })
      .from(onboardingRecords)
      .where(eq(onboardingRecords.tenantId, session.tenantId))

    const stats = {
      total:       all.length,
      pending:     all.filter(r => r.status === 'pending').length,
      in_progress: all.filter(r => r.status === 'in_progress').length,
      completed:   all.filter(r => r.status === 'completed').length,
    }

    // Stage breakdown
    const stageBreakdown: Record<string, number> = {}
    for (const r of all) {
      stageBreakdown[r.stage] = (stageBreakdown[r.stage] ?? 0) + 1
    }

    // Avg days to complete
    const completedWithDates = all.filter(r => r.status === 'completed' && r.completedAt && r.createdAt)
    const avgDaysToComplete = completedWithDates.length
      ? Math.round(
          completedWithDates.reduce((sum, r) => {
            const diff = new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime()
            return sum + diff / (1000 * 60 * 60 * 24)
          }, 0) / completedWithDates.length
        )
      : null

    return NextResponse.json({ records: filtered, stats, stageBreakdown, avgDaysToComplete })
  } catch (err) {
    console.error('GET /api/tenant/onboarding', err)
    return NextResponse.json({ error: 'Failed to fetch onboarding records' }, { status: 500 })
  }
}

// POST /api/tenant/onboarding
export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('onboarding:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, stage, buddyId, notes, checklist } = body

    if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })

    const defaultChecklist = checklist ?? [
      { id: '1', task: 'Send welcome email',           done: false, category: 'admin' },
      { id: '2', task: 'Set up workstation / device',  done: false, category: 'it' },
      { id: '3', task: 'Create system accounts',       done: false, category: 'it' },
      { id: '4', task: 'Complete payroll paperwork',   done: false, category: 'hr' },
      { id: '5', task: 'Sign employment contract',     done: false, category: 'legal' },
      { id: '6', task: 'WHS induction',                done: false, category: 'compliance' },
      { id: '7', task: 'Policies & procedures review', done: false, category: 'compliance' },
      { id: '8', task: 'Meet team & buddy',            done: false, category: 'culture' },
      { id: '9', task: '30-day check-in scheduled',    done: false, category: 'hr' },
    ]

    const [record] = await db.insert(onboardingRecords).values({
      tenantId:  session.tenantId,
      employeeId,
      stage:     stage ?? 'pre_start',
      status:    'pending',
      buddyId:   buddyId ?? null,
      notes:     notes   ?? null,
      checklist: defaultChecklist,
    }).returning()

    // Send onboarding welcome email to the employee
    try {
      const ctx = await getTenantEmailCtx(session.tenantId)
      if (ctx.notify.emailOnboarding) {
        const [emp] = await db.select({ firstName: employees.firstName, email: employees.email, startDate: employees.startDate })
          .from(employees).where(eq(employees.id, employeeId))
        if (emp?.email) {
          const taskCount = Array.isArray(record.checklist) ? record.checklist.length : 9
          fireEmail(ctx, { to: emp.email, ...onboardingWelcomeEmail({
            recipientName: emp.firstName,
            orgName:       ctx.orgName,
            logoUrl:       ctx.logoUrl,
            primaryColor:  ctx.primaryColor,
            startDate:     emp.startDate ?? new Date().toISOString().split('T')[0],
            taskCount,
            loginUrl:      ctx.loginUrl,
          }) })
        }
      }
    } catch (emailErr) { console.error('Onboarding email error:', emailErr) }

    // In-app notification → HR + managers
    ;(async () => {
      try {
        const [emp] = await db
          .select({ firstName: employees.firstName, lastName: employees.lastName })
          .from(employees).where(eq(employees.id, employeeId))
        if (!emp) return
        notifyRole(session.tenantId, ['director', 'hr_officer', 'operations_manager'], {
          type:  'onboarding',
          title: 'New onboarding started',
          body:  `${emp.firstName} ${emp.lastName} has been added to the onboarding pipeline.`,
          link:  `/tenant/onboarding/${record.id}`,
        })
      } catch { /* non-blocking */ }
    })()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/tenant/onboarding', err)
    return NextResponse.json({ error: 'Failed to create onboarding record' }, { status: 500 })
  }
}

// DELETE /api/tenant/onboarding
export async function DELETE(req: NextRequest) {
  try {
    const guard = await apiGuard('onboarding:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.delete(onboardingRecords)
      .where(and(eq(onboardingRecords.id, id), eq(onboardingRecords.tenantId, session.tenantId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/tenant/onboarding', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
