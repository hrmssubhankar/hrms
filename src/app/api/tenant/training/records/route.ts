import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trainingRecords, courses, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const courseId   = searchParams.get('courseId')
    const employeeId = searchParams.get('employeeId')
    const status     = searchParams.get('status')
    const search     = searchParams.get('search') ?? ''

    const conditions = [eq(trainingRecords.tenantId, session.tenantId)]
    if (courseId)   conditions.push(eq(trainingRecords.courseId, courseId))
    if (employeeId) conditions.push(eq(trainingRecords.employeeId, employeeId))
    if (status)     conditions.push(eq(trainingRecords.status, status))

    const records = await db
      .select({
        id:             trainingRecords.id,
        employeeId:     trainingRecords.employeeId,
        courseId:       trainingRecords.courseId,
        status:         trainingRecords.status,
        completedAt:    trainingRecords.completedAt,
        expiryDate:     trainingRecords.expiryDate,
        score:          trainingRecords.score,
        attempts:       trainingRecords.attempts,
        certificateUrl: trainingRecords.certificateUrl,
        createdAt:      trainingRecords.createdAt,
        courseTitle:      courses.title,
        courseCategory:   courses.category,
        courseMandatory:  courses.isMandatory,
        courseValidity:   courses.validityMonths,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
        employeeEmail:     employees.email,
      })
      .from(trainingRecords)
      .leftJoin(courses,   eq(trainingRecords.courseId,   courses.id))
      .leftJoin(employees, eq(trainingRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(trainingRecords.createdAt))

    const filtered = search
      ? records.filter(r =>
          `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (r.courseTitle ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : records

    // Stats
    const all = await db
      .select({ status: trainingRecords.status })
      .from(trainingRecords)
      .where(eq(trainingRecords.tenantId, session.tenantId))

    const today = new Date()
    const in30  = new Date(today.getTime() + 30 * 86400000)
    const expiring = records.filter(r => {
      if (!r.expiryDate) return false
      const d = new Date(r.expiryDate)
      return d > today && d <= in30
    }).length

    const stats = {
      total:     all.length,
      enrolled:  all.filter(r => r.status === 'enrolled').length,
      completed: all.filter(r => r.status === 'completed').length,
      overdue:   all.filter(r => r.status === 'overdue').length,
      expiring,
    }

    return NextResponse.json({ records: filtered, stats })
  } catch (err) {
    console.error('GET /api/tenant/training/records', err)
    return NextResponse.json({ error: 'Failed to fetch training records' }, { status: 500 })
  }
}

// Enrol employee(s) in a course
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { employeeId, courseId, employeeIds } = body

    if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

    // Support single or bulk enrolment
    const ids: string[] = employeeIds ?? (employeeId ? [employeeId] : [])
    if (!ids.length) return NextResponse.json({ error: 'employeeId or employeeIds required' }, { status: 400 })

    // Get course for validity
    const [course] = await db.select().from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.tenantId, session.tenantId)))
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const inserted = await db.insert(trainingRecords).values(
      ids.map(eid => ({
        tenantId:   session.tenantId!,
        employeeId: eid,
        courseId,
        status:     'enrolled' as const,
        attempts:   0,
      }))
    ).returning()

    return NextResponse.json({ records: inserted }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/training/records', err)
    return NextResponse.json({ error: 'Failed to enrol' }, { status: 500 })
  }
}

// Mark complete / update status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, status, score, certificateUrl } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Fetch record to get courseId for expiry calc
    const [existing] = await db.select().from(trainingRecords)
      .where(and(eq(trainingRecords.id, id), eq(trainingRecords.tenantId, session.tenantId)))
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Record<string, any> = { attempts: (existing.attempts ?? 0) + 1 }
    if (status !== undefined) updates.status = status
    if (score  !== undefined) updates.score  = score
    if (certificateUrl !== undefined) updates.certificateUrl = certificateUrl

    if (status === 'completed') {
      updates.completedAt = new Date()
      // Calculate expiry from course validity
      const [course] = await db.select({ validityMonths: courses.validityMonths })
        .from(courses).where(eq(courses.id, existing.courseId))
      if (course?.validityMonths) {
        const exp = new Date()
        exp.setMonth(exp.getMonth() + course.validityMonths)
        updates.expiryDate = exp.toISOString().split('T')[0]
      }
    }

    const [updated] = await db
      .update(trainingRecords)
      .set(updates)
      .where(and(eq(trainingRecords.id, id), eq(trainingRecords.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/training/records', err)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}
