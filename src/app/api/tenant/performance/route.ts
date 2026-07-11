import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceReviews, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('performance:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const type       = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')
    const search     = searchParams.get('search') ?? ''

    const conditions = [eq(performanceReviews.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(performanceReviews.status, status))
    if (type)       conditions.push(eq(performanceReviews.type, type))
    if (employeeId) conditions.push(eq(performanceReviews.employeeId, employeeId))

    const records = await db
      .select({
        id:              performanceReviews.id,
        employeeId:      performanceReviews.employeeId,
        reviewerId:      performanceReviews.reviewerId,
        type:            performanceReviews.type,
        status:          performanceReviews.status,
        scheduledDate:   performanceReviews.scheduledDate,
        completedAt:     performanceReviews.completedAt,
        overallRating:   performanceReviews.overallRating,
        kpis:            performanceReviews.kpis,
        developmentPlan: performanceReviews.developmentPlan,
        outcome:         performanceReviews.outcome,
        employeeInput:   performanceReviews.employeeInput,
        managerInput:    performanceReviews.managerInput,
        createdAt:       performanceReviews.createdAt,
        employeeFirstName:  employees.firstName,
        employeeLastName:   employees.lastName,
        employeeEmail:      employees.email,
        employeeStartDate:  employees.startDate,
        probationEndDate:   employees.probationEndDate,
      })
      .from(performanceReviews)
      .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(performanceReviews.createdAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase())
        )
      : records

    const all = await db
      .select({ status: performanceReviews.status, type: performanceReviews.type })
      .from(performanceReviews)
      .where(eq(performanceReviews.tenantId, session.tenantId))

    const stats = {
      total:     all.length,
      scheduled: all.filter(r => r.status === 'scheduled').length,
      completed: all.filter(r => r.status === 'completed').length,
      overdue:   all.filter(r => r.status === 'overdue').length,
      probation: all.filter(r => r.type?.startsWith('probation') || r.type === 'end_probation' || r.type === 'mid_probation').length,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/performance', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('performance:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, reviewerId, type, scheduledDate, kpis } = body

    if (!employeeId || !type) {
      return NextResponse.json({ error: 'employeeId and type are required' }, { status: 400 })
    }

    const defaultKpis = kpis ?? [
      { id: '1', area: 'Quality of Work',       rating: null, notes: '' },
      { id: '2', area: 'Communication',          rating: null, notes: '' },
      { id: '3', area: 'Teamwork',               rating: null, notes: '' },
      { id: '4', area: 'Punctuality & Attendance', rating: null, notes: '' },
      { id: '5', area: 'Initiative',             rating: null, notes: '' },
    ]

    const [review] = await db.insert(performanceReviews).values({
      tenantId:      session.tenantId,
      employeeId,
      reviewerId:    reviewerId    || null,
      type,
      status:        'scheduled',
      scheduledDate: scheduledDate || null,
      kpis:          defaultKpis,
    }).returning()

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/performance', err)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('performance:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, overallRating, kpis, developmentPlan, outcome, managerInput, employeeInput } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (status          !== undefined) updates.status          = status
    if (overallRating   !== undefined) updates.overallRating   = overallRating
    if (kpis            !== undefined) updates.kpis            = kpis
    if (developmentPlan !== undefined) updates.developmentPlan = developmentPlan
    if (outcome         !== undefined) updates.outcome         = outcome
    if (managerInput    !== undefined) updates.managerInput    = managerInput
    if (employeeInput   !== undefined) updates.employeeInput   = employeeInput
    if (status === 'completed') updates.completedAt = new Date()

    const [updated] = await db
      .update(performanceReviews)
      .set(updates)
      .where(and(eq(performanceReviews.id, id), eq(performanceReviews.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ review: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/performance', err)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}
