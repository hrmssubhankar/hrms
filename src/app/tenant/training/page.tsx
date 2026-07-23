'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type Course = {
  id: string; title: string; description: string | null; category: string | null
  isMandatory: boolean; validityMonths: number | null; isActive: boolean; createdAt: string
}
type TrainingRecord = {
  id: string; employeeId: string; courseId: string; status: string
  completedAt: string | null; expiryDate: string | null; score: string | null
  attempts: number; certificateUrl: string | null; createdAt: string
  courseTitle: string | null; courseCategory: string | null
  courseMandatory: boolean | null; courseValidity: number | null
  employeeFirstName: string | null; employeeLastName: string | null; employeeEmail: string | null
}
type TrainingStats = { total: number; enrolled: number; completed: number; overdue: number; expiring: number }
type Employee = { id: string; firstName: string; lastName: string }

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ['Mandatory', 'WHS & Safety', 'NDIS Practice Standards', 'Clinical', 'Leadership', 'IT & Systems', 'HR Policy', 'Other']

const STATUS_STYLE: Record<string, string> = {
  enrolled:  'bg-blue-900/50 text-blue-300 border-blue-800',
  completed: 'bg-green-900/50 text-green-300 border-green-800',
  overdue:   'bg-red-900/50 text-red-300 border-red-800',
  expired:   'bg-gray-800 text-gray-400 border-gray-700',
}

const INPUT = 'w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500'

function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const [tab, setTab] = useState<'library' | 'records'>('library')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Training & LMS</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage courses, enrolments and completion records</p>
      </div>

      <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 w-fit">
        {([
          { key: 'library', label: 'Course Library' },
          { key: 'records', label: 'Training Records' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' && <LibraryTab />}
      {tab === 'records' && <RecordsTab />}
    </div>
  )
}

// ── Course Library ─────────────────────────────────────────────────────────
function LibraryTab() {
  const [courseList,  setCourseList]  = useState<Course[]>([])
  const [categories,  setCategories]  = useState<string[]>([])
  const [employees,   setEmployees]   = useState<Employee[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null)
  const [enrollIds,   setEnrollIds]   = useState<string[]>([])
  const [enrolling,   setEnrolling]   = useState(false)
  const [form, setForm] = useState({
    title:'', description:'', category:'', isMandatory: false, validityMonths:''
  })

  const load = useCallback(async (s = search, c = filterCat) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (s) p.set('search', s)
    if (c) p.set('category', c)
    const res  = await fetch(`/api/tenant/training/courses?${p}`)
    const data = await res.json()
    setCourseList(data.courses ?? [])
    setCategories(data.categories ?? [])
    setLoading(false)
  }, [search, filterCat])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function createCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/training/courses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, validityMonths: form.validityMonths ? Number(form.validityMonths) : null }),
    })
    setShowForm(false)
    setForm({ title:'', description:'', category:'', isMandatory:false, validityMonths:'' })
    setSaving(false)
    load()
  }

  async function enrol() {
    if (!enrollCourse || !enrollIds.length) return
    setEnrolling(true)
    await fetch('/api/tenant/training/records', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: enrollCourse.id, employeeIds: enrollIds }),
    })
    setEnrolling(false)
    setEnrollCourse(null)
    setEnrollIds([])
  }

  async function archiveCourse(id: string) {
    if (!confirm('Archive this course?')) return
    await fetch('/api/tenant/training/courses', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: false }),
    })
    load()
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value, filterCat) }}
          placeholder="Search courses…"
          className="flex-1 min-w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(search, e.target.value) }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
          <option value="">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancel' : '+ New Course'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createCourse} className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">New Course</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Course Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. NDIS Module 1 — Participant Rights" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Validity (months)</label>
              <input type="number" min="1" value={form.validityMonths}
                onChange={e => setForm(f => ({ ...f, validityMonths: e.target.value }))}
                placeholder="Leave blank = no expiry" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Optional course description…" className={INPUT} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isMandatory} onChange={e => setForm(f => ({ ...f, isMandatory: e.target.checked }))}
              className="w-4 h-4 rounded accent-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Mandatory for all employees</span>
          </label>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Creating…' : 'Create Course'}
          </button>
        </form>
      )}

      {/* Enrol modal */}
      {enrollCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Enrol Employees</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Course: <span className="text-white font-medium">{enrollCourse.title}</span></p>
            <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
              {employees.map(e => (
                <label key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:bg-gray-800 cursor-pointer">
                  <input type="checkbox"
                    checked={enrollIds.includes(e.id)}
                    onChange={ev => setEnrollIds(ids => ev.target.checked ? [...ids, e.id] : ids.filter(i => i !== e.id))}
                    className="accent-purple-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{e.firstName} {e.lastName}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{enrollIds.length} employee{enrollIds.length !== 1 ? 's' : ''} selected</p>
            <div className="flex gap-2">
              <button onClick={enrol} disabled={enrolling || !enrollIds.length}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm py-2 rounded-lg transition">
                {enrolling ? 'Enrolling…' : 'Enrol Selected'}
              </button>
              <button onClick={() => { setEnrollCourse(null); setEnrollIds([]) }}
                className="px-4 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-white text-sm rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course grid */}
      {loading ? <div className="text-gray-600 dark:text-gray-400 text-sm">Loading…</div> : courseList.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No courses yet</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Create your first course to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {courseList.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 dark:border-gray-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {c.isMandatory && (
                      <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full font-medium">Mandatory</span>
                    )}
                    {c.category && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{c.category}</span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-snug">{c.title}</h3>
                </div>
              </div>
              {c.description && (
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 dark:text-gray-400">{c.description}</p>
              )}
              <div className="flex items-center justify-between pt-1 mt-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {c.validityMonths ? `Expires every ${c.validityMonths}mo` : 'No expiry'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setEnrollCourse(c); setEnrollIds([]) }}
                    className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg transition font-medium">
                    + Enrol
                  </button>
                  <button onClick={() => archiveCourse(c.id)}
                    className="text-xs text-gray-500 hover:text-red-400 border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 rounded-lg transition dark:text-gray-400">
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Training Records ───────────────────────────────────────────────────────
function RecordsTab() {
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [stats,   setStats]   = useState<TrainingStats>({ total:0, enrolled:0, completed:0, overdue:0, expiring:0 })
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async (s = search, f = filterStatus) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (s) p.set('search', s)
    if (f) p.set('status', f)
    const res  = await fetch(`/api/tenant/training/records?${p}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0,enrolled:0,completed:0,overdue:0,expiring:0 })
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { load() }, [])

  async function markComplete(id: string) {
    const score = prompt('Enter score (0-100) or leave blank:')
    setUpdating(id)
    await fetch('/api/tenant/training/records', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed', score: score ? Number(score) : null }),
    })
    setUpdating(null)
    load()
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,     color: 'text-white' },
          { label: 'Enrolled',   value: stats.enrolled,  color: 'text-blue-400' },
          { label: 'Completed',  value: stats.completed, color: 'text-green-400' },
          { label: 'Overdue',    value: stats.overdue,   color: 'text-red-400' },
          { label: 'Expiring',   value: stats.expiring,  color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value, filterStatus) }}
          placeholder="Search employee or course…"
          className="flex-1 min-w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(search, e.target.value) }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          <option value="enrolled">Enrolled</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <div className="text-gray-600 dark:text-gray-400 text-sm">Loading…</div> : records.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No training records</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Enrol employees in a course from the Course Library tab.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Course</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Score</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Expiry</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const days = daysUntil(r.expiryDate)
                const expiryWarn = days !== null && days >= 0 && days <= 30
                const expired    = days !== null && days < 0
                return (
                  <tr key={r.id} className="border-b border-gray-200 dark:border-gray-800/50 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800/20 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{r.employeeFirstName} {r.employeeLastName}</p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">{r.employeeEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 dark:text-gray-200 text-sm">{r.courseTitle}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {r.courseCategory && <span className="text-xs text-gray-500 dark:text-gray-400">{r.courseCategory}</span>}
                        {r.courseMandatory && <span className="text-xs bg-red-900/40 text-red-400 px-1.5 rounded">Mandatory</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-sm">
                      {r.score ? `${Number(r.score).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {r.expiryDate ? (
                        <span className={expired ? 'text-red-400 font-medium' : expiryWarn ? 'text-amber-400' : 'text-gray-400'}>
                          {new Date(r.expiryDate).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' })}
                          {expired    && ' '}
                          {expiryWarn && !expired && ` (${days}d)`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.status !== 'completed' && (
                        <button onClick={() => markComplete(r.id)} disabled={updating === r.id}
                          className="text-xs text-green-400 hover:text-green-300 border border-green-900 px-2.5 py-1 rounded-lg transition font-medium">
                          {updating === r.id ? '…' : 'Complete'}
                        </button>
                      )}
                      {r.status === 'completed' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-AU') : 'Done'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
