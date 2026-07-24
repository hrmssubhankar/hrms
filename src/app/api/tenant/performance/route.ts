import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performanceReviews, employees } from '@/lib/db/schema'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { performanceReviewScheduledEmail, performanceReviewCompletedEmail } from '@/lib/email/templates'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { notify, notifyRole } from '@/lib/notifications/notify'

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

    // In-app + email notifications
    ;(async () => {
      try {
        const [emp] = await db
          .select({ firstName: employees.firstName, lastName: employees.lastName, email: employees.email, userId: employees.userId })
          .from(employees).where(eq(employees.id, employeeId))

        // Notify employee their review has been scheduled
        if (emp?.userId) {
          notify(session.tenantId, emp.userId, {
            type:  'performance',
            title: `Performance review scheduled — ${type.replace(/_/g, ' ')}`,
            body:  scheduledDate ? `Your review is scheduled for ${scheduledDate}.` : 'A review has been created for you.',
            link:  '/tenant/my-profile',
          })
        }

        // Notify HR team
        notifyRole(session.tenantId, ['hr_officer', 'director', 'operations_manager'], {
          type:  'performance',
          title: `New performance review created`,
          body:  `${emp ? `${emp.firstName} ${emp.lastName}` : 'An employee'} — ${type.replace(/_/g, ' ')}${scheduledDate ? `, scheduled ${scheduledDate}` : ''}.`,
          link:  '/tenant/performance',
        })

        // Email employee
        const ctx = await getTenantEmailCtx(session.tenantId)
        if (ctx.notify.emailPerformance && scheduledDate && emp?.email) {
          fireEmail(ctx, { to: emp.email, ...performanceReviewScheduledEmail({
            recipientName: emp.firstName, orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
            reviewType: type, scheduledDate, loginUrl: ctx.loginUrl,
          }) })
        }
      } catch (emailErr) { console.error('Performance review notification error:', emailErr) }
    })()

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

    // In-app + email when review is completed
    if (status === 'completed' && updated) {
      ;(async () => {
        try {
          const [emp] = await db
            .select({ firstName: employees.firstName, lastName: employees.lastName, email: employees.email, userId: employees.userId })
            .from(employees).where(eq(employees.id, updated.employeeId))

          // Notify employee
          if (emp?.userId) {
            notify(session.tenantId, emp.userId, {
              type:  'performance',
              title: 'Performance review completed',
              body:  updated.overallRating
                ? `Your review is complete. Overall rating: ${updated.overallRating}/5.`
                : 'Your performance review has been finalised.',
              link:  '/tenant/my-profile',
            })
          }

          // Notify HR of completion
          notifyRole(session.tenantId, ['hr_officer', 'director'], {
            type:  'performance',
            title: `Review completed — ${emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'}`,
            body:  updated.overallRating ? `Overall rating: ${updated.overallRating}/5.` : undefined,
            link:  '/tenant/performance',
          })

          // Email employee
          const ctx = await getTenantEmailCtx(session.tenantId)
          if (ctx.notify.emailPerformance && emp?.email) {
            fireEmail(ctx, { to: emp.email, ...performanceReviewCompletedEmail({
              recipientName: emp.firstName, orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
              reviewType: updated.type, overallRating: updated.overallRating ?? undefined, loginUrl: ctx.loginUrl,
            }) })
          }
        } catch (emailErr) { console.error('Performance completed notification error:', emailErr) }
      })()
    }

    return NextResponse.json({ review: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/performance', err)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}
