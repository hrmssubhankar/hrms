import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { grievances, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('grievances:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const type       = searchParams.get('type')
    const riskRating = searchParams.get('riskRating')

    const conditions = [eq(grievances.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(grievances.status, status))
    if (type)       conditions.push(eq(grievances.type, type))
    if (riskRating) conditions.push(eq(grievances.riskRating, riskRating))

    const records = await db
      .select({
        id:          grievances.id,
        lodgedBy:    grievances.lodgedBy,
        subjectId:   grievances.subjectId,
        type:        grievances.type,
        isAnonymous: grievances.isAnonymous,
        riskRating:  grievances.riskRating,
        description: grievances.description,
        status:      grievances.status,
        assignedTo:  grievances.assignedTo,
        outcome:     grievances.outcome,
        closedAt:    grievances.closedAt,
        createdAt:   grievances.createdAt,
        updatedAt:   grievances.updatedAt,
        // Subject employee
        subjectFirstName: employees.firstName,
        subjectLastName:  employees.lastName,
        subjectEmail:     employees.email,
      })
      .from(grievances)
      .leftJoin(employees, eq(grievances.subjectId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(grievances.createdAt))

    const all = await db
      .select({ status: grievances.status, riskRating: grievances.riskRating })
      .from(grievances)
      .where(eq(grievances.tenantId, session.tenantId))

    const stats = {
      total:    all.length,
      new:      all.filter(r => r.status === 'new').length,
      active:   all.filter(r => !['new', 'closed'].includes(r.status)).length,
      closed:   all.filter(r => r.status === 'closed').length,
      critical: all.filter(r => r.riskRating === 'critical').length,
      high:     all.filter(r => r.riskRating === 'high').length,
    }

    return NextResponse.json({ records, stats })
  } catch (err) {
    console.error('GET /api/tenant/grievances', err)
    return NextResponse.json({ error: 'Failed to fetch grievances' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('grievances:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { lodgedBy, subjectId, type, isAnonymous, riskRating, description } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'type and description are required' }, { status: 400 })
    }

    const [record] = await db.insert(grievances).values({
      tenantId:    session.tenantId,
      lodgedBy:    isAnonymous ? null : (lodgedBy || null),
      subjectId:   subjectId  || null,
      type,
      isAnonymous: isAnonymous ?? false,
      riskRating:  riskRating  || 'medium',
      description,
      status:      'new',
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/grievances', err)
    return NextResponse.json({ error: 'Failed to lodge grievance' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('grievances:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, riskRating, assignedTo, outcome } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (status     !== undefined) updates.status     = status
    if (riskRating !== undefined) updates.riskRating = riskRating
    if (assignedTo !== undefined) updates.assignedTo = assignedTo
    if (outcome    !== undefined) updates.outcome    = outcome
    if (status === 'closed') updates.closedAt = new Date()

    const [updated] = await db
      .update(grievances)
      .set(updates)
      .where(and(eq(grievances.id, id), eq(grievances.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/grievances', err)
    return NextResponse.json({ error: 'Failed to update grievance' }, { status: 500 })
  }
}
