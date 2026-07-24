'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type DashboardData = {
  headcount: {
    total: number
    active: number
    byEntity: { name: string; count: number }[]
    byEmploymentType: { type: string; count: number }[]
    newThisMonth: number
    leavingThisMonth: number
  }
  payroll: {
    lastRunPeriodStart: string | null
    lastRunPeriodEnd:   string | null
    lastRunCount:       number
    lastRunGross:       string
    lastRunNet:         string
    lastRunSuper:       string
    ytdGross:           string
    ytdNet:             string
    ytdSuper:           string
  }
  leave: {
    pendingCount:          number
    approvedDaysThisMonth: number
    approvedDaysThisYear:  number
  }
  holidays: {
    upcoming: { name: string; date: string; country: string }[]
  }
  documents: {
    expiringIn30Days: number
    expiredActive:    number
  }
  incidents: {
    open:         number
    openCritical: number
  }
  compliance: {
    redCount:   number
    amberCount: number
  }
  generatedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CURRENCY = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function fmt(n: string | number) {
  return CURRENCY.format(typeof n === 'string' ? parseFloat(n) : n)
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtHolidayDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function daysUntil(d: string) {
  const diff = Math.round((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `in ${diff}d`
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', casual: 'Casual',
  contractor: 'Contractor', volunteer: 'Volunteer',
}
const EMP_TYPE_COLOR: Record<string, string> = {
  full_time: '#8b5cf6', part_time: '#06b6d4', casual: '#f59e0b',
  contractor: '#10b981', volunteer: '#64748b',
}
const ENTITY_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

const MODULE_SHORTCUTS = [
  { key: 'employee-management', icon: '', label: 'Employees', desc: 'View & manage staff' },
  { key: 'leave',           icon: '', label: 'Leave',       desc: 'Requests & balances' },
  { key: 'payroll',         icon: '', label: 'Payroll',     desc: 'Pay runs & exports' },
  { key: 'documents',       icon: '', label: 'Documents',   desc: 'Upload & manage docs' },
  { key: 'whs',             icon: '️', label: 'WHS',         desc: 'Incidents & hazards' },
  { key: 'public-holidays', icon: '', label: 'Holidays',    desc: 'Public holiday calendar' },
  { key: 'training',        icon: '', label: 'Training',    desc: 'Courses & records' },
  { key: 'recruitment',     icon: '', label: 'Recruitment', desc: 'Jobs & candidates' },
  { key: 'rostering',       icon: '', label: 'Rostering',   desc: 'Shifts & timesheets' },
  { key: 'onboarding',      icon: '', label: 'Onboarding',  desc: 'New starter checklist' },
  { key: 'settings',        icon: '',  label: 'Settings',    desc: 'Tenant configuration' },
  { key: 'audit-logs',      icon: '', label: 'Audit Log',   desc: 'System activity' },
]

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 shrink-0 truncate dark:text-gray-400">{item.label}</span>
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: item.color }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-900 dark:text-white w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Personal dashboard types ───────────────────────────────────────────────────
type LeaveRequest = { id: string; leaveType: string; startDate: string; endDate: string; totalDays: number; status: string }
type PublicHoliday = { name: string; date: string; country: string }
type LeaveBalance = {
  key: string; label: string; emoji: string; color: string
  entitlement: number | null; carriedForward: number; totalEntitlement: number | null
  taken: number; pending: number; remaining: number | null
  maxCarryForwardDays: number | null
}

const PERSONAL_SHORTCUTS = [
  { key: 'my-profile',   icon: '', label: 'My Profile',   desc: 'Your personal details' },
  { key: 'my-payslips',  icon: '', label: 'My Payslips',  desc: 'Pay history & slips' },
  { key: 'my-documents', icon: '', label: 'My Documents',  desc: 'Your documents' },
  { key: 'leave',        icon: '', label: 'Leave',         desc: 'Apply & track leave' },
  { key: 'timesheets',   icon: '⏱',label: 'Timesheets',   desc: 'Clock in / out' },
  { key: 'training',     icon: '', label: 'Training',      desc: 'Courses & records' },
  { key: 'rostering',    icon: '', label: 'Rostering',     desc: 'My schedule' },
  { key: 'benefits',     icon: '', label: 'Benefits',      desc: 'Entitlements' },
  { key: 'whs',          icon: '️', label: 'WHS',           desc: 'Report a hazard' },
  { key: 'recognition',  icon: '', label: 'Recognition',   desc: 'Kudos & shoutouts' },
  { key: 'referrals',    icon: '', label: 'Referrals',     desc: 'Refer a friend' },
  { key: 'engagement',   icon: '', label: 'Engagement',    desc: 'Pulse surveys' },
]

const LEAVE_TYPE_LABEL: Record<string, string> = {
  annual: 'Annual Leave', sick: 'Sick Leave', personal: 'Personal Leave',
  long_service: 'Long Service', parental: 'Parental Leave', unpaid: 'Unpaid Leave', other: 'Other',
}
const LEAVE_STATUS_COLOR: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function PersonalDashboard({ userName, tenantName, primaryColor, greetingText }: {
  userName: string; tenantName: string; primaryColor: string; greetingText: string
}) {
  const [leaveRequests,   setLeaveRequests]   = useState<LeaveRequest[]>([])
  const [holidays,        setHolidays]        = useState<PublicHoliday[]>([])
  const [leaveBalances,   setLeaveBalances]   = useState<LeaveBalance[]>([])
  const [employeeLinked,  setEmployeeLinked]  = useState(true)
  const [loadingPersonal, setLoadingPersonal] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/tenant/leave').then(r => r.json()).catch(() => ({ requests: [] })),
      fetch('/api/tenant/public-holidays').then(r => r.json()).catch(() => ({ holidays: [] })),
      fetch('/api/tenant/leave/balances').then(r => r.json()).catch(() => ({ balances: [], employeeLinked: false })),
    ]).then(([leaveData, holidayData, balanceData]) => {
      const today = new Date().toISOString().slice(0, 10)
      const reqs: LeaveRequest[] = (leaveData.requests ?? [])
        .sort((a: LeaveRequest, b: LeaveRequest) => b.startDate.localeCompare(a.startDate))
        .slice(0, 5)
      const upcomingHols: PublicHoliday[] = (holidayData.holidays ?? [])
        .filter((h: PublicHoliday) => h.date >= today)
        .slice(0, 5)
      setLeaveRequests(reqs)
      setHolidays(upcomingHols)
      // Only show types with an entitlement cap (skip 'unpaid' etc.)
      setLeaveBalances((balanceData.balances ?? []).filter((b: LeaveBalance) => b.entitlement != null))
      setEmployeeLinked(balanceData.employeeLinked !== false)
    }).finally(() => setLoadingPersonal(false))
  }, [])

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }}>
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greetingText || 'Welcome'},</p>
          <h1 className="text-2xl font-bold mt-0.5">{userName || '…'} </h1>
          <p className="text-sm opacity-70 mt-1">{tenantName || 'HRMS'} · Employee Portal</p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full opacity-10 bg-white" />
      </div>

      {/* Leave balance summary */}
      {employeeLinked && leaveBalances.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leave Balances — {new Date().getFullYear()}</h3>
            <Link href="/tenant/leave" className="text-xs text-purple-400 hover:text-purple-300">Full details →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {leaveBalances.map(b => {
              const cap   = b.totalEntitlement ?? b.entitlement ?? 0
              const pct   = cap > 0 ? Math.min(100, Math.round((b.taken / cap) * 100)) : 0
              const isLow = b.remaining != null && cap > 0 && b.remaining <= cap * 0.2
              return (
                <div key={b.key} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{b.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{b.label}</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className={`text-xl font-bold ${isLow ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                        {b.remaining ?? '—'}
                      </span>
                      <span className="text-xs text-gray-400">/ {cap}d</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-green-500'}`}
                        style={{ width: `${100 - pct}%` }}
                      />
                    </div>
                  </div>
                  {b.carriedForward > 0 && (
                    <span className="text-[10px] text-blue-500 dark:text-blue-400">+{b.carriedForward}d carried forward</span>
                  )}
                  {b.pending > 0 && (
                    <span className="text-[10px] text-yellow-600 dark:text-yellow-400">{b.pending}d pending</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {!employeeLinked && !loadingPersonal && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
          Your account isn&apos;t linked to an employee profile yet — leave balances won&apos;t show until an admin connects your account. Contact HR.
        </div>
      )}

      {/* Leave requests + upcoming holidays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Leave */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white"> My Leave</h3>
            <Link href="/tenant/leave" className="text-xs text-purple-400 hover:text-purple-300">View all →</Link>
          </div>
          {loadingPersonal ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
          ) : leaveRequests.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No leave requests yet.</p>
          ) : (
            <div className="space-y-2.5">
              {pendingCount > 0 && (
                <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2">
                  {pendingCount} request{pendingCount > 1 ? 's' : ''} pending approval
                </div>
              )}
              {leaveRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fmtDate(r.startDate)} · {r.totalDays}d
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_STATUS_COLOR[r.status] ?? ''}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/tenant/leave"
            className="block w-full text-center py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: primaryColor }}>
            + Apply for Leave
          </Link>
        </div>

        {/* Upcoming public holidays */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white"> Upcoming Holidays</h3>
            <Link href="/tenant/public-holidays" className="text-xs text-purple-400 hover:text-purple-300">All →</Link>
          </div>
          {loadingPersonal ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
          ) : holidays.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No upcoming holidays on record.</p>
          ) : (
            <div className="space-y-2.5">
              {holidays.map(h => (
                <div key={h.date + h.name} className="flex justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{h.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fmtHolidayDate(h.date)}</p>
                  </div>
                  <span className="text-xs text-purple-400 shrink-0 font-medium">{daysUntil(h.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal module shortcuts */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 dark:text-gray-400">My Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PERSONAL_SHORTCUTS.map(m => (
            <Link key={m.key} href={`/tenant/${m.key}`}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-4 py-4 flex flex-col items-center gap-2 text-center transition group">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white font-medium transition">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data,       setData]       = useState<DashboardData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [isPersonal, setIsPersonal] = useState(false)
  const [userName, setUserName] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6d28d9')
  const [greetingText, setGreetingText] = useState('') // client-only — avoids SSR hydration mismatch

  useEffect(() => {
    // Greeting is computed client-side only to avoid SSR/CSR hydration mismatch
    setGreetingText(greeting())
  }, [])

  useEffect(() => {
    // Load user info for greeting
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const email = d.user?.email ?? d.email ?? ''
      const name  = d.user?.name  ?? d.name  ?? ''
      // Prefer explicit name (e.g. from employee profile), else derive from email
      if (name && !name.startsWith('[Impersonated')) {
        setUserName(name)
      } else {
        setUserName(email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
      }
    }).catch(() => {})

    fetch('/api/tenant/config').then(r => r.json()).then(d => {
      setTenantName(d.name ?? '')
      setPrimaryColor(d.primaryColor ?? '#6d28d9')
    }).catch(() => {})

    loadDashboard()
  }, [])

  function loadDashboard() {
    setLoading(true)
    fetch('/api/tenant/dashboard')
      .then(r => {
        if (r.status === 403) { setIsPersonal(true); setLoading(false); return null }
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then(d => { if (d) { setData(d); setError(null) } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  if (isPersonal) {
    return <PersonalDashboard
      userName={userName}
      tenantName={tenantName}
      primaryColor={primaryColor}
      greetingText={greetingText}
    />
  }

  const hasAlerts = data && (
    data.compliance.redCount > 0 ||
    data.incidents.openCritical > 0 ||
    data.documents.expiredActive > 0
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greetingText || 'Welcome'},</p>
          <h1 className="text-2xl font-bold mt-0.5">{userName || '…'} </h1>
          <p className="text-sm opacity-70 mt-1">{tenantName || 'HRMS'} · HR Portal</p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white dark:bg-gray-900" />
        <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full opacity-10 bg-white dark:bg-gray-900" />
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={loadDashboard}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/80 transition">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {hasAlerts && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700/60 rounded-2xl px-5 py-4 flex flex-wrap gap-4 items-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 shrink-0">Attention required</p>
          {data!.compliance.redCount > 0 && (
            <Link href="/tenant/employee-management" className="text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 underline underline-offset-2">
              {data!.compliance.redCount} employee{data!.compliance.redCount > 1 ? 's' : ''} — red compliance
            </Link>
          )}
          {data!.incidents.openCritical > 0 && (
            <Link href="/tenant/whs" className="text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 underline underline-offset-2">
              {data!.incidents.openCritical} critical WHS incident{data!.incidents.openCritical > 1 ? 's' : ''}
            </Link>
          )}
          {data!.documents.expiredActive > 0 && (
            <Link href="/tenant/documents" className="text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 underline underline-offset-2">
              {data!.documents.expiredActive} expired document{data!.documents.expiredActive > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm dark:text-gray-400">
            Could not load live stats ({error}). You may not have manager-level access.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* ── Headcount stats ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 dark:text-gray-400">Workforce</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total', value: data.headcount.total, color: 'text-gray-900 dark:text-white', href: '/tenant/employee-management' },
                { label: 'Active', value: data.headcount.active, color: 'text-green-600 dark:text-green-400', href: '/tenant/employee-management' },
                { label: 'New This Month', value: data.headcount.newThisMonth, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Leaving This Month', value: data.headcount.leavingThisMonth, color: data.headcount.leavingThisMonth > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400' },
                { label: 'Amber Compliance', value: data.compliance.amberCount, color: data.compliance.amberCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400', href: '/tenant/employee-management' },
                { label: 'Red Compliance', value: data.compliance.redCount, color: data.compliance.redCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400', href: '/tenant/employee-management' },
              ].map(s => (
                <div key={s.label} className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 ${data.compliance.redCount > 0 && s.label === 'Red Compliance' ? 'border-red-300 dark:border-red-800/50' : 'border-gray-200 dark:border-gray-800'}`}>
                  {s.href ? (
                    <Link href={s.href} className="block">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-3xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-3xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Workforce breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">By Employment Type</h3>
              {data.headcount.byEmploymentType.length === 0
                ? <p className="text-sm text-gray-600 dark:text-gray-400">No data yet</p>
                : <MiniBar items={data.headcount.byEmploymentType.map(e => ({
                    label: EMP_TYPE_LABEL[e.type] ?? e.type,
                    value: e.count,
                    color: EMP_TYPE_COLOR[e.type] ?? '#64748b',
                  }))} />
              }
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">By Entity</h3>
              {data.headcount.byEntity.length === 0
                ? <p className="text-sm text-gray-600 dark:text-gray-400">No entity data yet — set entity on employee profiles</p>
                : <>
                    <MiniBar items={data.headcount.byEntity.map((e, i) => ({
                      label: e.name, value: e.count, color: ENTITY_COLORS[i % ENTITY_COLORS.length],
                    }))} />
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                      {data.headcount.byEntity.map((e, i) => (
                        <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ENTITY_COLORS[i % ENTITY_COLORS.length] }} />
                          {e.name} <span className="text-gray-900 dark:text-white font-medium">{e.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
              }
            </div>
          </div>

          {/* ── Payroll ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 dark:text-gray-400">Payroll</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Last Pay Run</h3>
                  <Link href="/tenant/payroll" className="text-xs text-purple-400 hover:text-purple-300">View all →</Link>
                </div>
                {data.payroll.lastRunPeriodEnd ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fmtDate(data.payroll.lastRunPeriodStart)} → {fmtDate(data.payroll.lastRunPeriodEnd)}
                      <span className="ml-2 text-gray-600 dark:text-gray-400">· {data.payroll.lastRunCount} employee{data.payroll.lastRunCount !== 1 ? 's' : ''}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Gross', value: data.payroll.lastRunGross, color: 'text-gray-900 dark:text-white' },
                        { label: 'Net',   value: data.payroll.lastRunNet,   color: 'text-green-700 dark:text-green-400' },
                        { label: 'Super', value: data.payroll.lastRunSuper, color: 'text-purple-700 dark:text-purple-400' },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-100 dark:bg-gray-800/60 rounded-xl px-3 py-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                          <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{fmt(s.value)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-gray-600 text-sm dark:text-gray-400">No pay runs yet</div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Year to Date — {new Date().getFullYear()}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Gross', value: data.payroll.ytdGross, color: 'text-gray-900 dark:text-white' },
                    { label: 'Net',   value: data.payroll.ytdNet,   color: 'text-green-700 dark:text-green-400' },
                    { label: 'Super', value: data.payroll.ytdSuper, color: 'text-purple-700 dark:text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-100 dark:bg-gray-800/60 rounded-xl px-3 py-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{fmt(s.value)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">All pay runs from 1 Jan {new Date().getFullYear()}</p>
              </div>
            </div>
          </section>

          {/* ── Leave / Holidays / Documents / WHS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leave</h3>
                <Link href="/tenant/leave" className="text-xs text-purple-400 hover:text-purple-300">View →</Link>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Pending approval',     value: data.leave.pendingCount,          alert: data.leave.pendingCount > 0 },
                  { label: 'Approved this month',  value: `${data.leave.approvedDaysThisMonth}d` },
                  { label: 'Approved YTD',          value: `${data.leave.approvedDaysThisYear}d` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{r.label}</span>
                    <span className={`text-sm font-bold ${'alert' in r && r.alert ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              {data.leave.pendingCount > 0 && (
                <Link href="/tenant/leave"
                  className="block w-full text-center py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-400 text-xs rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition">
                  Review {data.leave.pendingCount} pending
                </Link>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Holidays</h3>
                <Link href="/tenant/public-holidays" className="text-xs text-purple-400 hover:text-purple-300">All →</Link>
              </div>
              {data.holidays.upcoming.length === 0
                ? <p className="text-xs text-gray-600 dark:text-gray-400">No upcoming holidays on record</p>
                : <div className="space-y-2.5">
                    {data.holidays.upcoming.map(h => (
                      <div key={h.date + h.name} className="flex justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-900 dark:text-white font-medium leading-tight">{h.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{fmtHolidayDate(h.date)}</p>
                        </div>
                        <span className="text-xs text-purple-400 shrink-0 font-medium">{daysUntil(h.date)}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 space-y-4 ${data.documents.expiredActive > 0 ? 'border-red-300 dark:border-red-700/40' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Documents</h3>
                <Link href="/tenant/documents" className="text-xs text-purple-400 hover:text-purple-300">View →</Link>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Expiring in 30 days</span>
                  <span className={`text-sm font-bold ${data.documents.expiringIn30Days > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>{data.documents.expiringIn30Days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Already expired</span>
                  <span className={`text-sm font-bold ${data.documents.expiredActive > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{data.documents.expiredActive}</span>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 space-y-4 ${data.incidents.openCritical > 0 ? 'border-red-300 dark:border-red-700/40' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">️ WHS</h3>
                <Link href="/tenant/whs" className="text-xs text-purple-400 hover:text-purple-300">View →</Link>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Open incidents</span>
                  <span className={`text-sm font-bold ${data.incidents.open > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>{data.incidents.open}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Critical open</span>
                  <span className={`text-sm font-bold ${data.incidents.openCritical > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{data.incidents.openCritical}</span>
                </div>
              </div>
              {data.incidents.openCritical > 0 && (
                <Link href="/tenant/whs"
                  className="block w-full text-center py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700/40 text-red-700 dark:text-red-400 text-xs rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                  View critical incidents
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Module shortcuts ── (always shown) */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 dark:text-gray-400">Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULE_SHORTCUTS.map(m => (
            <Link key={m.key} href={`/tenant/${m.key}`}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-4 py-4 flex flex-col items-center gap-2 text-center transition group">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white font-medium transition">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
