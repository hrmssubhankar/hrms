import { headers } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  tenants, tenantModules, employees, screeningRecords,
  supervisionRecords, grievances, timesheets, payrollRecords, auditLogs, users,
} from '@/lib/db/schema'
import { eq, and, ne, count, lt, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MODULE_SHORTCUTS = [
  { key: 'employee-management', icon: '👥', label: 'Employees',   desc: 'View & manage staff' },
  { key: 'compliance',          icon: '🔒', label: 'Compliance',  desc: 'Screening & tracking' },
  { key: 'onboarding',          icon: '🎉', label: 'Onboarding',  desc: 'New starter checklist' },
  { key: 'training',            icon: '📚', label: 'Training',    desc: 'Courses & records' },
  { key: 'performance',         icon: '📈', label: 'Performance', desc: 'Reviews & goals' },
  { key: 'recruitment',         icon: '🔍', label: 'Recruitment', desc: 'Jobs & candidates' },
  { key: 'rostering',           icon: '🕐', label: 'Rostering',   desc: 'Shifts & timesheets' },
  { key: 'payroll',             icon: '💰', label: 'Payroll',     desc: 'Pay runs & Xero' },
  { key: 'whs',                 icon: '🦺', label: 'Safety',      desc: 'WHS incidents' },
  { key: 'documents',           icon: '📄', label: 'Documents',   desc: 'Upload & manage docs' },
  { key: 'analytics',           icon: '📊', label: 'Analytics',   desc: 'Reports & insights' },
  { key: 'contracts',           icon: '📝', label: 'Contracts',   desc: 'Employment contracts' },
]

const QUICK_ACTIONS = [
  { label: '+ Add Employee',     href: '/tenant/employee-management/new' },
  { label: '📋 Log Timesheet',   href: '/tenant/rostering' },
  { label: '🔍 New Job',         href: '/tenant/recruitment' },
  { label: '📄 Upload Document', href: '/tenant/documents' },
]

const ACTION_COLOUR = [
  'bg-blue-900/30 text-blue-300 border-blue-800 hover:bg-blue-900/50',
  'bg-purple-900/30 text-purple-300 border-purple-800 hover:bg-purple-900/50',
  'bg-teal-900/30 text-teal-300 border-teal-800 hover:bg-teal-900/50',
  'bg-amber-900/30 text-amber-300 border-amber-800 hover:bg-amber-900/50',
]

const ACTION_LABEL_COLOUR: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  login:  'text-purple-400',
  export: 'text-amber-400',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function TenantDashboard() {
  const headersList = await headers()
  const tenantSlug  = headersList.get('x-tenant-slug') ?? 'default'

  const [tenantRow] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug))
  const session = await getSession()

  if (!tenantRow || !session?.tenantId) {
    return <p className="text-gray-400 p-8">Unable to load dashboard.</p>
  }

  const tid   = tenantRow.id
  const today = new Date().toISOString().split('T')[0]
  const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

  const [
    [{ total: totalEmployees }],
    [{ total: redScreenings }],
    [{ total: overdueSupervision }],
    [{ total: openGrievances }],
    [{ total: pendingTimesheets }],
    [{ total: pendingPayroll }],
    recentActivity,
  ] = await Promise.all([
    db.select({ total: count() })
      .from(employees)
      .where(and(eq(employees.tenantId, tid), eq(employees.isActive, true))),

    db.select({ total: count() })
      .from(screeningRecords)
      .where(and(
        eq(screeningRecords.tenantId, tid),
        sql`${screeningRecords.expiryDate} <= ${in30}`,
        ne(screeningRecords.status, 'green' as const),
      )),

    db.select({ total: count() })
      .from(supervisionRecords)
      .where(and(
        eq(supervisionRecords.tenantId, tid),
        eq(supervisionRecords.status, 'scheduled'),
        lt(supervisionRecords.scheduledDate, today),
      )),

    db.select({ total: count() })
      .from(grievances)
      .where(and(
        eq(grievances.tenantId, tid),
        ne(grievances.status, 'closed'),
      )),

    db.select({ total: count() })
      .from(timesheets)
      .where(and(eq(timesheets.tenantId, tid), eq(timesheets.status, 'pending'))),

    db.select({ total: count() })
      .from(payrollRecords)
      .where(and(eq(payrollRecords.tenantId, tid), eq(payrollRecords.status, 'pending'))),

    db.select({
      id:        auditLogs.id,
      action:    auditLogs.action,
      resource:  auditLogs.resource,
      createdAt: auditLogs.createdAt,
      userEmail: users.email,
    })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.tenantId, tid))
      .orderBy(sql`${auditLogs.createdAt} desc`)
      .limit(8),
  ])

  const tenantName   = tenantRow.name
  const primaryColor = tenantRow.primaryColor ?? '#6d28d9'
  const userEmail    = session.email ?? ''
  const firstName    = userEmail.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const stats = [
    { label: 'Active Employees',     value: totalEmployees,    icon: '👥', color: 'text-blue-400',   href: '/tenant/employee-management' },
    { label: 'Pending Timesheets',   value: pendingTimesheets, icon: '⏱',  color: 'text-purple-400', href: '/tenant/rostering' },
    { label: 'Compliance Alerts',    value: redScreenings,     icon: '🔒', color: 'text-amber-400',  href: '/tenant/compliance' },
    { label: 'Open Grievances',      value: openGrievances,    icon: '⚖️',  color: 'text-red-400',    href: '/tenant/grievances' },
    { label: 'Overdue Supervisions', value: overdueSupervision,icon: '👁',  color: 'text-orange-400', href: '/tenant/supervision' },
    { label: 'Payroll Pending',      value: pendingPayroll,    icon: '💰', color: 'text-green-400',  href: '/tenant/payroll' },
  ]

  return (
    <div className="space-y-7 max-w-6xl">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greeting()},</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-sm opacity-70 mt-1">{tenantName} · HR Portal</p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full opacity-10 bg-white" />
      </div>

      {/* Live stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xs text-gray-500 group-hover:text-gray-400 transition">{s.label}</p>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{Number(s.value)}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Module shortcuts */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODULE_SHORTCUTS.map(m => (
              <Link key={m.key} href={`/tenant/${m.key}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 rounded-xl p-3.5 transition group">
                <span className="text-xl">{m.icon}</span>
                <p className="text-sm font-semibold text-white mt-2 group-hover:text-purple-300 transition">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((a, i) => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center px-4 py-2.5 rounded-xl border text-sm font-medium transition ${ACTION_COLOUR[i]}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Activity</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800/60 overflow-hidden">
              {recentActivity.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-600 text-sm">No activity yet</p>
                </div>
              ) : recentActivity.map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold uppercase ${ACTION_LABEL_COLOUR[a.action] ?? 'text-gray-400'}`}>
                      {a.action}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{a.resource}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {a.userEmail ?? 'System'} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-AU') : ''}
                  </p>
                </div>
              ))}
              <Link href="/tenant/audit-logs"
                className="block px-4 py-2.5 text-xs text-purple-400 hover:text-purple-300 text-center transition">
                View all activity →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
