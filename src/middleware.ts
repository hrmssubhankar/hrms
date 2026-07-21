import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware — hostname-based tenant slug detection.
 *
 * Priority order:
 *  1. NEXT_PUBLIC_TENANT_SLUG env var (set per Vercel project)
 *  2. Hostname pattern: {slug}-hrmsapp.vercel.app  → slug
 *  3. Hostname pattern: superadmin-hrmsapp.vercel.app → admin
 *  4. Fallback: 'admin'
 *
 * Sets x-tenant-slug request header so layouts/APIs can read it.
 */
export function middleware(request: NextRequest) {
  const slug = resolveTenantSlug(request)
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', slug)
  // Also pass through on request headers so server components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', slug)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

function resolveTenantSlug(request: NextRequest): string {
  // 1. Deployment-level env var (set per Vercel project)
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (envSlug && envSlug !== '') return envSlug

  // 2. Extract from hostname
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0] // strip port

  // superadmin-hrmsapp.vercel.app → admin
  if (hostname.startsWith('superadmin-')) return 'admin'

  // {slug}-hrmsapp.vercel.app → slug
  // e.g. yahweh-care-hrmsapp.vercel.app → yahweh-care
  const hrmsappMatch = hostname.match(/^(.+)-hrmsapp\./)
  if (hrmsappMatch) return hrmsappMatch[1]

  // Custom domain: tenant.yourdomain.com → tenant
  // e.g. yahwehcare.yahwehhrms.com.au → yahwehcare
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]

  return 'admin'
}

export const config = {
  matcher: [
    // Run on all routes except static files, _next internals, and api/upload
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api/upload).*)',
  ],
}
