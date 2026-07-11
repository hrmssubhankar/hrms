import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { departments } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const rows = await db
      .select({ id: departments.id, name: departments.name, description: departments.description })
      .from(departments)
      .where(and(eq(departments.tenantId, session.tenantId!), eq(departments.isActive, true)))
      .orderBy(asc(departments.name))
    return NextResponse.json({ departments: rows })
  } catch {
    return NextResponse.json({ departments: [] })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const { name, description } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const [row] = await db.insert(departments)
      .values({ tenantId: session.tenantId!, name: name.trim(), description: description ?? null, isActive: true })
      .returning()
    return NextResponse.json({ department: row }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}
