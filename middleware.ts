import { NextRequest, NextResponse } from 'next/server'

/**
 * Subdomain-based multi-tenant routing
 *
 * Production:
 *   admin.yourdomain.com          → /super-admin/*
 *   yahweh-care.yourdomain.com    → /tenant/*  (x-tenant-slug: yahweh-care)
 *   property-care.yourdomain.com  → /tenant/*  (x-tenant-slug: property-care)
 *
 * Local development (no subdomain support):
 *   localhost:3000/super-admin/*           → super admin
 *   localhost:3000?tenant=yahweh-care      → tenant HRMS
 *   localhost:3000/tenant/*?tenant=slug    → tenant HRMS
 */

const PUBLIC_PATHS = ['/api/auth', '/_next', '/favicon', '/icons', '/images', '/manifest']
const SUPER_ADMIN_HOSTS = ['admin', 'superadmin']
const APP_HOSTNAMES = [
  'yahweh-hrms-app.vercel.app',
  'localhost',
  '127.0.0.1',
]

function getSubdomain(hostname: string): string | null {
  // Strip port
  const host = hostname.split(':')[0]

  // Check if it's a raw app hostname (Vercel preview, localhost)
  for (const appHost of APP_HOSTNAMES) {
    if (host === appHost || host.endsWith(`.${appHost}`)) {
      const parts = host.split('.')
      if (parts.length > appHost.split('.').length) {
        return parts[0]
      }
      return null // root domain — no subdomain
    }
  }

  // Custom domain: extract subdomain (e.g. yahweh-care.yourdomain.com → yahweh-care)
  const parts = host.split('.')
  if (parts.length > 2) return parts[0]
  return null
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Skip static assets and Next.js internals
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const subdomain = getSubdomain(hostname)

  // ── Super Admin ────────────────────────────────────────────────────────────
  if (
    subdomain && SUPER_ADMIN_HOSTS.includes(subdomain) ||
    pathname.startsWith('/super-admin')
  ) {
    // Already on /super-admin path — pass through
    if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin')) {
      return NextResponse.next()
    }
    // Rewrite admin.domain.com/* → /super-admin/*
    const url = request.nextUrl.clone()
    url.pathname = `/super-admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── Tenant HRMS ───────────────────────────────────────────────────────────
  // Resolve tenant slug: subdomain > ?tenant= query param > cookie
  const tenantSlug =
    (subdomain && !SUPER_ADMIN_HOSTS.includes(subdomain) ? subdomain : null) ??
    searchParams.get('tenant') ??
    request.cookies.get('tenant_slug')?.value

  if (tenantSlug) {
    // Already rewritten to /tenant path
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
    // Persist tenant slug in cookie (helps local dev)
    res.cookies.set('tenant_slug', tenantSlug, { path: '/', httpOnly: false, maxAge: 60 * 60 * 8 })
    return res
  }

  // ── Root (no tenant) → login / landing ───────────────────────────────────
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
