import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobRequisitions, candidates, applications, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

// GET — list requisitions with application counts, or candidates for a requisition
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const view         = searchParams.get('view') ?? 'requisitions' // requisitions | candidates | applications
    const requisitionId = searchParams.get('requisitionId')
    const status        = searchParams.get('status')

    if (view === 'candidates') {
      const rows = await db.select().from(candidates)
        .where(eq(candidates.tenantId, session.tenantId))
        .orderBy(desc(candidates.createdAt))
      return NextResponse.json({ candidates: rows })
    }

    if (view === 'applications') {
      const conditions = [eq(applications.tenantId, session.tenantId)]
      if (requisitionId) conditions.push(eq(applications.requisitionId, requisitionId))
      if (status)        conditions.push(eq(applications.status, status))
      const rows = await db
        .select({
          id:             applications.id,
          requisitionId:  applications.requisitionId,
          candidateId:    applications.candidateId,
          status:         applications.status,
          interviewScore: applications.interviewScore,
          notes:          applications.notes,
          createdAt:      applications.createdAt,
          updatedAt:      applications.updatedAt,
          candidateFirstName: candidates.firstName,
          candidateLastName:  candidates.lastName,
          candidateEmail:     candidates.email,
          candidateSource:    candidates.source,
        })
        .from(applications)
        .leftJoin(candidates, eq(applications.candidateId, candidates.id))
        .where(and(...conditions))
        .orderBy(desc(applications.createdAt))
      return NextResponse.json({ applications: rows })
    }

    // Default: requisitions
    const conditions = [eq(jobRequisitions.tenantId, session.tenantId)]
    if (status) conditions.push(eq(jobRequisitions.status, status))

    const reqs = await db.select().from(jobRequisitions)
      .where(and(...conditions)).orderBy(desc(jobRequisitions.createdAt))

    const allApps = await db.select({
      requisitionId: applications.requisitionId,
      status:        applications.status,
    }).from(applications).where(eq(applications.tenantId, session.tenantId))

    const reqsWithCounts = reqs.map(r => ({
      ...r,
      applicationCount: allApps.filter(a => a.requisitionId === r.id).length,
      hiredCount:       allApps.filter(a => a.requisitionId === r.id && a.status === 'hired').length,
    }))

    const stats = {
      total:       reqs.length,
      open:        reqs.filter(r => r.status === 'open').length,
      draft:       reqs.filter(r => r.status === 'draft').length,
      closed:      reqs.filter(r => r.status === 'closed').length,
      totalApps:   allApps.length,
      hired:       allApps.filter(a => a.status === 'hired').length,
    }

    return NextResponse.json({ requisitions: reqsWithCounts, stats })
  } catch (err) {
    console.error('GET /api/tenant/recruitment', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST — create requisition, candidate, or application
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Candidate
    if (body._type === 'candidate') {
      const { firstName, lastName, email, phone, resumeUrl, source } = body
      if (!firstName || !lastName || !email) return NextResponse.json({ error: 'firstName, lastName, email required' }, { status: 400 })
      const [record] = await db.insert(candidates).values({
        tenantId: session.tenantId, firstName, lastName, email,
        phone: phone || null, resumeUrl: resumeUrl || null, source: source || null,
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    // Application
    if (body._type === 'application') {
      const { requisitionId, candidateId, notes } = body
      if (!requisitionId || !candidateId) return NextResponse.json({ error: 'requisitionId and candidateId required' }, { status: 400 })
      const [record] = await db.insert(applications).values({
        tenantId: session.tenantId, requisitionId, candidateId,
        status: 'received', notes: notes || null,
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    // Requisition (default)
    const { title, description, positionId, requestedBy } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const [record] = await db.insert(jobRequisitions).values({
      tenantId: session.tenantId, title,
      description: description || null, positionId: positionId || null,
      requestedBy: requestedBy || null, status: 'draft',
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/recruitment', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// PATCH — update requisition or application status/notes
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, _type = 'requisition', status, notes, interviewScore, approvedBy } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    if (_type === 'application') {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (status        !== undefined) updates.status        = status
      if (notes         !== undefined) updates.notes         = notes
      if (interviewScore !== undefined) updates.interviewScore = interviewScore
      const [updated] = await db.update(applications).set(updates)
        .where(and(eq(applications.id, id), eq(applications.tenantId, session.tenantId))).returning()
      return NextResponse.json({ record: updated })
    }

    // Requisition
    const updates: Record<string, unknown> = {}
    if (status     !== undefined) updates.status     = status
    if (approvedBy !== undefined) { updates.approvedBy = approvedBy; updates.approvedAt = new Date() }
    if (status === 'closed')       updates.closedAt   = new Date()
    const [updated] = await db.update(jobRequisitions).set(updates)
      .where(and(eq(jobRequisitions.id, id), eq(jobRequisitions.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/recruitment', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
