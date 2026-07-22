import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { competencies, competencyAssessments, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('performance:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')
  const view = searchParams.get('view') // 'library' | 'assessments'

  if (view === 'library' || !employeeId) {
    // Return competency library
    const lib = await db
      .select()
      .from(competencies)
      .where(eq(competencies.tenantId, session.tenantId))
      .orderBy(competencies.category, competencies.name)
    return NextResponse.json({ competencies: lib })
  }

  // Return assessments for a specific employee
  const assessments = await db
    .select({
      id:            competencyAssessments.id,
      employeeId:    competencyAssessments.employeeId,
      competencyId:  competencyAssessments.competencyId,
      outcome:       competencyAssessments.outcome,
      assessedAt:    competencyAssessments.assessedAt,
      expiryDate:    competencyAssessments.expiryDate,
      evidence:      competencyAssessments.evidence,
      notes:         competencyAssessments.notes,
      createdAt:     competencyAssessments.createdAt,
      competencyName:     competencies.name,
      competencyCategory: competencies.category,
    })
    .from(competencyAssessments)
    .leftJoin(competencies, eq(competencies.id, competencyAssessments.competencyId))
    .where(and(
      eq(competencyAssessments.tenantId, session.tenantId),
      eq(competencyAssessments.employeeId, employeeId),
    ))
    .orderBy(desc(competencyAssessments.assessedAt))

  return NextResponse.json({ assessments })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('performance:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()

  // Create a competency in the library
  if (body._type === 'competency') {
    const { name, description, category } = body
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const [comp] = await db.insert(competencies).values({
      tenantId: session.tenantId, name, description: description ?? null, category: category ?? null,
    }).returning()
    return NextResponse.json({ competency: comp }, { status: 201 })
  }

  // Create an assessment
  const { employeeId, competencyId, outcome, assessedAt, expiryDate, evidence, notes } = body
  if (!employeeId || !competencyId) {
    return NextResponse.json({ error: 'employeeId and competencyId required' }, { status: 400 })
  }

  const [emp] = await db.select({ id: employees.id }).from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, session.tenantId)))
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const [assessment] = await db.insert(competencyAssessments).values({
    tenantId:     session.tenantId,
    employeeId,
    competencyId,
    outcome:      outcome ?? null,
    assessedAt:   assessedAt ? new Date(assessedAt) : null,
    expiryDate:   expiryDate ?? null,
    evidence:     evidence ?? null,
    notes:        notes ?? null,
  }).returning()

  return NextResponse.json({ assessment }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('performance:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { id, outcome, assessedAt, expiryDate, evidence, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (outcome    !== undefined) updates.outcome    = outcome
  if (assessedAt !== undefined) updates.assessedAt = assessedAt ? new Date(assessedAt) : null
  if (expiryDate !== undefined) updates.expiryDate = expiryDate
  if (evidence   !== undefined) updates.evidence   = evidence
  if (notes      !== undefined) updates.notes      = notes

  const [updated] = await db
    .update(competencyAssessments).set(updates)
    .where(and(eq(competencyAssessments.id, id), eq(competencyAssessments.tenantId, session.tenantId)))
    .returning()

  return NextResponse.json({ assessment: updated })
}
