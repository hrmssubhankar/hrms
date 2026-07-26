import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import ClientsUI, { type Client } from './ClientsUI'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const rows = await db.select({
    id:           tenants.id,
    name:         tenants.name,
    slug:         tenants.slug,
    tier:         tenants.tier,
    isActive:     tenants.isActive,
    primaryColor: tenants.primaryColor,
    logoUrl:      tenants.logoUrl,
    createdAt:    tenants.createdAt,
  }).from(tenants).orderBy(tenants.createdAt)

  // Serialize dates to strings for the client component
  const clients: Client[] = rows.map(r => ({
    ...r,
    primaryColor: r.primaryColor ?? '#6d28d9',
    logoUrl:      r.logoUrl ?? null,
    createdAt:    r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }))

  return <ClientsUI initialClients={clients} />
}
