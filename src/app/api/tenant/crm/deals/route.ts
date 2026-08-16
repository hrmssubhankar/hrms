import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmDeals, crmAccounts, crmContacts } from '@/lib/db/schema'
import { eq, and, ilike, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const stage     = searchParams.get('stage')
  const accountId = searchParams.get('accountId')

  const conditions = [eq(crmDeals.tenantId, session.tenantId)]
  if (stage)     conditions.push(eq(crmDeals.stage, stage))
  if (accountId) conditions.push(eq(crmDeals.accountId, accountId))

  const deals = await db
    .select({
      id:          crmDeals.id,
      tenantId:    crmDeals.tenantId,
      accountId:   crmDeals.accountId,
      contactId:   crmDeals.contactId,
      title:       crmDeals.title,
      value:       crmDeals.value,
      currency:    crmDeals.currency,
      stage:       crmDeals.stage,
      probability: crmDeals.probability,
      closeDate:   crmDeals.closeDate,
      source:      crmDeals.source,
      assignedTo:  crmDeals.assignedTo,
      notes:       crmDeals.notes,
      lostReason:  crmDeals.lostReason,
      tags:        crmDeals.tags,
      createdAt:   crmDeals.createdAt,
      updatedAt:   crmDeals.updatedAt,
      accountName: crmAccounts.name,
    })
    .from(crmDeals)
    .leftJoin(crmAccounts, and(eq(crmDeals.accountId, crmAccounts.id), eq(crmAccounts.tenantId, session.tenantId)))
    .where(and(...conditions))
    .orderBy(desc(crmDeals.createdAt))

  return NextResponse.json({ deals })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { title, accountId, contactId, value, stage, probability, closeDate, source, assignedTo, notes } = body

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const [deal] = await db.insert(crmDeals).values({
    tenantId:    session.tenantId,
    title,
    accountId:   accountId   ?? null,
    contactId:   contactId   ?? null,
    value:       value       ?? null,
    stage:       stage       ?? 'prospecting',
    probability: probability ?? 10,
    closeDate:   closeDate   ?? null,
    source:      source      ?? null,
    assignedTo:  assignedTo  ?? session.email,
    notes:       notes       ?? null,
    createdBy:   session.email,
  }).returning()

  return NextResponse.json({ deal }, { status: 201 })
}
