import Link from 'next/link'

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/super-admin/clients`, {
      cache: 'no-store',
    })
    const data = await res.json()
    const clients = data.clients ?? []
    return {
      total:        clients.length,
      active:       clients.filter((c: any) => c.isActive).length,
      enterprise:   clients.filter((c: any) => c.tier === 'enterprise').length,
      professional: clients.filter((c: any) => c.tier === 'professional').length,
      starter:      clients.filter((c: any) => c.tier === 'starter').length,
    }
  } catch {
    return { total: 0, active: 0, enterprise: 0, professional: 0, starter: 0 }
  }
}

export default async function SuperAdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all client tenants and platform settings</p>
        </div>
        <Link
          href="/super-admin/clients/new"
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Client
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Clients',    value: stats.total,        color: 'text-white' },
          { label: 'Active',           value: stats.active,       color: 'text-green-400' },
          { label: 'Enterprise',       value: stats.enterprise,   color: 'text-purple-400' },
          { label: 'Professional',     value: stats.professional, color: 'text-blue-400' },
          { label: 'Starter',          value: stats.starter,      color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: '➕ Add New Client',        href: '/super-admin/clients/new',     desc: 'Onboard a new organisation' },
          { label: '🏢 Manage Clients',        href: '/super-admin/clients',         desc: 'View, edit or deactivate clients' },
          { label: '⚙️  Platform Settings',    href: '/super-admin/settings',        desc: 'Global configuration' },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="block bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-xl p-5 transition"
          >
            <p className="text-sm font-semibold text-white mb-1">{a.label}</p>
            <p className="text-xs text-gray-400">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
