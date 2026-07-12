import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { welcomeEmail, accountSuspendedEmail, accountReactivatedEmail } from '@/lib/email/templates'
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
  const ctx = await getTenantEmailCtx(session.tenantId)
  if (ctx.notify.emailWelcome) {
    const [tenant] = await db.select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, session.tenantId))
    const tmpl = welcomeEmail({
      recipientName: email.split('@')[0],
      orgName:       ctx.orgName,
      logoUrl:       ctx.logoUrl,
      primaryColor:  ctx.primaryColor,
      role:          ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role,
      loginUrl:      `${ctx.loginUrl}/login?tenant=${tenant?.slug ?? ''}`,
      tempPassword:  password,
    })
    fireEmail(ctx, { to: email, ...tmpl })
  }

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

  const [updatedUser] = await db.update(users)
    .set(updates)
    .where(and(eq(users.id, id), eq(users.tenantId, session.tenantId)))
    .returning({ email: users.email, isActive: users.isActive })

  // Email user on account status change
  if (isActive !== undefined && updatedUser?.email) {
    try {
      const ctx = await getTenantEmailCtx(session.tenantId)
      if (ctx.notify.emailRoleChange) {
        if (!isActive) {
          fireEmail(ctx, { to: updatedUser.email, ...accountSuspendedEmail({
            recipientName: updatedUser.email.split('@')[0], orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
          }) })
        } else {
          fireEmail(ctx, { to: updatedUser.email, ...accountReactivatedEmail({
            recipientName: updatedUser.email.split('@')[0], orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor, loginUrl: ctx.loginUrl,
          }) })
        }
      }
    } catch (emailErr) { console.error('Account status email error:', emailErr) }
  }

  return NextResponse.json({ ok: true })
}
