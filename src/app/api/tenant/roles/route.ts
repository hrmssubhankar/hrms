import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { apiGuard } from '@/lib/auth/apiGuard'
import { sendEmail } from '@/lib/email/resend'
import { welcomeEmail } from '@/lib/email/templates'
import { ROLE_LABELS } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('roles:read')
    if (guard.error) return guard.error
    const { session } = guard

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
  const guard = await apiGuard('roles:write')
    if (guard.error) return guard.error
    const { session } = guard

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

  // Send welcome email (fire-and-forget — don't block the response)
  const [tenant] = await db.select({ name: tenants.name, slug: tenants.slug, primaryColor: tenants.primaryColor })
    .from(tenants).where(eq(tenants.id, session.tenantId))

  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? `https://${process.env.VERCEL_URL ?? 'hrms.app'}`

  const tmpl = welcomeEmail({
    recipientName: email.split('@')[0],
    orgName:       tenant?.name ?? 'Your Organisation',
    role:          ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role,
    loginUrl:      `${loginUrl}/login?tenant=${tenant?.slug ?? ''}`,
    tempPassword:  password,
    primaryColor:  tenant?.primaryColor ?? '#1a4fff',
  })
  sendEmail({ to: email, ...tmpl }).catch(console.error)

  return NextResponse.json({ user: created }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('roles:write')
    if (guard.error) return guard.error
    const { session } = guard

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
