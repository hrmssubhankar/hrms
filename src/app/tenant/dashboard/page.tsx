'use client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

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

// ── Activity feed types & helpers ─────────────────────────────────────────────
type ActivityItem = {
  id: string
  action: string
  resource: string
  resourceId: string | null
  newValues: Record<string, unknown> | null
  createdAt: string
  actorFirst: string | null
  actorLast: string | null
}

function describeActivity(item: ActivityItem): { icon: string; text: string } {
  const actor = item.actorFirst ? `${item.actorFirst} ${item.actorLast}` : 'System'
  const res = item.resource.replace(/_/g, ' ')
  switch (item.action) {
    case 'create': return { icon: '➕', text: `${actor} added a ${res}` }
    case 'update': return { icon: '✏️', text: `${actor} updated a ${res}` }
    case 'delete': return { icon: '🗑️', text: `${actor} removed a ${res}` }
    case 'approve': return { icon: '✅', text: `${actor} approved a ${res}` }
    case 'reject': return { icon: '❌', text: `${actor} rejected a ${res}` }
    case 'login': return { icon: '🔑', text: `${actor} logged in` }
    default: return { icon: '📋', text: `${actor} performed ${item.action} on ${res}` }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
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
  pending:  'badge badge-amber',
  approved: 'badge badge-green',
  rejected: 'badge badge-red',
  cancelled:'badge badge-gray',
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
      fetchWithAuth('/api/tenant/leave').then(r => r.json()).catch(() => ({ requests: [] })),
      fetchWithAuth('/api/tenant/public-holidays').then(r => r.json()).catch(() => ({ holidays: [] })),
      fetchWithAuth('/api/tenant/leave/balances').then(r => r.json()).catch(() => ({ balances: [], employeeLinked: false })),
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
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}f0, ${primaryColor}90)`,
          boxShadow: `0 8px 32px ${primaryColor}30`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10">
          <p className="text-[13px] font-medium opacity-75">{greetingText || 'Welcome'},</p>
          <h1 className="text-[22px] font-bold mt-0.5 tracking-tight">{userName || '…'}</h1>
          <p className="text-[13px] opacity-60 mt-0.5">{tenantName || 'HRMS'} · Employee Portal</p>
        </div>
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white opacity-[0.07] pointer-events-none" />
        <div className="absolute -right-4 -bottom-12 w-60 h-60 rounded-full bg-white opacity-[0.05] pointer-events-none" />
      </div>

      {/* Leave balance summary */}
      {employeeLinked && leaveBalances.length > 0 && (
        <div className="card-premium p-6">
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
                <div key={b.key} className="bg-black/[0.02] dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.04] p-3 flex flex-col gap-2">
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
        <div className="card-premium p-6 space-y-4">
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
        <div className="card-premium p-6 space-y-4">
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
        <h2 className="section-label mb-3">My Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PERSONAL_SHORTCUTS.map(m => (
            <Link key={m.key} href={`/tenant/${m.key}`}
              className="group card-premium px-4 py-4 flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-px hover:shadow-sm">
              <span className="text-2xl leading-none">{m.icon}</span>
              <span className="text-[12px] text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white font-medium transition-colors">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

type Celebration = {
  id: string; name: string; jobTitle: string | null; photoUrl: string | null
  type: 'birthday' | 'anniversary'; daysUntil: number; yearsCount?: number
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data,          setData]          = useState<DashboardData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [isPersonal,    setIsPersonal]    = useState(false)
  const [userName,      setUserName]      = useState('')
  const [tenantName,    setTenantName]    = useState('')
  const [primaryColor,  setPrimaryColor]  = useState('#6d28d9')
  const [greetingText,  setGreetingText]  = useState('')
  const [celebrations,  setCelebrations]  = useState<Celebration[]>([])
  const [activity,      setActivity]      = useState<ActivityItem[]>([])

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

    fetchWithAuth('/api/tenant/config').then(r => r.json()).then(d => {
      setTenantName(d.name ?? '')
      setPrimaryColor(d.primaryColor ?? '#6d28d9')
    }).catch(() => {})

    loadDashboard()
    // Activity feed (fire-and-forget; failure is silent)
    fetchWithAuth('/api/tenant/activity')
      .then(r => r.ok ? r.json() : [])
      .then(setActivity)
      .catch(() => {})
    // Celebrations widget (fire-and-forget; failure is silent)
    fetchWithAuth('/api/tenant/dashboard/celebrations')
      .then(r => r.ok ? r.json() : { celebrations: [] })
      .then(d => setCelebrations(d.celebrations ?? []))
      .catch(() => {})
  }, [])

  function loadDashboard() {
    setLoading(true)
    fetchWithAuth('/api/tenant/dashboard')
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
        style={{
          background: `linear-gradient(135deg, ${primaryColor}f0, ${primaryColor}90)`,
          boxShadow: `0 8px 32px ${primaryColor}30`,
        }}
      >
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium opacity-75">{greetingText || 'Welcome'},</p>
            <h1 className="text-[22px] font-bold mt-0.5 tracking-tight">{userName || '…'}</h1>
            <p className="text-[13px] opacity-60 mt-0.5">{tenantName || 'HRMS'} · HR Portal</p>
          </div>
          <button onClick={loadDashboard}
            className="shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/80 transition backdrop-blur-sm border border-white/10">
            ↻ Refresh
          </button>
        </div>
        {/* Decorative orbs */}
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white opacity-[0.07] pointer-events-none" />
        <div className="absolute -right-4 -bottom-12 w-60 h-60 rounded-full bg-white opacity-[0.05] pointer-events-none" />
      </div>

      {/* Alert banner */}
      {hasAlerts && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-5 py-3.5 flex flex-wrap gap-4 items-center">
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
            <div key={i} className="card-premium p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="card-premium p-8 text-center">
          <p className="text-gray-500 text-sm dark:text-gray-400">
            Could not load live stats ({error}). You may not have manager-level access.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* ── Headcount stats ── */}
          <section>
            <h2 className="section-label mb-3">Workforce</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: data.headcount.total, accent: null, href: '/tenant/employee-management' },
                { label: 'Active', value: data.headcount.active, accent: '#10b981', href: '/tenant/employee-management' },
                { label: 'New This Month', value: data.headcount.newThisMonth, accent: '#8b5cf6' },
                { label: 'Leaving', value: data.headcount.leavingThisMonth, accent: data.headcount.leavingThisMonth > 0 ? '#f59e0b' : null },
                { label: 'Amber Compliance', value: data.compliance.amberCount, accent: data.compliance.amberCount > 0 ? '#f59e0b' : null, href: '/tenant/employee-management' },
                { label: 'Red Compliance', value: data.compliance.redCount, accent: data.compliance.redCount > 0 ? '#ef4444' : null, href: '/tenant/employee-management' },
              ].map(s => (
                <div
                  key={s.label}
                  className="card-premium p-4 hover:border-black/10 dark:hover:border-white/10 transition-colors"
                  style={s.accent && s.label === 'Red Compliance' ? { borderColor: 'rgba(239,68,68,0.25)' } : {}}
                >
                  {s.href ? (
                    <Link href={s.href} className="block">
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">{s.label}</p>
                      <p
                        className={`text-2xl font-bold mt-1.5 tabular-nums ${!s.accent ? 'text-gray-900 dark:text-white' : ''}`}
                        style={s.accent ? { color: s.accent } : undefined}
                      >
                        {s.value}
                      </p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">{s.label}</p>
                      <p className="text-2xl font-bold mt-1.5 tabular-nums" style={{ color: s.accent ?? undefined }}>{s.value}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Workforce breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-premium p-6 space-y-4">
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
            <div className="card-premium p-6 space-y-4">
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
            <h2 className="section-label mb-3">Payroll</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-premium p-6 space-y-4">
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
                        <div key={s.label} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-3 py-3">
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

              <div className="card-premium p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Year to Date — {new Date().getFullYear()}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Gross', value: data.payroll.ytdGross, color: 'text-gray-900 dark:text-white' },
                    { label: 'Net',   value: data.payroll.ytdNet,   color: 'text-green-700 dark:text-green-400' },
                    { label: 'Super', value: data.payroll.ytdSuper, color: 'text-purple-700 dark:text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-3 py-3">
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

            <div className="card-premium p-6 space-y-4">
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

            <div className="card-premium p-6 space-y-4">
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

            <div className={`card-premium p-6 space-y-4 ${data.documents.expiredActive > 0 ? 'border-red-300/50 dark:border-red-700/40' : ''}`}>
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

            <div className={`card-premium p-6 space-y-4 ${data.incidents.openCritical > 0 ? 'border-red-300/50 dark:border-red-700/40' : ''}`}>
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

      {/* ── Recent Activity feed ── */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <Link href="/tenant/audit-logs" className="text-xs text-indigo-500 hover:text-indigo-700">View all →</Link>
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 8).map(item => {
              const { icon, text } = describeActivity(item)
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Celebrations widget ── */}
      {celebrations.length > 0 && (
        <section>
          <h2 className="section-label mb-3">Upcoming Celebrations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {celebrations.map(c => (
              <div key={`${c.id}-${c.type}`}
                className="card-premium px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {c.photoUrl
                    ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                    : c.type === 'birthday' ? '🎂' : '🎉'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {c.type === 'birthday'
                      ? 'Birthday'
                      : `${c.yearsCount} year anniversary`}
                    {' · '}
                    <span className="text-purple-500 font-medium">
                      {c.daysUntil === 0 ? 'Today!' : c.daysUntil === 1 ? 'Tomorrow' : `in ${c.daysUntil}d`}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Module shortcuts ── */}
      <section>
        <h2 className="section-label mb-3">Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULE_SHORTCUTS.map(m => (
            <Link key={m.key} href={`/tenant/${m.key}`}
              className="group card-premium px-4 py-4 flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-px hover:shadow-sm">
              <span className="text-2xl leading-none">{m.icon}</span>
              <span className="text-[12px] text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white font-medium transition-colors">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
