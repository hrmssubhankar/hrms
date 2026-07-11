import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { surveys, surveyResponses, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const surveyId = searchParams.get('surveyId')

    const surveyList = await db.select().from(surveys)
      .where(eq(surveys.tenantId, session.tenantId)).orderBy(desc(surveys.createdAt))

    if (surveyId) {
      const responses = await db.select({
        id: surveyResponses.id, surveyId: surveyResponses.surveyId,
        employeeId: surveyResponses.employeeId, answers: surveyResponses.answers,
        submittedAt: surveyResponses.submittedAt,
        employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
      }).from(surveyResponses)
        .leftJoin(employees, eq(surveyResponses.employeeId, employees.id))
        .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.tenantId, session.tenantId)))
        .orderBy(desc(surveyResponses.submittedAt))
      return NextResponse.json({ surveys: surveyList, responses })
    }

    return NextResponse.json({ surveys: surveyList })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()

    if (body._type === 'response') {
      const { surveyId, employeeId, answers } = body
      if (!surveyId || !answers) return NextResponse.json({ error: 'surveyId and answers required' }, { status: 400 })
      const survey = await db.select().from(surveys).where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, session.tenantId)))
      const isAnon = survey[0]?.isAnonymous ?? true
      const [record] = await db.insert(surveyResponses).values({
        tenantId: session.tenantId, surveyId,
        employeeId: isAnon ? null : (employeeId || null),
        answers,
      }).returning()
      return NextResponse.json({ record }, { status: 201 })
    }

    // Create survey
    const { title, type, isAnonymous, questions } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const [record] = await db.insert(surveys).values({
      tenantId: session.tenantId, title,
      type: type || null, isAnonymous: isAnonymous ?? true,
      questions: questions || [], isActive: true,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const [updated] = await db.update(surveys).set({ isActive })
      .where(and(eq(surveys.id, id), eq(surveys.tenantId, session.tenantId))).returning()
    return NextResponse.json({ record: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
