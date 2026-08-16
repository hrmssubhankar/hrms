/**
 * GET  /api/tenant/ndis-audits  — list audits (filtered by status, auditType, result)
 * POST /api/tenant/ndis-audits  — create a new audit entry
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisAudits } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('ndis_audits:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const auditType = searchParams.get('auditType')
  const result    = searchParams.get('result')

  const conditions: any[] = [eq(ndisAudits.tenantId, tenantId)]
  if (status)    conditions.push(eq(ndisAudits.status, status))
  if (auditType) conditions.push(eq(ndisAudits.auditType, auditType))
  if (result)    conditions.push(eq(ndisAudits.result, result))

  const rows = await db
    .select()
    .from(ndisAudits)
    .where(and(...conditions))
    .orderBy(desc(ndisAudits.scheduledDate))

  return NextResponse.json({ audits: rows, total: rows.length })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('ndis_audits:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()

  const {
    title, auditType, standard, outcomeGroup, status,
    riskRating, scheduledDate, completedDate, nextReviewDate,
    auditorName, auditorOrg, findingSummary, correctiveActions,
    evidenceUrl, notes, assignedTo,
  } = body

  if (!title || !auditType || !standard || !scheduledDate) {
    return NextResponse.json(
      { error: 'title, auditType, standard, and scheduledDate are required' },
      { status: 400 },
    )
  }

  const [created] = await db
    .insert(ndisAudits)
    .values({
      tenantId,
      title,
      auditType,
      standard,
      outcomeGroup:      outcomeGroup ?? null,
      status:            status ?? 'scheduled',
      riskRating:        riskRating ?? null,
      scheduledDate,
      completedDate:     completedDate ?? null,
      nextReviewDate:    nextReviewDate ?? null,
      auditorName:       auditorName ?? null,
      auditorOrg:        auditorOrg ?? null,
      findingSummary:    findingSummary ?? null,
      correctiveActions: correctiveActions ?? null,
      evidenceUrl:       evidenceUrl ?? null,
      notes:             notes ?? null,
      assignedTo:        assignedTo ?? null,
      createdBy:         email,
    })
    .returning()

  return NextResponse.json({ audit: created }, { status: 201 })
}
