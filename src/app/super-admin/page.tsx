import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function getPlatformData() {
  try {
    const [clientsRes, statsRes, auditRes] = await Promise.all([
      fetch(`${BASE}/api/super-admin/clients`,    { cache: 'no-store' }),
      fetch(`${BASE}/api/super-admin/stats`,      { cache: 'no-store' }),
      fetch(`${BASE}/api/super-admin/audit-logs?page=1`, { cache: 'no-store' }),
    ])

    const clientsData = await clientsRes.json()
    const statsData   = statsRes.ok ? await statsRes.json() : {}
    const auditData   = auditRes.ok ? await auditRes.json() : {}

    const clients: any[] = clientsData.clients ?? []
    const recentLogs: any[] = (auditData.logs ?? []).slice(0, 6)

    // Onboarding completion per client
    const clientsWithStatus = clients.map((c: any) => {
      // We can't query per-client modules/users here without extra fetches,
      // so we use a simple heuristic: isActive + has primaryColor ≠ default = themed
      const themed  = c.primaryColor && c.primaryColor !== '#1a4fff'
      const hasSlug = Boolean(c.slug)
      const score   = [c.isActive, themed, hasSlug].filter(Boolean).length
      return { ...c, onboardingScore: score, onboardingTotal: 3 }
    })

    const mrr = clients.filter((c: any) => c.isActive).reduce((sum: number, c: any) => {
      const prices: Record<string, number> = { starter: 57, professional: 120, enterprise: 217 }
      return sum + (prices[c.tier] ?? 0)
    }, 0)

    return {
      totalClients:   clients.length,
      activeClients:  clients.filter((c: any) => c.isActive).length,
      enterprise:     clients.filter((c: any) => c.tier === 'enterprise').length,
      professional:   clients.filter((c: any) => c.tier === 'professional').length,
      starter:        clients.filter((c: any) => c.tier === 'starter').length,
      totalUsers:     statsData.totalUsers     ?? 0,
      activeUsers:    statsData.activeUsers    ?? 0,
      enabledModules: statsData.enabledModules ?? 0,
      mrr,
      recentLogs,
      clients: clientsWithStatus.slice(0, 5),
    }
  } catch {
    return {
      totalClients: 0, activeClients: 0, enterprise: 0, professional: 0, starter: 0,
      totalUsers: 0, activeUsers: 0, enabledModules: 0, mrr: 0,
      recentLogs: [], clients: [],
    }
  }
}

const ACTION_COLOR: Record<string, string> = {
  login:  'text-blue-400', create: 'text-green-400',
  update: 'text-yellow-400', delete: 'text-red-400',
  export: 'text-purple-400',
}

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLOR[key] : 'text-gray-400'
}

export default async function SuperAdminDashboard() {
  const d = await getPlatformData()

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"   value={d.totalClients}   color="text-white"       sub={`${d.activeClients} active`} />
        <StatCard label="Platform Users"  value={d.totalUsers}     color="text-blue-400"    sub={`${d.activeUsers} active`} />
        <StatCard label="Active Modules"  value={d.enabledModules} color="text-purple-400"  sub="across all tenants" />
        <StatCard label="Monthly Revenue" value={`$${d.mrr}`}      color="text-green-400"   sub="AUD / month" />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <TierCard tier="Enterprise"   count={d.enterprise}   color="text-purple-400" bg="bg-purple-900/20 border-purple-800" />
        <TierCard tier="Professional" count={d.professional} color="text-blue-400"   bg="bg-blue-900/20 border-blue-800" />
        <TierCard tier="Starter"      count={d.starter}      color="text-gray-300"   bg="bg-gray-800/40 border-gray-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: '➕ Add Client',      href: '/super-admin/clients/new',     desc: 'Onboard a new organisation' },
              { label: '🏢 Clients',         href: '/super-admin/clients',         desc: 'View, edit or deactivate' },
              { label: '💳 Billing',         href: '/super-admin/billing',         desc: 'Subscriptions & revenue' },
              { label: '🧩 Modules',         href: '/super-admin/modules',         desc: 'Cross-tenant module usage' },
              { label: '📋 Audit Logs',      href: '/super-admin/audit-logs',      desc: 'Platform-wide event log' },
              { label: '📢 Announcements',   href: '/super-admin/announcements',   desc: 'Broadcast to tenants' },
              { label: '🖥️  System Health',  href: '/super-admin/system',          desc: 'DB status & infra checks' },
              { label: '👤 Admins',          href: '/super-admin/admins',          desc: 'Super admin accounts' },
              { label: '⚙️  Settings',        href: '/super-admin/settings',        desc: 'Email, security, maintenance' },
            ].map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="block bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-xl p-4 transition group"
              >
                <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition">{a.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </Link>
            ))}
          </div>

          {/* Client onboarding status */}
          {d.clients.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Setup Status</h2>
                <Link href="/super-admin/clients" className="text-xs text-purple-400 hover:text-purple-300">View all →</Link>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {d.clients.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: c.primaryColor || '#6d28d9' }}
                    >
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[
                          { label: 'Active',  done: c.isActive },
                          { label: 'Themed',  done: c.primaryColor !== '#1a4fff' },
                          { label: 'Slug',    done: Boolean(c.slug) },
                        ].map(step => (
                          <span
                            key={step.label}
                            className={`text-xs px-1.5 py-0.5 rounded ${step.done ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}
                          >
                            {step.done ? '✓' : '○'} {step.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">{c.onboardingScore}/{c.onboardingTotal}</p>
                      <div className="w-16 bg-gray-800 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-purple-500"
                          style={{ width: `${(c.onboardingScore / c.onboardingTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/super-admin/clients/${c.id}`} className="text-xs text-gray-500 hover:text-purple-400 transition shrink-0">→</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent audit activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</h2>
            <Link href="/super-admin/audit-logs" className="text-xs text-purple-400 hover:text-purple-300">View all →</Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {d.recentLogs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-xs text-gray-500">No audit events yet</p>
              </div>
            ) : d.recentLogs.map((log: any) => (
              <div key={log.id} className="px-4 py-3 border-b border-gray-800/50 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-semibold ${actionColor(log.action)}`}>{log.action}</span>
                    <span className="text-xs text-gray-500 ml-1">·</span>
                    <span className="text-xs text-gray-400 ml-1 truncate">{log.resource}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {log.tenantName ?? 'Platform'} · {new Date(log.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
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
