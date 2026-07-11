import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/super-admin/clients/[id]
export async function GET(_: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id))
    if (!tenant) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const modules = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, id))
    return NextResponse.json({ tenant, modules })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PATCH /api/super-admin/clients/[id] — update tenant
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    const body = await req.json()
    const { name, tier, isActive, logoUrl, primaryColor, settings } = body

    // Fetch existing settings so we can deep-merge instead of overwrite
    const [existing] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, id))

    const existingSettings = (existing?.settings ?? {}) as Record<string, unknown>

    // Only touch settings column when caller explicitly provides a settings object
    const newSettings = settings !== undefined
      ? { ...existingSettings, ...settings }
      : existingSettings

    const [updated] = await db
      .update(tenants)
      .set({
        ...(name         !== undefined && { name }),
        ...(tier         !== undefined && { tier }),
        ...(isActive     !== undefined && { isActive }),
        ...(logoUrl      !== undefined && { logoUrl }),
        ...(primaryColor !== undefined && { primaryColor }),
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ tenant: updated })
  } catch (error) {
    console.error('PATCH client error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/super-admin/clients/[id]
export async function DELETE(_: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    await db.delete(tenants).where(eq(tenants.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
