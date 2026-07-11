import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const tenantUsers = await db
    .select({
      id:          users.id,
      email:       users.email,
      role:        users.role,
      isActive:    users.isActive,
      totpEnabled: users.totpEnabled,
      lastLoginAt: users.lastLoginAt,
      createdAt:   users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, session.tenantId))
    .orderBy(users.createdAt)

  return NextResponse.json({ users: tenantUsers })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { email, role, password } = body

  if (!email || !role || !password) {
    return NextResponse.json({ error: 'email, role and password required' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [created] = await db.insert(users).values({
    tenantId: session.tenantId,
    email,
    role,
    passwordHash,
    isActive: true,
  }).returning({ id: users.id, email: users.email, role: users.role })

  return NextResponse.json({ user: created }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { id, role, isActive } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (role     !== undefined) updates.role     = role
  if (isActive !== undefined) updates.isActive = isActive

  await db.update(users)
    .set(updates)
    .where(and(eq(users.id, id), eq(users.tenantId, session.tenantId)))

  return NextResponse.json({ ok: true })
}
