import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { SignJWT } from 'jose'

// POST /api/super-admin/impersonate
// Body: { tenantId, userId? }  — userId optional; defaults to first active user in tenant
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tenantId, userId } = await req.json()
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    let targetUser
    if (userId) {
      ;[targetUser] = await db.select().from(users)
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
        .limit(1)
    } else {
      // Prefer director > hr_officer > any active user
      const allUsers = await db.select().from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)))
      const ROLE_PRIORITY: Record<string, number> = { director: 0, hr_officer: 1 }
      targetUser =
        allUsers
          .filter(u => u.role in ROLE_PRIORITY)
          .sort((a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99))[0]
        ?? allUsers[0]
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'No active users found for this tenant' }, { status: 404 })
    }

    // Issue a short-lived impersonation token (1 hour)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
    )
    const token = await new SignJWT({
      sub:            targetUser.id,
      email:          targetUser.email,
      role:           'tenant_user',
      userRole:       targetUser.role,   // actual DB role — used by apiGuard for permission checks
      tenantId:       tenantId,
      tenantSlug:     tenant.slug,
      name:           `[Impersonated by ${session.email}]`,
      impersonatedBy: session.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    // Return the token and redirect URL.
    // The client opens this URL on the *tenant* deployment so the cookie is
    // set on the correct domain by /api/auth/impersonate.
    const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>
    const tenantBaseUrl  = (tenantSettings.deploymentUrl as string | undefined)
      ?? `https://${tenant.slug}-hrmsapp.vercel.app`
    // Full URL the super-admin client opens in a new tab:
    // the tenant portal's /api/auth/impersonate sets the cookie on its own domain.
    const redirectTo = `${tenantBaseUrl}/api/auth/impersonate?token=${token}`

    return NextResponse.json({
      token,
      redirectTo,
      tenantSlug: tenant.slug,
      userEmail:  targetUser.email,
      userRole:   targetUser.role,
    })
  } catch (err) {
    console.error('POST /api/super-admin/impersonate error:', err)
    return NextResponse.json({ error: 'Failed to impersonate' }, { status: 500 })
  }
}
