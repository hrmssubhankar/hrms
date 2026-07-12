import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { separationRecords, employees } from '@/lib/db/schema'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { separationInitiatedEmail } from '@/lib/email/templates'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('separation:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const type   = searchParams.get('type')
    const search = searchParams.get('search') ?? ''

    const conditions = [eq(separationRecords.tenantId, session.tenantId)]
    if (status) conditions.push(eq(separationRecords.status, status))
    if (type)   conditions.push(eq(separationRecords.type, type))

    const records = await db
      .select({
        id:                    separationRecords.id,
        employeeId:            separationRecords.employeeId,
        type:                  separationRecords.type,
        reason:                separationRecords.reason,
        noticeDate:            separationRecords.noticeDate,
        lastWorkingDay:        separationRecords.lastWorkingDay,
        exitInterviewAt:       separationRecords.exitInterviewAt,
        exitInterviewNotes:    separationRecords.exitInterviewNotes,
        checklistComplete:     separationRecords.checklistComplete,
        assetsReturned:        separationRecords.assetsReturned,
        systemAccessRevoked:   separationRecords.systemAccessRevoked,
        status:                separationRecords.status,
        createdAt:             separationRecords.createdAt,
        employeeFirstName:     employees.firstName,
        employeeLastName:      employees.lastName,
        employeeEmail:         employees.email,
        employeeStartDate:     employees.startDate,
        employeeEntityName:    employees.entityName,
      })
      .from(separationRecords)
      .leftJoin(employees, eq(separationRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(separationRecords.createdAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase())
        )
      : records

    const all = await db
      .select({ status: separationRecords.status, type: separationRecords.type })
      .from(separationRecords)
      .where(eq(separationRecords.tenantId, session.tenantId))

    const stats = {
      total:     all.length,
      pending:   all.filter(r => r.status === 'pending').length,
      active:    all.filter(r => r.status === 'active').length,
      completed: all.filter(r => r.status === 'completed').length,
      resignation:  all.filter(r => r.type === 'resignation').length,
      termination:  all.filter(r => r.type === 'termination').length,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/separation', err)
    return NextResponse.json({ error: 'Failed to fetch separation records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('separation:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { employeeId, type, reason, noticeDate, lastWorkingDay } = body

    if (!employeeId || !type) {
      return NextResponse.json({ error: 'employeeId and type are required' }, { status: 400 })
    }

    const [record] = await db.insert(separationRecords).values({
      tenantId:       session.tenantId,
      employeeId,
      type,
      reason:         reason        || null,
      noticeDate:     noticeDate    || null,
      lastWorkingDay: lastWorkingDay || null,
      checklistComplete:   false,
      assetsReturned:      false,
      systemAccessRevoked: false,
      status: 'pending',
    }).returning()

    // Email the departing employee
    try {
      const ctx = await getTenantEmailCtx(session.tenantId)
      if (ctx.notify.emailSeparation) {
        const [emp] = await db.select({ firstName: employees.firstName, email: employees.email })
          .from(employees).where(eq(employees.id, record.employeeId))
        if (emp?.email) {
          fireEmail(ctx, { to: emp.email, ...separationInitiatedEmail({
            recipientName: emp.firstName, orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
            separationType: record.type, lastWorkingDay: record.lastWorkingDay ?? 'TBD', loginUrl: ctx.loginUrl,
          }) })
        }
      }
    } catch (emailErr) { console.error('Separation email error:', emailErr) }

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/separation', err)
    return NextResponse.json({ error: 'Failed to create separation record' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('separation:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, assetsReturned, systemAccessRevoked, exitInterviewAt,
            exitInterviewNotes, lastWorkingDay, reason } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (status              !== undefined) updates.status              = status
    if (assetsReturned      !== undefined) updates.assetsReturned      = assetsReturned
    if (systemAccessRevoked !== undefined) updates.systemAccessRevoked = systemAccessRevoked
    if (exitInterviewAt     !== undefined) updates.exitInterviewAt     = exitInterviewAt ? new Date(exitInterviewAt) : null
    if (exitInterviewNotes  !== undefined) updates.exitInterviewNotes  = exitInterviewNotes
    if (lastWorkingDay      !== undefined) updates.lastWorkingDay      = lastWorkingDay
    if (reason              !== undefined) updates.reason              = reason

    // Auto-complete when all checklist items done
    if (updates.assetsReturned !== undefined || updates.systemAccessRevoked !== undefined) {
      const [existing] = await db.select().from(separationRecords)
        .where(and(eq(separationRecords.id, id), eq(separationRecords.tenantId, session.tenantId)))
      if (existing) {
        const assets  = updates.assetsReturned      ?? existing.assetsReturned
        const access  = updates.systemAccessRevoked ?? existing.systemAccessRevoked
        updates.checklistComplete = assets && access
        if (updates.checklistComplete) updates.status = 'completed'
      }
    }

    const [updated] = await db
      .update(separationRecords)
      .set(updates)
      .where(and(eq(separationRecords.id, id), eq(separationRecords.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/separation', err)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}
