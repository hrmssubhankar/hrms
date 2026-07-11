import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRecords, employees } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

// GET /api/tenant/onboarding
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const search = searchParams.get('search') ?? ''

    const conditions = [eq(onboardingRecords.tenantId, session.tenantId)]
    if (status) conditions.push(eq(onboardingRecords.status, status))

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

    // Stats
    const all = await db
      .select({ status: onboardingRecords.status })
      .from(onboardingRecords)
      .where(eq(onboardingRecords.tenantId, session.tenantId))

    const stats = {
      total:       all.length,
      pending:     all.filter(r => r.status === 'pending').length,
      in_progress: all.filter(r => r.status === 'in_progress').length,
      completed:   all.filter(r => r.status === 'completed').length,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/onboarding', err)
    return NextResponse.json({ error: 'Failed to fetch onboarding records' }, { status: 500 })
  }
}

// POST /api/tenant/onboarding
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    return NextResponse.json({ record }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/tenant/onboarding', err)
    return NextResponse.json({ error: 'Failed to create onboarding record' }, { status: 500 })
  }
}
