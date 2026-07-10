import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/super-admin/clients/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, params.id))
    if (!tenant) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const modules = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, params.id))
    return NextResponse.json({ tenant, modules })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PATCH /api/super-admin/clients/[id] — update tenant
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, tier, isActive, logoUrl, primaryColor, settings } = body

    const mergedSettings = settings ?? {
      theme: {
        primaryColor: primaryColor,
        logoUrl: logoUrl,
        fontFamily: 'Inter',
        borderRadius: '0.5rem',
      }
    }

    const [updated] = await db
      .update(tenants)
      .set({
        ...(name        && { name }),
        ...(tier        && { tier }),
        ...(isActive !== undefined && { isActive }),
        ...(logoUrl     && { logoUrl }),
        ...(primaryColor && { primaryColor }),
        settings: mergedSettings,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, params.id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ tenant: updated })
  } catch (error) {
    console.error('PATCH client error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/super-admin/clients/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.delete(tenants).where(eq(tenants.id, params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
