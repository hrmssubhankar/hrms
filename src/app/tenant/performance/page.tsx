'use client'

import { useEffect, useState, useCallback } from 'react'

type Review = {
  id: string; employeeId: string; reviewerId: string | null; type: string; status: string
  scheduledDate: string | null; completedAt: string | null; overallRating: string | null
  kpis: { id: string; area: string; rating: number | null; notes: string }[]
  developmentPlan: string | null; outcome: string | null
  createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
  employeeEmail: string | null; employeeStartDate: string | null; probationEndDate: string | null
}
type Stats = { total: number; scheduled: number; completed: number; overdue: number; probation: number }
type Employee = { id: string; firstName: string; lastName: string }

const REVIEW_TYPES = [
  { value: 'probation_4wk',   label: '4-Week Probation Check' },
  { value: 'mid_probation',   label: 'Mid-Probation Review' },
  { value: 'end_probation',   label: 'End-of-Probation Review' },
  { value: 'annual',          label: 'Annual Performance Review' },
  { value: 'kpi',             label: 'KPI Review' },
  { value: 'pip',             label: 'Performance Improvement Plan' },
]

const OUTCOMES = [
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'extended',   label: '⏳ Extended Probation' },
  { value: 'pip',        label: 'PIP Issued' },
  { value: 'terminated', label: 'Terminated' },
]

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-900/50 text-blue-300 border-blue-800',
  completed: 'bg-green-900/50 text-green-300 border-green-800',
  overdue:   'bg-red-900/50 text-red-300 border-red-800',
}

const RATING_LABELS = ['', 'Unsatisfactory', 'Needs Improvement', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding']

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function PerformancePage() {
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, scheduled:0, completed:0, overdue:0, probation:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [form, setForm] = useState({ employeeId:'', type:'end_probation', scheduledDate:'' })
  const [editing, setEditing] = useState<{ id: string; kpis: Review['kpis']; rating: string; plan: string; outcome: string } | null>(null)

  const load = useCallback(async (s = search, st = filterStatus, t = filterType) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (s)  p.set('search', s)
    if (st) p.set('status', st)
    if (t)  p.set('type', t)
    const res  = await fetch(`/api/tenant/performance?${p}`)
    const data = await res.json()
    setReviews(data.records ?? [])
    setStats(data.stats ?? { total:0,scheduled:0,completed:0,overdue:0,probation:0 })
    setLoading(false)
  }, [search, filterStatus, filterType])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function createReview(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/performance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ employeeId:'', type:'end_probation', scheduledDate:'' })
    setSaving(false)
    load()
  }

  async function completeReview() {
    if (!editing) return
    setSaving(true)
    const avgRating = editing.kpis.filter(k => k.rating).length
      ? editing.kpis.reduce((s, k) => s + (k.rating ?? 0), 0) / editing.kpis.filter(k => k.rating).length
      : null
    await fetch('/api/tenant/performance', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        status: 'completed',
        kpis: editing.kpis,
        overallRating: editing.rating || avgRating,
        developmentPlan: editing.plan,
        outcome: editing.outcome,
      }),
    })
    setEditing(null)
    setSaving(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Management</h1>
          <p className="text-gray-400 text-sm mt-1">Probation check-ins, KPI reviews and performance plans</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Schedule Review'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,     color: 'text-white' },
          { label: 'Scheduled',  value: stats.scheduled, color: 'text-blue-400' },
          { label: 'Completed',  value: stats.completed, color: 'text-green-400' },
          { label: 'Overdue',    value: stats.overdue,   color: 'text-red-400' },
          { label: 'Probation',  value: stats.probation, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createReview} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">Schedule Review</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Review Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {REVIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Scheduled Date</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Scheduling…' : 'Schedule Review'}
          </button>
        </form>
      )}

      {/* Complete review modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl space-y-5 my-4">
            <h3 className="text-lg font-bold text-white">Complete Review</h3>

            {/* KPI Ratings */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">KPI Ratings (1–5)</p>
              {editing.kpis.map((kpi, i) => (
                <div key={kpi.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-white">{kpi.area}</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        onClick={() => {
                          const k = [...editing.kpis]
                          k[i] = { ...k[i], rating: n }
                          setEditing({ ...editing, kpis: k })
                        }}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                          kpi.rating === n ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  {kpi.rating && <p className="text-xs text-purple-400">{RATING_LABELS[kpi.rating]}</p>}
                  <input
                    value={kpi.notes}
                    onChange={e => {
                      const k = [...editing.kpis]
                      k[i] = { ...k[i], notes: e.target.value }
                      setEditing({ ...editing, kpis: k })
                    }}
                    placeholder="Notes for this area…"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none" />
                </div>
              ))}
            </div>

            {/* Overall rating */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Overall Rating (override, 1–5)</label>
              <input type="number" min="1" max="5" step="0.1" value={editing.rating}
                onChange={e => setEditing({ ...editing, rating: e.target.value })}
                placeholder="Leave blank to auto-average KPIs"
                className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>

            {/* Outcome */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Outcome</label>
              <div className="flex gap-2 flex-wrap">
                {OUTCOMES.map(o => (
                  <button key={o.value} type="button"
                    onClick={() => setEditing({ ...editing, outcome: o.value })}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                      editing.outcome === o.value ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Development plan */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Development Plan / Notes</label>
              <textarea value={editing.plan} onChange={e => setEditing({ ...editing, plan: e.target.value })}
                rows={3} placeholder="Goals, actions, training requirements…"
                className={INPUT} />
            </div>

            <div className="flex gap-2">
              <button onClick={completeReview} disabled={saving}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white text-sm py-2 rounded-lg transition font-medium">
                {saving ? 'Saving…' : 'Mark Complete'}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-5 border border-gray-700 text-gray-300 hover:text-white text-sm rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value, filterStatus, filterType) }}
          placeholder="Search employee…"
          className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(search, e.target.value, filterType) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); load(search, filterStatus, e.target.value) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All types</option>
          {REVIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : reviews.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No reviews scheduled</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Schedule a review for an employee to get started.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Scheduled</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Rating</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Outcome</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium">{r.employeeFirstName} {r.employeeLastName}</p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">{r.employeeEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-300 text-sm">
                    {REVIEW_TYPES.find(t => t.value === r.type)?.label ?? r.type}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.overallRating ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{Number(r.overallRating).toFixed(1)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/5</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.outcome ? (
                      <span className="text-xs text-gray-300">
                        {OUTCOMES.find(o => o.value === r.outcome)?.label ?? r.outcome}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.status !== 'completed' ? (
                      <button
                        onClick={() => setEditing({ id: r.id, kpis: r.kpis ?? [], rating: '', plan: r.developmentPlan ?? '', outcome: r.outcome ?? '' })}
                        className="text-xs text-purple-400 hover:text-purple-300 border border-purple-900 px-2.5 py-1 rounded-lg transition font-medium">
                        Complete →
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-AU') : 'Done'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
