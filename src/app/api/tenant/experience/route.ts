import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeExperience, employees } from '@/lib/db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// GET — list all experience records for this tenant
export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? ''
  const employmentType = searchParams.get('employmentType') ?? ''

  try {
    const rows = await db
      .select({
        id:               employeeExperience.id,
        employeeId:       employeeExperience.employeeId,
        companyName:      employeeExperience.companyName,
        jobTitle:         employeeExperience.jobTitle,
        employmentType:   employeeExperience.employmentType,
        startDate:        employeeExperience.startDate,
        endDate:          employeeExperience.endDate,
        isCurrent:        employeeExperience.isCurrent,
        location:         employeeExperience.location,
        description:      employeeExperience.description,
        reasonForLeaving: employeeExperience.reasonForLeaving,
        createdAt:        employeeExperience.createdAt,
        firstName:        employees.firstName,
        lastName:         employees.lastName,
      })
      .from(employeeExperience)
      .innerJoin(employees, eq(employeeExperience.employeeId, employees.id))
      .where(eq(employeeExperience.tenantId, session.tenantId))
      .orderBy(desc(employeeExperience.startDate))

    let results = rows

    if (search) {
      const q = search.toLowerCase()
      results = results.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q)
      )
    }

    if (employmentType) {
      results = results.filter(r => r.employmentType === employmentType)
    }

    return NextResponse.json({ experience: results })
  } catch (err) {
    console.error('Experience GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST — create a new experience record
export async function POST(req: NextRequest) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { employeeId, companyName, jobTitle, employmentType, startDate, endDate, isCurrent, location, description, reasonForLeaving } = body

    if (!employeeId || !companyName || !jobTitle || !startDate) {
      return NextResponse.json({ error: 'employeeId, companyName, jobTitle, and startDate are required' }, { status: 400 })
    }

    const [created] = await db.insert(employeeExperience).values({
      tenantId:         session.tenantId,
      employeeId,
      companyName,
      jobTitle,
      employmentType:   employmentType ?? 'full_time',
      startDate,
      endDate:          endDate || null,
      isCurrent:        isCurrent ?? false,
      location:         location || null,
      description:      description || null,
      reasonForLeaving: reasonForLeaving || null,
    }).returning()

    return NextResponse.json({ record: created }, { status: 201 })
  } catch (err) {
    console.error('Experience POST error:', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
