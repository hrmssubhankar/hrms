import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { salaryReviews, employees } from '@/lib/db/schema'
import { eq, and, desc, ilike, or, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/tenant/salary-reviews
export async function GET(req: NextRequest) {
  const { error, session } = await apiGuard('salary_review:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')
  const status = searchParams.get('status')
  const search = searchParams.get('search') ?? ''

  const rows = await db
    .select({
      review: salaryReviews,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as('employee_name'),
      employeeEmail: employees.email,
    })
    .from(salaryReviews)
    .leftJoin(employees, eq(salaryReviews.employeeId, employees.id))
    .where(and(
      eq(salaryReviews.tenantId, session.tenantId),
      employeeId ? eq(salaryReviews.employeeId, employeeId) : undefined,
      status ? eq(salaryReviews.status, status) : undefined,
      search
        ? or(
            ilike(employees.firstName, `%${search}%`),
            ilike(employees.lastName, `%${search}%`),
            ilike(employees.email, `%${search}%`),
          )
        : undefined,
    ))
    .orderBy(desc(salaryReviews.reviewDate))

  const reviews = rows.map(r => ({
    ...r.review,
    employeeName: r.employeeName,
    employeeEmail: r.employeeEmail,
  }))

  return NextResponse.json({ reviews })
}

// POST /api/tenant/salary-reviews
export async function POST(req: NextRequest) {
  const { error, session } = await apiGuard('salary_review:write')
  if (error) return error

  const body = await req.json()

  // Auto-calculate increment fields if not provided
  if (body.currentSalary && body.proposedSalary) {
    const curr = parseFloat(body.currentSalary)
    const prop = parseFloat(body.proposedSalary)
    body.incrementAmount = body.incrementAmount ?? (prop - curr).toFixed(2)
    body.incrementPercent = body.incrementPercent ?? (((prop - curr) / curr) * 100).toFixed(2)
  }

  const [review] = await db
    .insert(salaryReviews)
    .values({
      ...body,
      tenantId: session.tenantId,
      submittedBy: body.status === 'submitted' ? session.email : undefined,
      submittedAt: body.status === 'submitted' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return NextResponse.json({ review }, { status: 201 })
}
