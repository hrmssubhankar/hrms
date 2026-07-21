import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { offerLetters, offerLetterEvents, employees } from '@/lib/db/schema'
import { eq, and, desc, or, ilike } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/tenant/offer-letters?status=&search=
export async function GET(req: NextRequest) {
  const guard = await apiGuard('contracts:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  const conditions = [eq(offerLetters.tenantId, session.tenantId)]
  if (status) conditions.push(eq(offerLetters.status, status))

  let rows = await db
    .select({
      id:              offerLetters.id,
      candidateName:   offerLetters.candidateName,
      candidateEmail:  offerLetters.candidateEmail,
      position:        offerLetters.position,
      department:      offerLetters.department,
      employmentType:  offerLetters.employmentType,
      startDate:       offerLetters.startDate,
      salaryAmount:    offerLetters.salaryAmount,
      salaryCycle:     offerLetters.salaryCycle,
      status:          offerLetters.status,
      sentAt:          offerLetters.sentAt,
      acceptedAt:      offerLetters.acceptedAt,
      rejectedAt:      offerLetters.rejectedAt,
      expiresAt:       offerLetters.expiresAt,
      pdfUrl:          offerLetters.pdfUrl,
      notes:           offerLetters.notes,
      createdBy:       offerLetters.createdBy,
      createdAt:       offerLetters.createdAt,
      updatedAt:       offerLetters.updatedAt,
    })
    .from(offerLetters)
    .where(and(...conditions))
    .orderBy(desc(offerLetters.createdAt))

  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter(r =>
      r.candidateName.toLowerCase().includes(q) ||
      r.candidateEmail.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q)
    )
  }

  const stats = {
    total:    rows.length,
    draft:    rows.filter(r => r.status === 'draft').length,
    sent:     rows.filter(r => r.status === 'sent').length,
    accepted: rows.filter(r => r.status === 'accepted').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
    expired:  rows.filter(r => r.status === 'expired').length,
  }

  return NextResponse.json({ offers: rows, stats })
}

// POST /api/tenant/offer-letters
export async function POST(req: NextRequest) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const {
    candidateName, candidateEmail, position, department,
    employmentType = 'full_time', startDate, salaryAmount,
    salaryCycle = 'annual', templateContent, notes,
    expiresAt, recruitmentId, employeeId,
  } = body

  if (!candidateName || !candidateEmail || !position) {
    return NextResponse.json({ error: 'candidateName, candidateEmail and position are required' }, { status: 400 })
  }

  const acceptanceToken = randomUUID()

  const [offer] = await db.insert(offerLetters).values({
    tenantId:        session.tenantId,
    candidateName:   candidateName.trim(),
    candidateEmail:  candidateEmail.toLowerCase().trim(),
    position:        position.trim(),
    department:      department || null,
    employmentType,
    startDate:       startDate || null,
    salaryAmount:    salaryAmount ? Number(salaryAmount) : null,
    salaryCycle,
    templateContent: templateContent || null,
    notes:           notes || null,
    expiresAt:       expiresAt ? new Date(expiresAt) : null,
    recruitmentId:   recruitmentId || null,
    employeeId:      employeeId || null,
    acceptanceToken,
    createdBy:       session.email,
    status:          'draft',
  }).returning()

  // Log creation event
  await db.insert(offerLetterEvents).values({
    tenantId:    session.tenantId,
    offerId:     offer.id,
    event:       'created',
    note:        `Offer letter created for ${candidateName} — ${position}`,
    performedBy: session.email,
  })

  return NextResponse.json({ offer }, { status: 201 })
}
