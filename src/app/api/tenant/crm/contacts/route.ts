import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crmContacts } from '@/lib/db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('crm:read')
  if (guard.error) return guard.error
  const { session } = guard

  const { searchParams } = new URL(req.url)
  const search    = searchParams.get('search')
  const accountId = searchParams.get('accountId')

  const conditions = [eq(crmContacts.tenantId, session.tenantId)]
  if (accountId) conditions.push(eq(crmContacts.accountId, accountId))
  if (search) conditions.push(or(
    ilike(crmContacts.firstName, `%${search}%`),
    ilike(crmContacts.lastName,  `%${search}%`),
    ilike(crmContacts.email,     `%${search}%`),
  )!)

  const contacts = await db.select().from(crmContacts)
    .where(and(...conditions))
    .orderBy(desc(crmContacts.createdAt))

  return NextResponse.json({ contacts })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('crm:write')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json()
  const { firstName, lastName, email, phone, mobile, jobTitle, department, accountId, assignedTo, notes, tags } = body

  if (!firstName) return NextResponse.json({ error: 'firstName required' }, { status: 400 })

  const [contact] = await db.insert(crmContacts).values({
    tenantId:   session.tenantId,
    firstName,
    lastName:   lastName   ?? null,
    email:      email      ?? null,
    phone:      phone      ?? null,
    mobile:     mobile     ?? null,
    jobTitle:   jobTitle   ?? null,
    department: department ?? null,
    accountId:  accountId  ?? null,
    assignedTo: assignedTo ?? session.email,
    notes:      notes      ?? null,
    tags:       tags       ?? [],
    createdBy:  session.email,
  }).returning()

  return NextResponse.json({ contact }, { status: 201 })
}
