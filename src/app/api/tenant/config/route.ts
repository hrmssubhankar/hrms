import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/tenant/config?slug=yahweh-care
// Returns tenant config + enabled modules. Used by the tenant layout.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
    ?? req.headers.get('x-tenant-slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))

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
