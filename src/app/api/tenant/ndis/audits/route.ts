/**
 * GET  /api/tenant/ndis/audits   — list audits
 * POST /api/tenant/ndis/audits   — create audit
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisAudits } from '@/lib/db/schema'
import { eq, and, desc, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('ndis_audits:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const search  = searchParams.get('search') ?? ''
  const status  = searchParams.get('status') ?? ''
  const type    = searchParams.get('type') ?? ''
  const limit   = Math.min(Number(searchParams.get('limit') ?? 50), 200)

  const conditions = [eq(ndisAudits.tenantId, tenantId)]
  if (status) conditions.push(eq(ndisAudits.status, status))
  if (type)   conditions.push(eq(ndisAudits.auditType, type))
  if (search) {
    conditions.push(
      or(
        ilike(ndisAudits.title, `%${search}%`),
        ilike(ndisAudits.standard, `%${search}%`),
        ilike(ndisAudits.auditorName, `%${search}%`),
      )!
    )
  }

  const audits = await db
    .select()
    .from(ndisAudits)
    .where(and(...conditions))
    .orderBy(desc(ndisAudits.scheduledDate))
    .limit(limit)

  return NextResponse.json({ audits })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()
  const {
    title, auditType, standard, outcomeGroup, status, result, riskRating,
    scheduledDate, completedDate, nextReviewDate, auditorName, auditorOrg,
    findingSummary, correctiveActions, evidenceUrl, notes, assignedTo,
  } = body

  if (!title || !auditType || !standard || !scheduledDate) {
    return NextResponse.json({ error: 'title, auditType, standard, scheduledDate are required' }, { status: 400 })
  }

  const [audit] = await db.insert(ndisAudits).values({
    tenantId,
    title,
    auditType,
    standard,
    outcomeGroup: outcomeGroup || null,
    status: status || 'scheduled',
    result: result || null,
    riskRating: riskRating || null,
    scheduledDate,
    completedDate: completedDate || null,
    nextReviewDate: nextReviewDate || null,
    auditorName: auditorName || null,
    auditorOrg: auditorOrg || null,
    findingSummary: findingSummary || null,
    correctiveActions: correctiveActions || null,
    evidenceUrl: evidenceUrl || null,
    notes: notes || null,
    assignedTo: assignedTo || null,
    createdBy: email,
  }).returning()

  return NextResponse.json({ audit }, { status: 201 })
}
