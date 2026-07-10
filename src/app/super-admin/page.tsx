import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function getPlatformStats() {
  try {
    const [clientsRes, statsRes] = await Promise.all([
      fetch(`${BASE}/api/super-admin/clients`, { cache: 'no-store' }),
      fetch(`${BASE}/api/super-admin/stats`,   { cache: 'no-store' }),
    ])
    const clientsData = await clientsRes.json()
    const statsData   = statsRes.ok ? await statsRes.json() : {}
    const clients = clientsData.clients ?? []
    return {
      totalClients:   clients.length,
      activeClients:  clients.filter((c: any) => c.isActive).length,
      enterprise:     clients.filter((c: any) => c.tier === 'enterprise').length,
      professional:   clients.filter((c: any) => c.tier === 'professional').length,
      starter:        clients.filter((c: any) => c.tier === 'starter').length,
      totalUsers:     statsData.totalUsers     ?? 0,
      activeUsers:    statsData.activeUsers    ?? 0,
      enabledModules: statsData.enabledModules ?? 0,
      // Compute MRR
      mrr: clients.filter((c: any) => c.isActive).reduce((sum: number, c: any) => {
        const prices: Record<string, number> = { starter: 57, professional: 120, enterprise: 217 }
        return sum + (prices[c.tier] ?? 0)
      }, 0),
    }
  } catch {
    return {
      totalClients: 0, activeClients: 0, enterprise: 0, professional: 0, starter: 0,
      totalUsers: 0, activeUsers: 0, enabledModules: 0, mrr: 0,
    }
  }
}

export default async function SuperAdminDashboard() {
  const s = await getPlatformStats()

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

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"  value={s.totalClients}  color="text-white"       sub={`${s.activeClients} active`} />
        <StatCard label="Platform Users" value={s.totalUsers}    color="text-blue-400"    sub={`${s.activeUsers} active`} />
        <StatCard label="Modules Enabled" value={s.enabledModules} color="text-purple-400" sub="across all tenants" />
        <StatCard label="Monthly Revenue" value={`$${s.mrr}`}    color="text-green-400"   sub="AUD / month" />
      </div>

      {/* Tier breakdown */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subscription Tiers</h2>
        <div className="grid grid-cols-3 gap-4">
          <TierCard tier="Enterprise"   count={s.enterprise}   color="text-purple-400" bg="bg-purple-900/20 border-purple-800" />
          <TierCard tier="Professional" count={s.professional} color="text-blue-400"   bg="bg-blue-900/20 border-blue-800" />
          <TierCard tier="Starter"      count={s.starter}      color="text-gray-300"   bg="bg-gray-800/40 border-gray-700" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: '➕ Add New Client',     href: '/super-admin/clients/new',    desc: 'Onboard a new organisation' },
            { label: '🏢 Manage Clients',     href: '/super-admin/clients',        desc: 'View, edit or deactivate clients' },
            { label: '💳 Billing',            href: '/super-admin/billing',        desc: 'Subscriptions and revenue overview' },
            { label: '📋 Audit Logs',         href: '/super-admin/audit-logs',     desc: 'Platform-wide tamper-evident log' },
            { label: '👤 Manage Admins',      href: '/super-admin/admins',         desc: 'Super admin accounts' },
            { label: '⚙️  Platform Settings', href: '/super-admin/settings',       desc: 'Email, security, maintenance' },
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
    </div>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function TierCard({ tier, count, color, bg }: { tier: string; count: number; color: string; bg: string }) {
  return (
    <div className={`border rounded-xl p-4 ${bg}`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-sm text-gray-300 mt-1">{tier}</p>
    </div>
  )
}
