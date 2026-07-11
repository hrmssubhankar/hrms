import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { competencies, competencyAssessments, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

// GET — list competencies + optionally their assessments
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const includeAssessments = searchParams.get('assessments') === '1'
    const employeeId         = searchParams.get('employeeId')
    const competencyId       = searchParams.get('competencyId')

    const comps = await db
      .select()
      .from(competencies)
      .where(and(eq(competencies.tenantId, session.tenantId), eq(competencies.isActive, true)))
      .orderBy(competencies.category, competencies.name)

    if (!includeAssessments) return NextResponse.json({ competencies: comps })

    const conditions = [eq(competencyAssessments.tenantId, session.tenantId)]
    if (employeeId)   conditions.push(eq(competencyAssessments.employeeId, employeeId))
    if (competencyId) conditions.push(eq(competencyAssessments.competencyId, competencyId))

    const assessorEmp = { id: employees.id, firstName: employees.firstName, lastName: employees.lastName }

    const assessments = await db
      .select({
        id:           competencyAssessments.id,
        employeeId:   competencyAssessments.employeeId,
        competencyId: competencyAssessments.competencyId,
        assessorId:   competencyAssessments.assessorId,
        outcome:      competencyAssessments.outcome,
        assessedAt:   competencyAssessments.assessedAt,
        expiryDate:   competencyAssessments.expiryDate,
        evidence:     competencyAssessments.evidence,
        notes:        competencyAssessments.notes,
        createdAt:    competencyAssessments.createdAt,
        assessorFirstName: employees.firstName,
        assessorLastName:  employees.lastName,
      })
      .from(competencyAssessments)
      .leftJoin(employees, eq(competencyAssessments.assessorId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(competencyAssessments.createdAt))

    // Stats across all assessments for this tenant
    const all = await db
      .select({ outcome: competencyAssessments.outcome, expiryDate: competencyAssessments.expiryDate })
      .from(competencyAssessments)
      .where(eq(competencyAssessments.tenantId, session.tenantId))

    const today = new Date().toISOString().split('T')[0]
    const stats = {
      total:          all.length,
      competent:      all.filter(a => a.outcome === 'competent').length,
      notYet:         all.filter(a => a.outcome === 'not_yet_competent').length,
      expiringSoon:   all.filter(a => a.expiryDate && a.expiryDate > today && a.expiryDate <= new Date(Date.now() + 30*864e5).toISOString().split('T')[0]).length,
      expired:        all.filter(a => a.expiryDate && a.expiryDate < today).length,
    }

    return NextResponse.json({ competencies: comps, assessments, stats })
  } catch (err) {
    console.error('GET /api/tenant/competency', err)
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }
}

// POST — create competency OR assessment
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // If employeeId present → assessment; otherwise → competency definition
    if (body.employeeId) {
      const { employeeId, competencyId, assessorId, outcome, assessedAt, expiryDate, evidence, notes } = body
      if (!employeeId || !competencyId) {
        return NextResponse.json({ error: 'employeeId and competencyId required' }, { status: 400 })
      }
      const [record] = await db.insert(competencyAssessments).values({
        tenantId:     session.tenantId,
        employeeId,
        competencyId,
        assessorId:   assessorId   || null,
        outcome:      outcome      || null,
        assessedAt:   assessedAt   ? new Date(assessedAt) : null,
        expiryDate:   expiryDate   || null,
        evidence:     evidence     || null,
        notes:        notes        || null,
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    const { name, description, category } = body
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const [record] = await db.insert(competencies).values({
      tenantId: session.tenantId, name, description: description || null, category: category || null,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/competency', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// PATCH — update assessment
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, outcome, evidence, notes, expiryDate, assessedAt } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (outcome    !== undefined) updates.outcome    = outcome
    if (evidence   !== undefined) updates.evidence   = evidence
    if (notes      !== undefined) updates.notes      = notes
    if (expiryDate !== undefined) updates.expiryDate = expiryDate
    if (assessedAt !== undefined) updates.assessedAt = assessedAt ? new Date(assessedAt) : null

    const [updated] = await db
      .update(competencyAssessments).set(updates)
      .where(and(eq(competencyAssessments.id, id), eq(competencyAssessments.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/competency', err)
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 })
  }
}
