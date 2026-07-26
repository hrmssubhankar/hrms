import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiAuth } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/my-documents
 *
 * Returns documents linked to the authenticated employee's own record.
 * Uses apiAuth() — no specific permission required beyond being logged in.
 * All results are scoped to session.sub (userId) + session.tenantId.
 *
 * Response: { documents, employeeLinked }
 */
export async function GET() {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  // Resolve employee record
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId, session.sub as string),
    ))

  if (!emp) return NextResponse.json({ documents: [], employeeLinked: false })

  const rows = await db
    .select({
      id:            documents.id,
      category:      documents.category,
      title:         documents.title,
      blobUrl:       documents.blobUrl,
      fileName:      documents.fileName,
      fileSizeBytes: documents.fileSizeBytes,
      mimeType:      documents.mimeType,
      status:        documents.status,
      expiryDate:    documents.expiryDate,
      notes:         documents.notes,
      version:       documents.version,
      createdAt:     documents.createdAt,
    })
    .from(documents)
    .where(and(
      eq(documents.tenantId, session.tenantId),
      eq(documents.employeeId, emp.id),
    ))
    .orderBy(desc(documents.createdAt))

  return NextResponse.json({ documents: rows, employeeLinked: true })
}

/**
 * POST /api/tenant/my-documents
 *
 * Employees upload their own documents for HR review.
 * Documents are created with status 'pending_review'.
 * Only the authenticated user's own employee record is used — employees
 * cannot upload documents on behalf of others.
 *
 * Body: { title, category, blobUrl, fileName, fileSizeBytes, mimeType, expiryDate, notes }
 */
export async function POST(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  // Resolve employee record
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId, session.sub as string),
    ))

  if (!emp) {
    return NextResponse.json(
      { error: 'Your account is not linked to an employee record. Contact HR.' },
      { status: 403 },
    )
  }

  const body = await req.json()
  const { title, category, blobUrl, fileName, fileSizeBytes, mimeType, expiryDate, notes } = body

  if (!title || !category || !blobUrl) {
    return NextResponse.json({ error: 'title, category, blobUrl required' }, { status: 400 })
  }

  const [record] = await db.insert(documents).values({
    tenantId:      session.tenantId,
    employeeId:    emp.id,             // always scoped to own employee
    title,
    category,
    blobUrl,
    fileName:      fileName      || null,
    fileSizeBytes: fileSizeBytes || null,
    mimeType:      mimeType      || null,
    expiryDate:    expiryDate    || null,
    notes:         notes         || null,
    uploadedBy:    session.sub   ?? null,
    status:        'pending_review',  // HR must approve before it becomes active
    version:       1,
  }).returning()

  return NextResponse.json({ record }, { status: 201 })
}

/**
 * DELETE /api/tenant/my-documents?id=
 *
 * Employees can only withdraw their own documents that are still in 'pending_review'.
 * Active / approved documents cannot be self-deleted — contact HR.
 */
export async function DELETE(req: NextRequest) {
  const guard = await apiAuth()
  if (guard.error) return guard.error
  const { session } = guard

  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.userId, session.sub as string),
    ))

  if (!emp) return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Fetch the document and verify ownership + status
  const [doc] = await db
    .select({ id: documents.id, status: documents.status, employeeId: documents.employeeId })
    .from(documents)
    .where(and(
      eq(documents.id, id),
      eq(documents.tenantId, session.tenantId),
      eq(documents.employeeId, emp.id),
    ))
    .limit(1)

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  if (doc.status !== 'pending_review') {
    return NextResponse.json(
      { error: 'Only pending_review documents can be withdrawn. Contact HR to remove active documents.' },
      { status: 403 },
    )
  }

  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.employeeId, emp.id)))

  return NextResponse.json({ ok: true })
}
