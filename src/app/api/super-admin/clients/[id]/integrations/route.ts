import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

type Params = { params: Promise<{ id: string }> }

// GET /api/super-admin/clients/[id]/integrations
// Returns the client's current integration settings
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params
  const [tenant] = await db.select({ id: tenants.id, name: tenants.name, settings: tenants.settings })
    .from(tenants).where(eq(tenants.id, id))
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings     = (tenant.settings ?? {}) as Record<string, unknown>
  const integrations = (settings.integrations ?? {}) as Record<string, unknown>
  const country      = (settings.country as string) ?? 'AU'
  const currency     = (settings.currency as string) ?? 'AUD'

  return NextResponse.json({ integrations, country, currency, tenantName: tenant.name })
}

// PATCH /api/super-admin/clients/[id]/integrations
// Body: { providerId: string, config: object }
// Saves or updates integration config for a payroll provider
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params
  const { providerId, config, enabled } = await req.json()
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 })

  const [tenant] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, id))
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings     = { ...(tenant.settings as Record<string, unknown> ?? {}) }
  const integrations = { ...(settings.integrations as Record<string, unknown> ?? {}) }

  integrations[providerId] = {
    ...(integrations[providerId] as Record<string, unknown> ?? {}),
    ...config,
    enabled: enabled ?? true,
    updatedAt: new Date().toISOString(),
  }

  settings.integrations = integrations

  const [updated] = await db.update(tenants)
    .set({ settings, updatedAt: new Date() })
    .where(eq(tenants.id, id))
    .returning({ settings: tenants.settings })

  return NextResponse.json({ ok: true, integrations: (updated.settings as any)?.integrations })
}

// DELETE /api/super-admin/clients/[id]/integrations
// Body: { providerId: string }
// Removes an integration
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params
  const { providerId } = await req.json()

  const [tenant] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, id))
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings     = { ...(tenant.settings as Record<string, unknown> ?? {}) }
  const integrations = { ...(settings.integrations as Record<string, unknown> ?? {}) }
  delete integrations[providerId]
  settings.integrations = integrations

  await db.update(tenants).set({ settings, updatedAt: new Date() }).where(eq(tenants.id, id))
  return NextResponse.json({ ok: true })
}
