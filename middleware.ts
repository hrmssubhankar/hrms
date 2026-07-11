import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Middleware — two responsibilities:
 * 1. Subdomain-based multi-tenant routing
 * 2. JWT session guard for /super-admin/* and /tenant/*
 */

const SESSION_COOKIE   = 'hrms_session'

// Hostnames whose first segment identifies a super admin deployment
const SUPER_ADMIN_HOSTS = ['admin', 'superadmin', 'superadmin-hrms', 'admin-hrms']

// All known app hostnames (prevents treating vercel.app as a subdomain)
const APP_HOSTNAMES = [
  'yahweh-hrms.vercel.app',
  'superadmin-hrms.vercel.app',
  'yahwehcare-hrms.vercel.app',
  'yahwehpc-hrms.vercel.app',
  'admin-hrms.vercel.app',
  'localhost',
  '127.0.0.1',
]

// Dedicated per-tenant deployment URLs → tenant slug in the database
const HOST_TENANT_MAP: Record<string, string> = {
  'yahwehcare-hrms.vercel.app': 'yahweh-care',
  'yahwehpc-hrms.vercel.app':   'yahweh-property-care',
}

// Paths that never require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/_next',
  '/favicon',
  '/icons',
  '/images',
  '/manifest',
]

function getSecret() {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
  return new TextEncoder().encode(secret)
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { role: string; tenantId?: string; tenantSlug?: string }
  } catch {
    return null
  }
}

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0]
  for (const appHost of APP_HOSTNAMES) {
    if (host === appHost || host.endsWith(`.${appHost}`)) {
      const parts = host.split('.')
      if (parts.length > appHost.split('.').length) return parts[0]
      return null
    }
  }
  const parts = host.split('.')
  if (parts.length > 2) return parts[0]
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const bareHost   = hostname.split(':')[0]
  const subdomain  = getSubdomain(hostname)
  const isSuperAdminHost =
    (subdomain && SUPER_ADMIN_HOSTS.includes(subdomain)) ||
    SUPER_ADMIN_HOSTS.some((h) => bareHost === `${h}.vercel.app`)

  // ── Super Admin routing + auth guard ───────────────────────────────────────
  if (isSuperAdminHost || pathname.startsWith('/super-admin')) {
    const token   = request.cookies.get(SESSION_COOKIE)?.value
    const session = token ? await verifySession(token) : null

    if (!session || session.role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('tenant', 'admin')
      return NextResponse.redirect(url)
    }

    if (isSuperAdminHost && !pathname.startsWith('/super-admin') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = `/super-admin${pathname}`
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // ── Tenant routing + auth guard ────────────────────────────────────────────
  const tenantSlug =
    HOST_TENANT_MAP[bareHost] ??                                           // dedicated deployment URL
    (subdomain && !SUPER_ADMIN_HOSTS.includes(subdomain) ? subdomain : null) ??
    searchParams.get('tenant') ??
    request.cookies.get('tenant_slug')?.value

  if (tenantSlug) {
    // Auth guard for tenant routes
    if (pathname.startsWith('/tenant') || (!pathname.startsWith('/api'))) {
      const token   = request.cookies.get(SESSION_COOKIE)?.value
      const session = token ? await verifySession(token) : null

      if (!session || session.role !== 'tenant_user') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('tenant', tenantSlug)
        return NextResponse.redirect(url)
      }
    }

    // Already on /tenant path
    if (pathname.startsWith('/tenant') || pathname.startsWith('/api/tenant')) {
      const res = NextResponse.next()
      res.headers.set('x-tenant-slug', tenantSlug)
      return res
    }

    // Rewrite slug.domain.com/* → /tenant/*
    const url = request.nextUrl.clone()
    url.pathname = `/tenant${pathname === '/' ? '/dashboard' : pathname}`
    const res = NextResponse.rewrite(url)
    res.headers.set('x-tenant-slug', tenantSlug)
    res.cookies.set('tenant_slug', tenantSlug, { path: '/', httpOnly: false, maxAge: 60 * 60 * 8 })
    return res
  }

  // ── Root → login ───────────────────────────────────────────────────────────
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
