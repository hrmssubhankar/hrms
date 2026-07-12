import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, employees } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('documents:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const category   = searchParams.get('category')
    const status     = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')

    const expiring = searchParams.get('expiring') // '1' = expiring in 30 days

    const today = new Date().toISOString().split('T')[0]
    const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

    const conditions = [eq(documents.tenantId, session.tenantId)]
    if (category)   conditions.push(eq(documents.category, category))
    if (status)     conditions.push(eq(documents.status, status as 'active' | 'expired' | 'archived' | 'pending_review'))
    if (employeeId) conditions.push(eq(documents.employeeId, employeeId))
    if (expiring === '1') {
      conditions.push(gte(documents.expiryDate, today))
      conditions.push(lte(documents.expiryDate, in30))
    }

    const rows = await db
      .select({
        id:            documents.id,
        employeeId:    documents.employeeId,
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
        updatedAt:     documents.updatedAt,
        employeeFirstName: employees.firstName,
        employeeLastName:  employees.lastName,
      })
      .from(documents)
      .leftJoin(employees, eq(documents.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt))

    const all = await db
      .select({ status: documents.status, expiryDate: documents.expiryDate, category: documents.category })
      .from(documents)
      .where(eq(documents.tenantId, session.tenantId))

    const stats = {
      total:        all.length,
      active:       all.filter(d => d.status === 'active').length,
      expired:      all.filter(d => d.status === 'expired' || (d.expiryDate && d.expiryDate < today)).length,
      expiringSoon: all.filter(d => d.expiryDate && d.expiryDate >= today && d.expiryDate <= in30).length,
      pendingReview: all.filter(d => d.status === 'pending_review').length,
    }

    // Unique categories
    const categories = [...new Set(all.map(d => d.category))].sort()

    return NextResponse.json({ documents: rows, stats, categories })
  } catch (err) {
    console.error('GET /api/tenant/documents', err)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('documents:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { title, category, blobUrl, employeeId, fileName, fileSizeBytes, mimeType, expiryDate, notes } = body
    if (!title || !category || !blobUrl) {
      return NextResponse.json({ error: 'title, category, blobUrl required' }, { status: 400 })
    }

    const [record] = await db.insert(documents).values({
      tenantId:      session.tenantId,
      title,
      category,
      blobUrl,
      employeeId:    employeeId    || null,
      fileName:      fileName      || null,
      fileSizeBytes: fileSizeBytes || null,
      mimeType:      mimeType      || null,
      expiryDate:    expiryDate    || null,
      notes:         notes         || null,
      uploadedBy:    session.sub   ?? null,
      status:        'active',
      version:       1,
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/documents', err)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('documents:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { id, status, notes, expiryDate, title } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (status     !== undefined) updates.status     = status
    if (notes      !== undefined) updates.notes      = notes
    if (expiryDate !== undefined) updates.expiryDate = expiryDate
    if (title      !== undefined) updates.title      = title

    const [updated] = await db
      .update(documents).set(updates)
      .where(and(eq(documents.id, id), eq(documents.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/documents', err)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await apiGuard('documents:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, session.tenantId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/tenant/documents', err)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
