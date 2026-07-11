import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

// GET /api/tenant/config
// Works two ways:
//   ?slug=yahweh-care   → used by tenant layout (no auth required)
//   no slug             → uses session.tenantId (for tenant settings page)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
    ?? req.headers.get('x-tenant-slug')

  try {
    let tenantQuery
    if (slug) {
      tenantQuery = db.select().from(tenants).where(eq(tenants.slug, slug))
    } else {
      // Fall back to session-based lookup
      const session = await getSession()
      if (!session?.tenantId) return NextResponse.json({ error: 'slug or session required' }, { status: 400 })
      tenantQuery = db.select().from(tenants).where(eq(tenants.id, session.tenantId))
    }

    const [tenant] = await tenantQuery

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (!tenant.isActive) {
      return NextResponse.json({ error: 'Tenant is inactive' }, { status: 403 })
    }

    const modules = await db
      .select()
      .from(tenantModules)
      .where(
        and(
          eq(tenantModules.tenantId, tenant.id),
          eq(tenantModules.isEnabled, true)
        )
      )
      .orderBy(tenantModules.moduleId)

    return NextResponse.json({
      tenant: {
        id:           tenant.id,
        name:         tenant.name,
        slug:         tenant.slug,
        tier:         tenant.tier,
        logoUrl:      tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        settings:     tenant.settings,
      },
      enabledModules: modules.map(m => ({ id: m.moduleId, name: m.moduleName })),
    })
  } catch (error) {
    console.error('GET /api/tenant/config error:', error)
    return NextResponse.json({ error: 'Failed to load tenant config' }, { status: 500 })
  }
}

// PATCH /api/tenant/config — tenant admin self-service
// Accepts: { settings? } for domain/email/notifications
//          { name? }     to update the portal display name
//          { logoUrl? }  to update the logo (base64 data URL, ≤512KB, or null to remove)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const { settings: incoming, name, logoUrl } = body

    // Validate logo if provided
    if (logoUrl !== undefined && logoUrl !== null) {
      if (typeof logoUrl !== 'string' || !logoUrl.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid logo — must be a data:image/ URL' }, { status: 400 })
      }
      if (logoUrl.length * 0.75 > 512 * 1024) {
        return NextResponse.json({ error: 'Logo too large — max 512 KB' }, { status: 413 })
      }
    }

    // Build column-level updates
    const colUpdates: Record<string, unknown> = { updatedAt: new Date() }
    if (name  !== undefined) colUpdates.name    = String(name).trim()
    if (logoUrl !== undefined) colUpdates.logoUrl = logoUrl  // null clears it

    // Merge settings jsonb if provided
    if (incoming && typeof incoming === 'object') {
      const [current] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, session.tenantId))
      const existing  = (current?.settings ?? {}) as Record<string, unknown>
      colUpdates.settings = { ...existing, ...incoming }
    }

    const [updated] = await db.update(tenants)
      .set(colUpdates)
      .where(eq(tenants.id, session.tenantId))
      .returning({ name: tenants.name, logoUrl: tenants.logoUrl, settings: tenants.settings })

    return NextResponse.json({ ok: true, ...updated })
  } catch (err) {
    console.error('PATCH /api/tenant/config error:', err)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
