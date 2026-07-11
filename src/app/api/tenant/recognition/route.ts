import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recognitions, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const nominator = { id: employees.id, firstName: employees.firstName, lastName: employees.lastName }
    const rows = await db.select({
      id: recognitions.id, recipientId: recognitions.recipientId,
      nominatedBy: recognitions.nominatedBy, type: recognitions.type,
      reason: recognitions.reason, period: recognitions.period,
      isPublic: recognitions.isPublic, createdAt: recognitions.createdAt,
      recipientFirstName: employees.firstName, recipientLastName: employees.lastName,
    }).from(recognitions)
      .leftJoin(employees, eq(recognitions.recipientId, employees.id))
      .where(eq(recognitions.tenantId, session.tenantId))
      .orderBy(desc(recognitions.createdAt))
    return NextResponse.json({ recognitions: rows })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { recipientId, nominatedBy, type, reason, period, isPublic } = await req.json()
    if (!recipientId || !type) return NextResponse.json({ error: 'recipientId and type required' }, { status: 400 })
    const [record] = await db.insert(recognitions).values({
      tenantId: session.tenantId, recipientId, type,
      nominatedBy: nominatedBy || null, reason: reason || null,
      period: period || null, isPublic: isPublic ?? true,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
