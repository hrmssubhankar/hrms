/**
 * GET  /api/tenant/crm/leads  — list leads (with filters)
 * POST /api/tenant/crm/leads  — create lead
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmLeads } from '@/lib/db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const stage  = searchParams.get('stage')

  try {
    const conditions = [eq(crmLeads.tenantId, session.tenantId)]
    if (status) conditions.push(eq(crmLeads.status, status))
    if (stage)  conditions.push(eq(crmLeads.stage, stage))
    if (search) conditions.push(or(
      ilike(crmLeads.firstName, `%${search}%`),
      ilike(crmLeads.lastName,  `%${search}%`),
      ilike(crmLeads.email,     `%${search}%`),
      ilike(crmLeads.company,   `%${search}%`),
    )!)

    const leads = await db
      .select()
      .from(crmLeads)
      .where(and(...conditions))
      .orderBy(desc(crmLeads.createdAt))

    return NextResponse.json({ leads })
  } catch (err) {
    console.error('GET /api/tenant/crm/leads', err)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, company, jobTitle, source, stage, assignedTo, notes, tags } = body

    if (!firstName) return NextResponse.json({ error: 'firstName is required' }, { status: 400 })

    const [lead] = await db.insert(crmLeads).values({
      tenantId:   session.tenantId,
      firstName,
      lastName:   lastName   ?? null,
      email:      email      ?? null,
      phone:      phone      ?? null,
      company:    company    ?? null,
      jobTitle:   jobTitle   ?? null,
      source:     source     ?? null,
      stage:      stage      ?? 'new',
      status:     'new',
      assignedTo: assignedTo ?? session.email,
      notes:      notes      ?? null,
      tags:       tags       ?? [],
      createdBy:  session.email,
    }).returning()

    return NextResponse.json({ lead }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/crm/leads', err)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
