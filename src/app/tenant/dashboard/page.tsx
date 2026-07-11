import { headers } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getTenantConfig(slug: string) {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug))
    if (!tenant || !tenant.isActive) return null
    const modules = await db
      .select()
      .from(tenantModules)
      .where(and(eq(tenantModules.tenantId, tenant.id), eq(tenantModules.isEnabled, true)))
    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, primaryColor: tenant.primaryColor },
      enabledModules: modules.map(m => m.moduleName),
    }
  } catch { return null }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const MODULE_SHORTCUTS = [
  { key: 'employee-management',    icon: '👥', label: 'Employees',  desc: 'View & manage staff' },
  { key: 'leave-management',       icon: '🏖',  label: 'Leave',      desc: 'Approve & track leave' },
  { key: 'payroll',                icon: '💰', label: 'Payroll',    desc: 'Process & review pay' },
  { key: 'document-management',    icon: '📄', label: 'Documents',  desc: 'Upload & manage docs' },
  { key: 'compliance-screening',   icon: '🔒', label: 'Compliance', desc: 'Track requirements' },
  { key: 'onboarding',             icon: '🎉', label: 'Onboarding', desc: 'New starter checklist' },
  { key: 'training-development',   icon: '📚', label: 'Training',   desc: 'Courses & records' },
  { key: 'performance-management', icon: '📈', label: 'Performance',desc: 'Reviews & goals' },
  { key: 'recruitment',            icon: '🔍', label: 'Recruitment',desc: 'Jobs & applicants' },
  { key: 'whs-safety',             icon: '🦺', label: 'Safety',     desc: 'Incidents & WHS' },
  { key: 'reporting-analytics',    icon: '📊', label: 'Reports',    desc: 'Analytics & exports' },
  { key: 'time-attendance',        icon: '🕐', label: 'Timesheets', desc: 'Hours & rosters' },
  { key: 'communications',         icon: '✉️',  label: 'Comms',      desc: 'Internal messaging' },
]

const QUICK_ACTIONS = [
  { label: '+ Add Employee',      href: '/tenant/employee-management/new',   color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900' },
  { label: '✓ Approve Leave',     href: '/tenant/leave-management',          color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900' },
  { label: '📋 Log Timesheet',    href: '/tenant/time-attendance',           color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900' },
  { label: '📄 Upload Document',  href: '/tenant/document-management',       color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900' },
]

export default async function TenantDashboard() {
  const headersList = await headers()
  const tenantSlug  = headersList.get('x-tenant-slug') ?? 'default'
  const [config, session] = await Promise.all([
    getTenantConfig(tenantSlug),
    getSession(),
  ])

  const enabledModules: string[] = config?.enabledModules ?? []
  const tenantName  = config?.tenant?.name ?? 'Your Organisation'
  const primaryColor = config?.tenant?.primaryColor ?? '#1a4fff'
  const userEmail   = session?.email ?? ''
  const firstName   = userEmail.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const visibleShortcuts = MODULE_SHORTCUTS.filter(m => enabledModules.includes(m.key))

  return (
    <div className="space-y-7 max-w-6xl">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greeting()},</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-sm opacity-70 mt-1">{tenantName} · HR Portal</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full opacity-10 bg-white" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees',    value: '—', icon: '👥', color: 'border-blue-100 dark:border-blue-900',   bg: 'bg-blue-50 dark:bg-blue-950/30',    text: 'text-blue-600 dark:text-blue-400' },
          { label: 'On Leave Today',     value: '—', icon: '🏖', color: 'border-amber-100 dark:border-amber-900', bg: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-600 dark:text-amber-400' },
          { label: 'Pending Approvals',  value: '—', icon: '⏳', color: 'border-purple-100 dark:border-purple-900',bg: 'bg-purple-50 dark:bg-purple-950/30',text: 'text-purple-600 dark:text-purple-400' },
          { label: 'Compliance Due',     value: '—', icon: '🔒', color: 'border-red-100 dark:border-red-900',     bg: 'bg-red-50 dark:bg-red-950/30',      text: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 ${s.color}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.bg}`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(visibleShortcuts.length > 0 ? visibleShortcuts : MODULE_SHORTCUTS.slice(0, 6)).map(m => (
              <Link
                key={m.key}
                href={`/tenant/${m.key}`}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm rounded-2xl p-4 transition"
              >
                <span className="text-2xl">{m.icon}</span>
                <p className="text-sm font-semibold text-gray-800 dark:text-white mt-2">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition hover:shadow-sm ${a.color}`}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity placeholder */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl divide-y divide-gray-50 dark:divide-gray-800">
              {[
                { text: 'No recent activity yet', sub: 'Activity will appear here as you use the system', icon: '📋' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-4">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
