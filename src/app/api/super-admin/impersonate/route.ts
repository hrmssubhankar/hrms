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
      // Default to first active director/hr_officer in the tenant
      const allUsers = await db.select().from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)))
      targetUser = allUsers.find(u => ['director', 'hr_officer'].includes(u.role)) ?? allUsers[0]
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
      tenantId:       tenantId,
      tenantSlug:     tenant.slug,
      name:           `[Impersonated by ${session.email}]`,
      impersonatedBy: session.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    // Return the token and redirect URL — the client will set the cookie
    const redirectTo = `${process.env.APP_URL ?? ''}/tenant/dashboard`

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
