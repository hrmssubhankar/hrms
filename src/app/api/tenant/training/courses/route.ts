import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const search    = searchParams.get('search') ?? ''
    const category  = searchParams.get('category') ?? ''
    const mandatory = searchParams.get('mandatory')

    const conditions = [
      eq(courses.tenantId, session.tenantId),
      eq(courses.isActive, true),
    ]
    if (category)  conditions.push(eq(courses.category, category))
    if (mandatory === 'true')  conditions.push(eq(courses.isMandatory, true))
    if (mandatory === 'false') conditions.push(eq(courses.isMandatory, false))

    const all = await db
      .select()
      .from(courses)
      .where(and(...conditions))
      .orderBy(desc(courses.createdAt))

    const filtered = search
      ? all.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) ||
          (c.category ?? '').toLowerCase().includes(search.toLowerCase()))
      : all

    // Derive unique categories for filter dropdown
    const categories = [...new Set(all.map(c => c.category).filter(Boolean))]

    return NextResponse.json({ courses: filtered, categories })
  } catch (err) {
    console.error('GET /api/tenant/training/courses', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, category, isMandatory, validityMonths } = body

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

    const [course] = await db.insert(courses).values({
      tenantId:      session.tenantId,
      title:         title.trim(),
      description:   description   || null,
      category:      category      || null,
      isMandatory:   isMandatory   ?? false,
      validityMonths: validityMonths ? Number(validityMonths) : null,
      content:       [],
      isActive:      true,
    }).returning()

    return NextResponse.json({ course }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/training/courses', err)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, description, category, isMandatory, validityMonths, isActive } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (title          !== undefined) updates.title          = title
    if (description    !== undefined) updates.description    = description
    if (category       !== undefined) updates.category       = category
    if (isMandatory    !== undefined) updates.isMandatory    = isMandatory
    if (validityMonths !== undefined) updates.validityMonths = validityMonths ? Number(validityMonths) : null
    if (isActive       !== undefined) updates.isActive       = isActive

    const [updated] = await db
      .update(courses)
      .set(updates)
      .where(and(eq(courses.id, id), eq(courses.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ course: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/training/courses', err)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}
