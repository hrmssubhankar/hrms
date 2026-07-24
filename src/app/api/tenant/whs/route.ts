import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { whsIncidents, employees } from '@/lib/db/schema'
import { getTenantEmailCtx, getTenantRoleEmails, fireEmail } from '@/lib/email/emailHelper'
import { whsIncidentReportedEmail } from '@/lib/email/templates'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { notify, notifyRole } from '@/lib/notifications/notify'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('whs:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status   = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type     = searchParams.get('type')
    const search   = searchParams.get('search') ?? ''

    const conditions = [eq(whsIncidents.tenantId, session.tenantId)]
    if (status)   conditions.push(eq(whsIncidents.status, status))
    if (severity) conditions.push(eq(whsIncidents.severity, severity))
    if (type)     conditions.push(eq(whsIncidents.type, type))

    const records = await db
      .select({
        id:                whsIncidents.id,
        reportedBy:        whsIncidents.reportedBy,
        employeeId:        whsIncidents.employeeId,
        type:              whsIncidents.type,
        severity:          whsIncidents.severity,
        description:       whsIncidents.description,
        location:          whsIncidents.location,
        occurredAt:        whsIncidents.occurredAt,
        status:            whsIncidents.status,
        correctiveActions: whsIncidents.correctiveActions,
        closedAt:          whsIncidents.closedAt,
        createdAt:         whsIncidents.createdAt,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
      })
      .from(whsIncidents)
      .leftJoin(employees, eq(whsIncidents.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(whsIncidents.occurredAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName ?? ''} ${r.employeeLastName ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          (r.location ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : records

    const all = await db
      .select({ status: whsIncidents.status, severity: whsIncidents.severity, type: whsIncidents.type })
      .from(whsIncidents)
      .where(eq(whsIncidents.tenantId, session.tenantId))

    const stats = {
      total:     all.length,
      open:      all.filter(r => r.status === 'open').length,
      investigating: all.filter(r => r.status === 'investigating').length,
      closed:    all.filter(r => r.status === 'closed').length,
      critical:  all.filter(r => r.severity === 'critical').length,
      high:      all.filter(r => r.severity === 'high').length,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/whs', err)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('whs:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { reportedBy, employeeId, type, severity, description, location, occurredAt } = body

    if (!reportedBy || !type || !description || !occurredAt) {
      return NextResponse.json({ error: 'reportedBy, type, description and occurredAt are required' }, { status: 400 })
    }

    const [record] = await db.insert(whsIncidents).values({
      tenantId:          session.tenantId,
      reportedBy,
      employeeId:        employeeId  || null,
      type,
      severity:          severity    || 'low',
      description,
      location:          location    || null,
      occurredAt:        new Date(occurredAt),
      status:            'open',
      correctiveActions: [],
    }).returning()

    // In-app notifications (fire-and-forget)
    ;(async () => {
      try {
        // Notify WHS/operations team
        const isCritical = record.severity === 'critical' || record.severity === 'high'
        notifyRole(session.tenantId, ['director', 'hr_officer', 'operations_manager'], {
          type:  'compliance',
          title: isCritical
            ? `🚨 ${record.severity?.toUpperCase()} incident reported — ${record.type}`
            : `WHS incident reported — ${record.type}`,
          body:  `${record.location ? `Location: ${record.location}. ` : ''}${record.description.slice(0, 100)}${record.description.length > 100 ? '…' : ''}`,
          link:  '/tenant/whs',
        })

        // Notify involved employee (if named)
        if (employeeId) {
          const [empRow] = await db
            .select({ userId: employees.userId })
            .from(employees)
            .where(eq(employees.id, employeeId))
            .limit(1)
          if (empRow?.userId) {
            notify(session.tenantId, empRow.userId, {
              type:  'compliance',
              title: 'WHS incident lodged for you',
              body:  'An incident report involving you has been submitted and is under review.',
              link:  '/tenant/whs',
            })
          }
        }

        // Email notification
        const ctx = await getTenantEmailCtx(session.tenantId)
        if (ctx.notify.emailWhs) {
          const whsEmails = await getTenantRoleEmails(session.tenantId, ['director', 'hr_officer', 'operations_manager'])
          if (whsEmails.length) {
            const [reporter] = await db.select({ firstName: employees.firstName, lastName: employees.lastName })
              .from(employees).where(eq(employees.id, record.reportedBy!))
            fireEmail(ctx, { to: whsEmails, ...whsIncidentReportedEmail({
              recipientName: 'WHS Team', orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
              incidentType: record.type, severity: record.severity ?? 'unknown', location: record.location ?? 'Not specified',
              occurredAt: record.occurredAt?.toString() ?? new Date().toISOString(),
              reportedByName: reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown',
              loginUrl: ctx.loginUrl,
            }) })
          }
        }
      } catch (emailErr) { console.error('WHS notification error:', emailErr) }
    })()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/whs', err)
    return NextResponse.json({ error: 'Failed to report incident' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('whs:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, severity, correctiveActions } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (status            !== undefined) updates.status            = status
    if (severity          !== undefined) updates.severity          = severity
    if (correctiveActions !== undefined) updates.correctiveActions = correctiveActions
    if (status === 'closed') updates.closedAt = new Date()

    const [updated] = await db
      .update(whsIncidents)
      .set(updates)
      .where(and(eq(whsIncidents.id, id), eq(whsIncidents.tenantId, session.tenantId)))
      .returning()

    // In-app notifications on status or severity changes
    if (status || severity) {
      ;(async () => {
        try {
          if (status === 'closed' && updated?.employeeId) {
            const [empRow] = await db
              .select({ userId: employees.userId })
              .from(employees)
              .where(eq(employees.id, updated.employeeId))
              .limit(1)
            if (empRow?.userId) {
              notify(session.tenantId, empRow.userId, {
                type:  'compliance',
                title: 'WHS incident closed',
                body:  'The incident report involving you has been closed.',
                link:  '/tenant/whs',
              })
            }
          }

          if (severity === 'critical' || severity === 'high') {
            notifyRole(session.tenantId, ['director', 'hr_officer', 'operations_manager'], {
              type:  'compliance',
              title: `⚠️ WHS incident escalated to ${severity}`,
              body:  `Incident #${id.slice(0, 8)} severity upgraded — immediate review required.`,
              link:  '/tenant/whs',
            })
          }
        } catch (err) { console.error('WHS PATCH notification error:', err) }
      })()
    }

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/whs', err)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
