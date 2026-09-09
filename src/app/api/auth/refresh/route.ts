import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { superAdmins, users, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { signToken } from '@/lib/auth/jwt'
import { getSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session'

/**
 * POST /api/auth/refresh
 *
 * Re-issues a fresh 8-hour session cookie from the current valid session.
 * Call this from the client before the token expires to keep the user logged in.
 *
 * Returns:
 *   200 { ok: true }            — new cookie set
 *   401 { error: '...' }        — no session / expired / invalid
 *   403 { error: '...' }        — account deactivated since token was issued
 *   500 { error: '...' }        — unexpected error
 */
export async function POST() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    // Reject TOTP challenge tokens — they must not be refreshed into full sessions
    if (session.phase === 'totp') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    // ── Super admin refresh ──────────────────────────────────────────────────
    if (session.role === 'super_admin') {
      const [admin] = await db
        .select({ id: superAdmins.id, email: superAdmins.email, name: superAdmins.name, isActive: superAdmins.isActive })
        .from(superAdmins)
        .where(eq(superAdmins.id, session.sub))

      if (!admin?.isActive) {
        const res = NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
        res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
        return res
      }

      const token = await signToken({
        sub:   admin.id,
        email: admin.email,
        role:  'super_admin',
        name:  admin.name ?? undefined,
      })

      const res = NextResponse.json({ ok: true })
      res.cookies.set(sessionCookieOptions(token))
      return res
    }

    // ── Tenant user refresh ──────────────────────────────────────────────────
    if (!session.tenantId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const [[user], [tenant]] = await Promise.all([
      db.select({
        id: users.id, email: users.email, role: users.role,
        isActive: users.isActive, tenantId: users.tenantId,
      })
        .from(users)
        .where(and(eq(users.id, session.sub), eq(users.tenantId, session.tenantId))),
      db.select({ id: tenants.id, slug: tenants.slug, isActive: tenants.isActive })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId)),
    ])

    if (!user?.isActive || !tenant?.isActive) {
      const res = NextResponse.json({ error: 'Account or organisation deactivated' }, { status: 403 })
      res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
      return res
    }

    const token = await signToken({
      sub:        user.id,
      email:      user.email,
      role:       'tenant_user',
      tenantId:   tenant.id,
      tenantSlug: tenant.slug,
      userRole:   user.role,
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set(sessionCookieOptions(token))
    res.cookies.set('tenant_slug', tenant.slug, {
      path: '/', httpOnly: false, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    })
    return res

  } catch (err) {
    console.error('[auth/refresh]', err)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
