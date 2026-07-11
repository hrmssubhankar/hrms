import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { positions } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const rows = await db
      .select({ id: positions.id, title: positions.title, departmentId: positions.departmentId })
      .from(positions)
      .where(and(eq(positions.tenantId, session.tenantId!), eq(positions.isActive, true)))
      .orderBy(asc(positions.title))
    return NextResponse.json({ positions: rows })
  } catch {
    return NextResponse.json({ positions: [] })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const { title, departmentId, description } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    const [row] = await db.insert(positions)
      .values({
        tenantId: session.tenantId!, title: title.trim(),
        departmentId: departmentId ?? null,
        description: description ?? null, isActive: true,
      })
      .returning()
    return NextResponse.json({ position: row }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 })
  }
}
