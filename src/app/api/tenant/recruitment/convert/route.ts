/**
 * POST /api/tenant/recruitment/convert
 *
 * Converts a hired candidate into an employee record and optionally creates
 * an onboarding record for them.
 *
 * Body:
 *   applicationId    — the application that has status = 'hired'
 *   startDate        — ISO date string (YYYY-MM-DD)
 *   employmentType   — 'full_time' | 'part_time' | 'casual' | 'contractor'
 *   departmentId?    — uuid
 *   positionId?      — uuid
 *   createOnboarding — boolean (default true)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { applications, candidates, employees, onboardingRecords } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { genericNotificationEmail } from '@/lib/email/templates'
import { notifyRole } from '@/lib/notifications/notify'

export const dynamic = 'force-dynamic'

const DEFAULT_CHECKLIST = [
  { id: '1', task: 'Send welcome email',                 category: 'hr',         done: false },
  { id: '2', task: 'Set up workstation / access',        category: 'it',         done: false },
  { id: '3', task: 'Complete tax file declaration',      category: 'admin',      done: false },
  { id: '4', task: 'Superannuation fund details',        category: 'admin',      done: false },
  { id: '5', task: 'Bank account details',               category: 'admin',      done: false },
  { id: '6', task: 'NDIS screening / police check',      category: 'compliance', done: false },
  { id: '7', task: 'Review employment contract',         category: 'legal',      done: false },
  { id: '8', task: 'OH&S induction',                     category: 'compliance', done: false },
  { id: '9', task: 'Meet the team / buddy assigned',     category: 'culture',    done: false },
  { id: '10', task: 'Complete mandatory training',       category: 'compliance', done: false },
]

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('recruitment:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const {
      applicationId,
      startDate,
      employmentType = 'full_time',
      departmentId,
      positionId,
      createOnboarding = true,
    } = body

    if (!applicationId || !startDate) {
      return NextResponse.json({ error: 'applicationId and startDate are required' }, { status: 400 })
    }

    // Fetch the application + candidate
    const [app] = await db
      .select({
        id:          applications.id,
        status:      applications.status,
        tenantId:    applications.tenantId,
        candidateId: applications.candidateId,
        candFirst:   candidates.firstName,
        candLast:    candidates.lastName,
        candEmail:   candidates.email,
        candPhone:   candidates.phone,
      })
      .from(applications)
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(and(eq(applications.id, applicationId), eq(applications.tenantId, session.tenantId)))

    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (app.status !== 'hired') return NextResponse.json({ error: 'Application must be in "hired" status' }, { status: 400 })

    const firstName = app.candFirst ?? 'New'
    const lastName  = app.candLast  ?? 'Employee'
    const email     = app.candEmail ?? ''

    // Check for duplicate email
    const existing = await db.select({ id: employees.id }).from(employees)
      .where(and(eq(employees.tenantId, session.tenantId), eq(employees.email, email)))
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An employee with this email already exists', employeeId: existing[0].id }, { status: 409 })
    }

    // Generate employee number
    const empNumber = `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Create employee record
    const [employee] = await db.insert(employees).values({
      tenantId:       session.tenantId,
      employeeNumber: empNumber,
      firstName,
      lastName,
      email,
      phone:          app.candPhone ?? null,
      employmentType: employmentType as any,
      startDate,
      departmentId:   departmentId ?? null,
      positionId:     positionId   ?? null,
      isActive:       true,
      complianceStatus: 'pending',
    }).returning()

    // Create onboarding record
    let onboarding = null
    if (createOnboarding) {
      ;[onboarding] = await db.insert(onboardingRecords).values({
        tenantId:   session.tenantId,
        employeeId: employee.id,
        stage:      'pre_start',
        status:     'pending',
        checklist:  DEFAULT_CHECKLIST,
      }).returning().catch(() => [null])
    }

    // Fire notifications (non-blocking)
    ;(async () => {
      try {
        const ctx = await getTenantEmailCtx(session.tenantId)
        notifyRole(session.tenantId, ['hr_officer', 'director', 'operations_manager'], {
          type:  'employee',
          title: `🎉 New employee created — ${firstName} ${lastName}`,
          body:  `Converted from recruitment pipeline. Start date: ${startDate}`,
          link:  `/tenant/employees`,
        })

        // Welcome email to new employee
        if (email) {
          fireEmail(ctx, {
            to: email,
            ...genericNotificationEmail({
              recipientName: firstName,
              orgName:       ctx.orgName,
              logoUrl:       ctx.logoUrl,
              primaryColor:  ctx.primaryColor,
              title:         `Welcome to ${ctx.orgName}! 🎉`,
              message:       `Hi ${firstName}, we're thrilled to have you joining the team! Your start date is <strong>${startDate}</strong>. HR will be in touch shortly with your onboarding details and next steps.`,
              ctaLabel:      'Get Started',
              ctaUrl:        ctx.loginUrl,
            }),
          })
        }
      } catch (e) { console.error('convert notify error:', e) }
    })()

    return NextResponse.json({
      ok: true,
      employee: { id: employee.id, employeeNumber: empNumber, firstName, lastName, email },
      onboardingId: onboarding?.id ?? null,
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/recruitment/convert', err)
    return NextResponse.json({ error: 'Failed to convert candidate to employee' }, { status: 500 })
  }
}
