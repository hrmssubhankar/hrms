import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Middleware — multi-tenant routing + JWT auth guard.
 *
 * Works in two modes:
 *
 * A) Separate-project mode (current approach):
 *    Each Vercel project sets NEXT_PUBLIC_TENANT_SLUG:
 *      superadmin-hrms  →  NEXT_PUBLIC_TENANT_SLUG=admin
 *      yahwehcare-hrms  →  NEXT_PUBLIC_TENANT_SLUG=yahweh-care
 *      yahwehpc-hrms    →  NEXT_PUBLIC_TENANT_SLUG=yahweh-property-care
 *
 * B) Subdomain mode (future, with a custom domain):
 *    superadmin.yourdomain.com, yahwehcare.yourdomain.com, etc.
 *    Set NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com in Vercel.
 */

const SESSION_COOKIE = 'hrms_session'

// Subdomains that identify the super admin portal (used in subdomain mode)
const SUPER_ADMIN_SUBDOMAINS = ['superadmin', 'admin']

// Subdomain → DB tenant slug mapping (used in subdomain mode)
const SUBDOMAIN_TENANT_MAP: Record<string, string> = {
  yahwehcare: 'yahweh-care',
  yahwehpc:   'yahweh-property-care',
}

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

function extractSubdomain(hostname: string): string | null {
  const host       = hostname.split(':')[0]
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? ''

  if (rootDomain) {
    if (host === rootDomain) return null
    if (host.endsWith(`.${rootDomain}`)) {
      return host.slice(0, host.length - rootDomain.length - 1).split('.')[0]
    }
    return null
  }

  if (host === 'localhost' || host === '127.0.0.1') return null
  return null   // no root domain configured → subdomain mode inactive
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // ── Public paths always pass through ──────────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Deployment-level tenant (NEXT_PUBLIC_TENANT_SLUG env var) ─────────────
  // Set per-project in Vercel. Takes priority over everything else.
  const deploymentTenant = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ''

  // ── Subdomain detection (future custom domain support) ─────────────────────
  const subdomain = extractSubdomain(hostname)

  // ── Determine if this is a super admin context ────────────────────────────
  const isSuperAdmin =
    deploymentTenant === 'admin' ||
    (subdomain !== null && SUPER_ADMIN_SUBDOMAINS.includes(subdomain))

  // ── Super Admin routing + auth guard ──────────────────────────────────────
  if (isSuperAdmin || pathname.startsWith('/super-admin')) {
    const token   = request.cookies.get(SESSION_COOKIE)?.value
    const session = token ? await verifySession(token) : null

    if (!session || session.role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('tenant', 'admin')
      return NextResponse.redirect(url)
    }

    if (isSuperAdmin && !pathname.startsWith('/super-admin') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = `/super-admin${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // ── Tenant routing + auth guard ───────────────────────────────────────────
  let tenantSlug: string | null | undefined =
    (deploymentTenant && deploymentTenant !== 'admin' ? deploymentTenant : null) ??
    (subdomain ? (SUBDOMAIN_TENANT_MAP[subdomain] ?? subdomain) : null) ??
    searchParams.get('tenant') ??
    request.cookies.get('tenant_slug')?.value

  // Last resort: read tenantSlug from the JWT itself (covers deployments where
  // NEXT_PUBLIC_TENANT_SLUG isn't configured and tenant_slug cookie has expired)
  if (!tenantSlug) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (token) {
      const jwtPayload = await verifySession(token)
      if (jwtPayload?.role === 'tenant_user' && jwtPayload.tenantSlug) {
        tenantSlug = jwtPayload.tenantSlug
      }
    }
  }

  if (tenantSlug) {
    if (pathname.startsWith('/tenant') || !pathname.startsWith('/api')) {
      const token   = request.cookies.get(SESSION_COOKIE)?.value
      const session = token ? await verifySession(token) : null

      if (!session || session.role !== 'tenant_user') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('tenant', tenantSlug)
        return NextResponse.redirect(url)
      }
    }

    if (pathname.startsWith('/tenant') || pathname.startsWith('/api/tenant')) {
      const res = NextResponse.next()
      res.headers.set('x-tenant-slug', tenantSlug)
      // Refresh the cookie so it stays alive across navigation
      res.cookies.set('tenant_slug', tenantSlug, {
        path: '/', httpOnly: false, sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
      })
      return res
    }

    const url = request.nextUrl.clone()
    url.pathname = `/tenant${pathname === '/' ? '/dashboard' : pathname}`
    const res = NextResponse.rewrite(url)
    res.headers.set('x-tenant-slug', tenantSlug)
    res.cookies.set('tenant_slug', tenantSlug, { path: '/', httpOnly: false, maxAge: 60 * 60 * 8 })
    return res
  }

  // ── Root → login ──────────────────────────────────────────────────────────
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
