'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type ScreeningRecord = {
  id: string; employeeId: string; checkType: string; status: string
  referenceNumber: string | null; issuedDate: string | null; expiryDate: string | null
  notes: string | null; verifiedAt: string | null; createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
  employeeEmail: string | null; employeeIsActive: boolean | null; employeeNdis: boolean | null
}
type TrackingRecord = {
  id: string; employeeId: string; itemType: string; status: string
  dueDate: string | null; lastCheckedAt: string | null; escalatedAt: string | null
  notes: string | null; updatedAt: string
  employeeFirstName: string | null; employeeLastName: string | null; employeeEmail: string | null
}
type LockException = {
  id: string; employeeId: string; reason: string; expiresAt: string
  approvedAt: string; isActive: boolean
  employeeFirstName: string | null; employeeLastName: string | null; employeeEmail: string | null
}
type ScreeningStats = { total: number; green: number; amber: number; red: number; pending: number; expiring: number; expired: number }
type TrackingStats  = { total: number; green: number; amber: number; red: number; pending: number }
type Employee       = { id: string; firstName: string; lastName: string }

// ── Constants ──────────────────────────────────────────────────────────────
const CHECK_TYPES = [
  'Police Check', 'NDIS Worker Screening', 'Working with Children Check',
  'Right to Work', 'Qualification Verification', 'Reference Check', 'Other',
]

const STATUS_BADGE: Record<string, string> = {
  green:   'bg-green-900/60 text-green-300 border-green-800',
  amber:   'bg-amber-900/60 text-amber-300 border-amber-800',
  red:     'bg-red-900/60 text-red-300 border-red-800',
  pending: 'bg-gray-800 text-gray-400 border-gray-700',
}
const STATUS_DOT: Record<string, string> = {
  green: 'bg-green-400', amber: 'bg-amber-400', red: 'bg-red-400', pending: 'bg-gray-500',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

function statusLabel(s: string) {
  if (s === 'in_progress') return 'In Progress'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function daysUntil(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  return diff
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CompliancePage() {
  const [tab, setTab] = useState<'screening' | 'tracking' | 'lock'>('screening')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compliance Centre</h1>
        <p className="text-gray-400 text-sm mt-1">Pre-employment screening, compliance tracking & lock exceptions</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {([
          { key: 'screening', label: 'Screening',   desc: 'Module 6' },
          { key: 'tracking',  label: 'Tracking',    desc: 'Module 8' },
          { key: 'lock',      label: 'Lock',        desc: 'Module 7' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'screening' && <ScreeningTab />}
      {tab === 'tracking'  && <TrackingTab />}
      {tab === 'lock'      && <LockTab />}
    </div>
  )
}

// ── Screening Tab ──────────────────────────────────────────────────────────
function ScreeningTab() {
  const [records,   setRecords]   = useState<ScreeningRecord[]>([])
  const [stats,     setStats]     = useState<ScreeningStats>({ total:0, green:0, amber:0, red:0, pending:0, expiring:0, expired:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ employeeId:'', checkType:'Police Check', referenceNumber:'', issuedDate:'', expiryDate:'', notes:'' })
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')

  const load = useCallback(async (s = search, f = filterStatus) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (s) p.set('search', s)
    if (f) p.set('status', f)
    const res  = await fetch(`/api/tenant/compliance/screening?${p}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0,green:0,amber:0,red:0,pending:0,expiring:0,expired:0 })
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/compliance/screening', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ employeeId:'', checkType:'Police Check', referenceNumber:'', issuedDate:'', expiryDate:'', notes:'' })
    setSaving(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tenant/compliance/screening', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setEditId(null)
    load()
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Checks',   value: stats.total,    color: 'text-white' },
          { label: 'Verified',     value: stats.green,    color: 'text-green-400' },
          { label: 'Expiring <30d', value: stats.expiring, color: 'text-amber-400' },
          { label: 'Expired/Red',  value: stats.red + stats.expired, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value, filterStatus) }}
          placeholder="Search employee…"
          className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(search, e.target.value) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="green">Verified</option>
          <option value="amber">Amber</option>
          <option value="red">Red / Expired</option>
        </select>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Add Check'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">New Screening Check</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Check Type *</label>
              <select required value={form.checkType} onChange={e => setForm(f => ({ ...f, checkType: e.target.value }))} className={INPUT}>
                {CHECK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reference No.</label>
              <input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))}
                placeholder="e.g. NWS-12345" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Issued Date</label>
              <input type="date" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes" className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Saving…' : 'Add Check'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2"></p>
              <p className="text-gray-400 text-sm">No screening records. Add the first check above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Employee</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Check Type</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Ref No.</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Expiry</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const days = daysUntil(r.expiryDate)
                  const expiryWarning = days !== null && days >= 0 && days <= 30
                  const expired       = days !== null && days < 0
                  return (
                    <tr key={r.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition">
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium text-sm">{r.employeeFirstName} {r.employeeLastName}</p>
                        <p className="text-gray-500 text-xs">{r.employeeEmail}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-300 text-sm">{r.checkType}</span>
                        {r.employeeNdis && <span className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">NDIS</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {editId === r.id ? (
                          <div className="flex gap-1">
                            {(['pending','green','amber','red'] as const).map(s => (
                              <button key={s} onClick={() => updateStatus(r.id, s)}
                                className={`text-xs px-2 py-1 rounded border ${STATUS_BADGE[s]} hover:opacity-80`}>
                                {statusLabel(s)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? 'bg-gray-500'}`} />
                            {statusLabel(r.status)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{r.referenceNumber ?? '—'}</td>
                      <td className="px-5 py-3.5 text-xs">
                        {r.expiryDate ? (
                          <span className={expired ? 'text-red-400 font-medium' : expiryWarning ? 'text-amber-400 font-medium' : 'text-gray-400'}>
                            {new Date(r.expiryDate).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' })}
                            {expired       && ' (Expired)'}
                            {expiryWarning && !expired && ` (${days}d)`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setEditId(editId === r.id ? null : r.id)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                          {editId === r.id ? 'Cancel' : 'Update ↓'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tracking Tab ───────────────────────────────────────────────────────────
function TrackingTab() {
  const [records,   setRecords]   = useState<TrackingRecord[]>([])
  const [stats,     setStats]     = useState<TrackingStats>({ total:0, green:0, amber:0, red:0, pending:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ employeeId:'', itemType:'', dueDate:'', notes:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/tenant/compliance/tracking')
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0,green:0,amber:0,red:0,pending:0 })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/compliance/tracking', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ employeeId:'', itemType:'', dueDate:'', notes:'' })
    setSaving(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tenant/compliance/tracking', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  return (
    <div className="space-y-5">
      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: stats.total,   color: 'text-white' },
          { label: 'Green', value: stats.green,   color: 'text-green-400' },
          { label: 'Amber', value: stats.amber,   color: 'text-amber-400' },
          { label: 'Red',   value: stats.red,     color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">New Compliance Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Item Type *</label>
              <input required value={form.itemType} onChange={e => setForm(f => ({ ...f, itemType: e.target.value }))}
                placeholder="e.g. NDIS Renewal, Annual Declaration" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </form>
      )}

      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2"></p>
              <p className="text-gray-400 text-sm">No compliance tracking items yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Employee</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Item</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Due Date</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Last Checked</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Update</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{r.employeeFirstName} {r.employeeLastName}</p>
                      <p className="text-gray-500 text-xs">{r.employeeEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">{r.itemType}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? 'bg-gray-500'}`} />
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {r.lastCheckedAt ? new Date(r.lastCheckedAt).toLocaleDateString('en-AU') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {(['green','amber','red'] as const).map(s => (
                          <button key={s} onClick={() => updateStatus(r.id, s)}
                            className={`text-xs px-2 py-1 rounded border transition hover:opacity-80 ${STATUS_BADGE[s]} ${r.status === s ? 'ring-1 ring-white/30' : ''}`}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Lock Tab ───────────────────────────────────────────────────────────────
function LockTab() {
  const [records,   setRecords]   = useState<LockException[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ employeeId:'', reason:'', expiresAt:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/tenant/compliance/lock')
    const data = await res.json()
    setRecords(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/compliance/lock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ employeeId:'', reason:'', expiresAt:'' })
    setSaving(false)
    load()
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this exception?')) return
    await fetch('/api/tenant/compliance/lock', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: false }),
    })
    load()
  }

  const active   = records.filter(r => r.isActive && new Date(r.expiresAt) > new Date())
  const inactive = records.filter(r => !r.isActive || new Date(r.expiresAt) <= new Date())

  return (
    <div className="space-y-5">
      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-sm text-amber-300">
        ️ Compliance Lock exceptions allow non-compliant employees to temporarily work while gaps are resolved. Each exception requires a reason and expiry date and is logged for audit purposes.
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Grant Exception'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-amber-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-300">Grant Temporary Exception</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Exception Expires *</label>
              <input required type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Reason *</label>
            <textarea required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="Reason for granting exception…" className={INPUT} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Granting…' : 'Grant Exception'}
          </button>
        </form>
      )}

      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Exceptions ({active.length})</p>
              <div className="bg-gray-900 border border-amber-800/50 rounded-xl overflow-hidden">
                {active.map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-800/50 last:border-0">
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{r.employeeFirstName} {r.employeeLastName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{r.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-amber-300">Expires {new Date(r.expiresAt).toLocaleDateString('en-AU')}</p>
                      <p className="text-xs text-gray-500">Approved {new Date(r.approvedAt).toLocaleDateString('en-AU')}</p>
                    </div>
                    <button onClick={() => revoke(r.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2.5 py-1 rounded-lg transition">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expired / Revoked</p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden opacity-60">
                {inactive.slice(0,5).map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3 border-b border-gray-800/50 last:border-0">
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm">{r.employeeFirstName} {r.employeeLastName}</p>
                      <p className="text-gray-500 text-xs">{r.reason}</p>
                    </div>
                    <p className="text-xs text-gray-500">Expired {new Date(r.expiresAt).toLocaleDateString('en-AU')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {records.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center">
              <p className="text-3xl mb-2"></p>
              <p className="text-gray-400 text-sm">No lock exceptions on record.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
