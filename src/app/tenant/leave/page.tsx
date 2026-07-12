'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type LeaveRequest = {
  id: string
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  employeeFirstName: string | null
  employeeLastName: string | null
  employeeEmail: string | null
}

type Stats = {
  total: number
  pending: number
  approved: number
  rejected: number
  cancelled: number
  totalDaysApproved: number
}

type Employee = { id: string; firstName: string; lastName: string }

// ── Constants ─────────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: 'annual',        label: '🌴 Annual Leave' },
  { value: 'sick',          label: '🤒 Sick Leave' },
  { value: 'personal',      label: '👤 Personal Leave' },
  { value: 'unpaid',        label: '💸 Unpaid Leave' },
  { value: 'long_service',  label: '🏅 Long Service Leave' },
  { value: 'carer',         label: '🤝 Carer\'s Leave' },
  { value: 'compassionate', label: '🕊 Compassionate Leave' },
]

const LEAVE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  LEAVE_TYPES.map(t => [t.value, t.label])
)

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  approved:  'bg-green-900/50  text-green-300  border-green-700',
  rejected:  'bg-red-900/50    text-red-300    border-red-700',
  cancelled: 'bg-gray-800      text-gray-400   border-gray-700',
}

const MANAGER_ROLES = ['director', 'hr_officer', 'operations_manager', 'team_leader', 'compliance_manager']

const INPUT  = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL  = 'block text-xs font-medium text-gray-400 mb-1'
const STAT   = 'bg-gray-800 border border-gray-700 rounded-xl p-4'

// Calculate calendar days inclusive
function calcDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return 0
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

function fmt(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeavePage() {
  const [requests,  setRequests]  = useState<LeaveRequest[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, pending:0, approved:0, rejected:0, cancelled:0, totalDaysApproved:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [canApprove, setCanApprove] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')

  // New request form
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    employeeId: '', leaveType: 'annual',
    startDate: '', endDate: '', reason: '',
  })
  const computedDays = calcDays(form.startDate, form.endDate)

  // Holidays that fall within the selected leave range
  const overlappingHolidays = (form.startDate && form.endDate)
    ? holidays.filter(h => h.date >= form.startDate && h.date <= form.endDate)
    : []

  // Expanded card + review state
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [reviewNote,  setReviewNote]  = useState<Record<string, string>>({})
  const [reviewing,   setReviewing]   = useState<string | null>(null)
  const [formError,   setFormError]   = useState<string | null>(null)

  // Public holidays — fetched once per year when form opens
  const [holidays,    setHolidays]    = useState<{ name: string; date: string }[]>([])

  // ── Detect role from /api/auth/me ──
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const role = (d.userRole ?? 'employee') as string
        setCanApprove(MANAGER_ROLES.includes(role))
      })
      .catch(() => {/* leave defaults */})
  }, [])

  const load = useCallback(async (st = filterStatus, t = filterType) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (st) p.set('status',    st)
    if (t)  p.set('leaveType', t)
    const res  = await fetch(`/api/tenant/leave?${p}`)
    const data = await res.json()
    setRequests(data.requests ?? [])
    setStats(data.stats ?? { total:0, pending:0, approved:0, rejected:0, cancelled:0, totalDaysApproved:0 })
    setLoading(false)
  }, [filterStatus, filterType])

  useEffect(() => {
    load()
    // Only managers need the full employee list (for submitting on behalf)
    fetch('/api/tenant/employees?status=active&limit=500')
      .then(r => r.json())
      .then(d => setEmployees(d.employees ?? []))
  }, [])

  // ── Submit new request ──
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (computedDays <= 0) return
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/tenant/leave', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, totalDays: computedDays }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? `Request failed (${res.status}). Please try again.`)
        setSaving(false)
        return
      }
      setShowForm(false)
      setForm({ employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' })
      load()
    } catch {
      setFormError('Network error — please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Approve / Reject ──
  async function review(id: string, action: 'approve' | 'reject') {
    setReviewing(id)
    await fetch('/api/tenant/leave', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, action, reviewNote: reviewNote[id] ?? '' }),
    })
    setReviewing(null)
    load()
  }

  // ── Cancel ──
  async function cancel(id: string) {
    setReviewing(id)
    await fetch('/api/tenant/leave', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, action: 'cancel' }),
    })
    setReviewing(null)
    load()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🏖 Leave Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {canApprove ? 'Review and manage team leave requests' : 'Submit and track your leave requests'}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true); setFormError(null)
            // Fetch holidays for the current year if not already loaded
            if (holidays.length === 0) {
              const year = new Date().getFullYear()
              fetch(`/api/tenant/public-holidays?year=${year}`)
                .then(r => r.json())
                .then(d => setHolidays(d.holidays ?? []))
                .catch(() => {})
            }
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',     value: stats.total,             color: 'text-white' },
          { label: 'Pending',   value: stats.pending,           color: 'text-yellow-400' },
          { label: 'Approved',  value: stats.approved,          color: 'text-green-400' },
          { label: 'Rejected',  value: stats.rejected,          color: 'text-red-400' },
          { label: 'Cancelled', value: stats.cancelled,         color: 'text-gray-500' },
          { label: 'Days Approved', value: stats.totalDaysApproved, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className={STAT}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); load(e.target.value, filterType) }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); load(filterStatus, e.target.value) }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All types</option>
          {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {(filterStatus || filterType) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterType(''); load('', '') }}
            className="text-xs text-gray-400 hover:text-white px-3 py-2 border border-gray-700 rounded-lg"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={submit}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">New Leave Request</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Manager can submit on behalf of an employee */}
            {canApprove && (
              <div>
                <label className={LABEL}>Employee (leave blank to submit for yourself)</label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className={INPUT}
                >
                  <option value="">— Myself —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={LABEL}>Leave Type *</label>
              <select
                value={form.leaveType}
                onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}
                className={INPUT}
                required
              >
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className={INPUT}
                  required
                />
              </div>
            </div>

            {computedDays > 0 && (
              <p className="text-xs text-purple-400 -mt-2">
                {computedDays} calendar day{computedDays !== 1 ? 's' : ''}
              </p>
            )}

            {overlappingHolidays.length > 0 && (
              <div className="rounded-lg bg-amber-900/30 border border-amber-700 px-4 py-3 text-sm text-amber-300 -mt-1">
                <p className="font-medium mb-1">🇦🇺 Public holiday{overlappingHolidays.length > 1 ? 's' : ''} in this period:</p>
                <ul className="space-y-0.5 text-xs text-amber-400">
                  {overlappingHolidays.map(h => (
                    <li key={h.date}>• {h.name} — {new Date(h.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className={LABEL}>Reason (optional)</label>
              <textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
                className={INPUT}
                placeholder="Briefly describe the reason for your leave…"
              />
            </div>

            {formError && (
              <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
                ⚠ {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || computedDays <= 0}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Submitting…' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null) }}
                className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700">
          <p className="text-4xl mb-3">🏖</p>
          <p className="text-gray-400 font-medium">No leave requests found</p>
          <p className="text-sm text-gray-600 mt-1">
            {canApprove ? 'No requests match your filters' : 'Submit your first leave request above'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const isExpanded = expanded === r.id
            const isBusy     = reviewing === r.id
            return (
              <div
                key={r.id}
                className="bg-gray-800/70 border border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-800 transition-colors"
                >
                  {/* Employee avatar */}
                  <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(r.employeeFirstName?.[0] ?? '?').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {canApprove && (
                        <span className="text-sm font-medium text-white">
                          {r.employeeFirstName} {r.employeeLastName}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(r.startDate)} → {fmt(r.endDate)}
                      <span className="ml-2 text-purple-400">{r.totalDays}d</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLE[r.status] ?? 'text-gray-400'}`}>
                      {r.status}
                    </span>
                    <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-700 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Requested on</p>
                        <p className="text-white">{fmt(r.createdAt)}</p>
                      </div>
                      {r.reason && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="text-gray-300">{r.reason}</p>
                        </div>
                      )}
                      {r.reviewedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Reviewed on</p>
                          <p className="text-white">{fmt(r.reviewedAt)}</p>
                        </div>
                      )}
                      {r.reviewNote && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Review note</p>
                          <p className="text-gray-300">{r.reviewNote}</p>
                        </div>
                      )}
                    </div>

                    {/* Manager actions — pending only */}
                    {canApprove && r.status === 'pending' && (
                      <div className="space-y-3 pt-2 border-t border-gray-700">
                        <div>
                          <label className={LABEL}>Note (optional)</label>
                          <input
                            type="text"
                            placeholder="Add a note for the employee…"
                            value={reviewNote[r.id] ?? ''}
                            onChange={e => setReviewNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                            className={INPUT}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => review(r.id, 'approve')}
                            disabled={isBusy}
                            className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            {isBusy ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => review(r.id, 'reject')}
                            disabled={isBusy}
                            className="flex-1 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            {isBusy ? '…' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Employee cancel — own pending request */}
                    {!canApprove && r.status === 'pending' && (
                      <div className="pt-2 border-t border-gray-700">
                        <button
                          onClick={() => cancel(r.id)}
                          disabled={isBusy}
                          className="px-4 py-2 border border-red-800 text-red-400 hover:bg-red-900/30 disabled:opacity-50 text-sm rounded-lg transition-colors"
                        >
                          {isBusy ? 'Cancelling…' : 'Cancel Request'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
