import { headers } from 'next/headers'

async function getTenantStats(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/tenant/config?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const STAT_CARDS = [
  { label: 'Total Employees',   value: '--', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'On Leave Today',    value: '--', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'Pending Approvals', value: '--', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { label: 'Compliance Items',  value: '--', color: 'bg-red-50 text-red-700 border-red-100' },
]

const QUICK_ACTIONS = [
  { label: '+ Add Employee',      href: '/tenant/employee-management/new' },
  { label: '📋 View Timesheets',  href: '/tenant/time-attendance' },
  { label: '📄 Upload Document',  href: '/tenant/document-management' },
  { label: '🏖 Approve Leave',    href: '/tenant/leave-management' },
]

export default async function TenantDashboard() {
  const headersList = await headers()
  const tenantSlug  = headersList.get('x-tenant-slug') ?? 'default'
  const config      = await getTenantStats(tenantSlug)
  const enabledModules: string[] = config?.enabledModules ?? []
  const tenantName  = config?.tenant?.name ?? 'Your Organisation'

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">{tenantName} · HR Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(a => (
            <a
              key={a.href}
              href={a.href}
              className="block bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition"
              style={{ borderRadius: 'var(--radius, 8px)' }}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* Enabled modules grid */}
      {enabledModules.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Modules</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {enabledModules.slice(0, 8).map(m => (
              <div
                key={m}
                className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium text-gray-600 capitalize"
                style={{ borderRadius: 'var(--radius, 8px)' }}
              >
                {m.replace(/-/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Getting started:</strong> Use the sidebar to navigate your HRMS modules. Data will populate once employees are added.
      </div>
    </div>
  )
}
