import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmAccounts } from '@/lib/db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const type   = searchParams.get('type')

  const conditions = [eq(crmAccounts.tenantId, session.tenantId)]
  if (type) conditions.push(eq(crmAccounts.type, type))
  if (search) conditions.push(or(
    ilike(crmAccounts.name,    `%${search}%`),
    ilike(crmAccounts.email,   `%${search}%`),
    ilike(crmAccounts.industry,`%${search}%`),
  )!)

  const accounts = await db.select().from(crmAccounts)
    .where(and(...conditions))
    .orderBy(desc(crmAccounts.createdAt))

  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { name, industry, website, phone, email, address, city, state, country, abn, type, revenue, employees: empCount, assignedTo, notes } = body

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const [account] = await db.insert(crmAccounts).values({
    tenantId:  session.tenantId,
    name,
    industry:  industry  ?? null,
    website:   website   ?? null,
    phone:     phone     ?? null,
    email:     email     ?? null,
    address:   address   ?? null,
    city:      city      ?? null,
    state:     state     ?? null,
    country:   country   ?? 'Australia',
    abn:       abn       ?? null,
    type:      type      ?? 'prospect',
    revenue:   revenue   ?? null,
    employees: empCount  ?? null,
    assignedTo: assignedTo ?? session.email,
    notes:     notes     ?? null,
    createdBy: session.email,
  }).returning()

  return NextResponse.json({ account }, { status: 201 })
}
