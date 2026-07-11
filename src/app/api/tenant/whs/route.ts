import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { whsIncidents, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

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

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/whs', err)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
