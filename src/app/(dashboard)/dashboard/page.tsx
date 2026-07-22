import { Users, ShieldCheck, AlertTriangle, UserPlus, TrendingUp, FileText } from 'lucide-react'

const stats = [
  { label: 'Active Employees',      value: '—', icon: Users,        color: 'text-blue-600',  bg: 'bg-blue-50' },
  { label: 'Compliance Score',      value: '—', icon: ShieldCheck,  color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Expiring This Month',   value: '—', icon: AlertTriangle,color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'New Starters (30 days)',value: '—', icon: UserPlus,     color: 'text-purple-600',bg: 'bg-purple-50' },
  { label: 'Open Recruitment',      value: '—', icon: TrendingUp,   color: 'text-indigo-600',bg: 'bg-indigo-50' },
  { label: 'Pending Documents',     value: '—', icon: FileText,     color: 'text-gray-600',  bg: 'bg-gray-50' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Real-time overview across Yahweh Care & Yahweh Property Care
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
              <span className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Compliance alerts placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 mb-4 dark:text-white">Compliance Alerts</h2>
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Connect database to load compliance alerts
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Add Employee',       href: '/employees/new' },
          { label: 'Start Onboarding',   href: '/onboarding/new' },
          { label: 'Record WHS Incident',href: '/whs/new' },
          { label: 'Generate Report',    href: '/reports' },
        ].map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="block bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 transition dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700"
          >
            {a.label} →
          </a>
        ))}
      </div>
    </div>
  )
}
