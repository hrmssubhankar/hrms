'use client'

import { useEffect, useState, useCallback } from 'react'

type Doc = {
  id: string; employeeId: string | null; category: string; title: string
  blobUrl: string; fileName: string | null; fileSizeBytes: number | null
  mimeType: string | null; status: string; expiryDate: string | null
  notes: string | null; version: number; createdAt: string; updatedAt: string
  employeeFirstName: string | null; employeeLastName: string | null
}
type Stats = { total: number; active: number; expired: number; expiringSoon: number; pendingReview: number }
type Employee = { id: string; firstName: string; lastName: string }

const DOC_CATEGORIES = [
  'Policy', 'Procedure', 'Contract', 'Certificate', 'ID Document',
  'Compliance', 'Training', 'HR Form', 'Payroll', 'Other',
]

const STATUS_STYLE: Record<string, string> = {
  active:         'bg-green-900/50 text-green-300 border-green-800',
  expired:        'bg-red-900/50 text-red-300 border-red-800',
  archived:       'bg-gray-800 text-gray-400 border-gray-700',
  pending_review: 'bg-amber-900/50 text-amber-300 border-amber-800',
}

const MIME_ICON: Record<string, string> = {
  'application/pdf':  '📄',
  'image/png':        '🖼',
  'image/jpeg':       '🖼',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
}
const mimeIcon = (m: string | null) => m ? (MIME_ICON[m] ?? '📁') : '📁'

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function DocumentsPage() {
  const [docs,       setDocs]       = useState<Doc[]>([])
  const [stats,      setStats]      = useState<Stats>({ total:0, active:0, expired:0, expiringSoon:0, pendingReview:0 })
  const [categories, setCategories] = useState<string[]>([])
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [filterCat,  setFilterCat]  = useState('')
  const [filterStat, setFilterStat] = useState('')
  const [search,     setSearch]     = useState('')
  const [form, setForm] = useState({
    title: '', category: 'Policy', blobUrl: '', employeeId: '',
    fileName: '', expiryDate: '', notes: '',
  })

  const load = useCallback(async (cat = filterCat, st = filterStat) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (cat) p.set('category', cat)
    if (st)  p.set('status', st)
    const data = await fetch(`/api/tenant/documents?${p}`).then(r => r.json())
    setDocs(data.documents ?? [])
    setStats(data.stats ?? { total:0, active:0, expired:0, expiringSoon:0, pendingReview:0 })
    setCategories(data.categories ?? [])
    setLoading(false)
  }, [filterCat, filterStat])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ title:'', category:'Policy', blobUrl:'', employeeId:'', fileName:'', expiryDate:'', notes:'' })
    setSaving(false); load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tenant/documents', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
    })
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

  const expColor = (exp: string | null) => {
    if (!exp) return ''
    if (exp < today)  return 'text-red-400'
    if (exp <= in30)  return 'text-amber-400'
    return 'text-gray-400'
  }

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.employeeFirstName + ' ' + d.employeeLastName).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Management</h1>
          <p className="text-gray-400 text-sm mt-1">Centralised document register with expiry tracking and version control</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',          value: stats.total,        color: 'text-white' },
          { label: 'Active',         value: stats.active,       color: 'text-green-400' },
          { label: 'Pending Review', value: stats.pendingReview,color: 'text-amber-400' },
          { label: 'Expiring (30d)', value: stats.expiringSoon, color: stats.expiringSoon > 0 ? 'text-amber-400' : 'text-gray-400' },
          { label: 'Expired',        value: stats.expired,      color: stats.expired > 0 ? 'text-red-400' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Add Document to Register</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Manual Handling Policy v3.1" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category *</label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT}>
                {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Linked Employee</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Organisation-wide —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Document URL *</label>
              <input required value={form.blobUrl} onChange={e => setForm(f => ({ ...f, blobUrl: e.target.value }))}
                placeholder="https://… (SharePoint, Azure Blob, S3, Google Drive…)" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">File Name</label>
              <input value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
                placeholder="manual-handling-policy.pdf" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Review schedule, owner, linked policy…" className={INPUT} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Add to Register'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search title or employee…"
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 flex-1 min-w-48" />
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(e.target.value, filterStat) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All categories</option>
          {(categories.length > 0 ? categories : DOC_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStat} onChange={e => { setFilterStat(e.target.value); load(filterCat, e.target.value) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_review">Pending Review</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-300 font-medium">No documents found</p>
          <p className="text-gray-500 text-sm mt-1">Add a document URL to begin building your register.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{mimeIcon(d.mimeType)}</span>
                      <div>
                        <a href={d.blobUrl} target="_blank" rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline underline-offset-2 text-sm font-medium">
                          {d.title}
                        </a>
                        {d.fileName && <p className="text-xs text-gray-600">{d.fileName} {fmtSize(d.fileSizeBytes)}</p>}
                        {d.version > 1 && <span className="text-xs text-gray-600">v{d.version}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{d.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {d.employeeFirstName ? `${d.employeeFirstName} ${d.employeeLastName}` : <span className="text-gray-600">Org-wide</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[d.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${expColor(d.expiryDate)}`}>
                    {d.expiryDate ? new Date(d.expiryDate + 'T00:00:00').toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {d.status === 'active' && (
                        <button onClick={() => updateStatus(d.id, 'pending_review')}
                          className="text-xs bg-amber-900/30 border border-amber-800 text-amber-300 hover:bg-amber-900/50 px-2 py-1 rounded transition">
                          Review
                        </button>
                      )}
                      {d.status !== 'archived' && (
                        <button onClick={() => updateStatus(d.id, 'archived')}
                          className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 px-2 py-1 rounded transition">
                          Archive
                        </button>
                      )}
                      {d.status !== 'active' && (
                        <button onClick={() => updateStatus(d.id, 'active')}
                          className="text-xs bg-green-900/30 border border-green-800 text-green-300 hover:bg-green-900/50 px-2 py-1 rounded transition">
                          Activate
                        </button>
                      )}
                    </div>
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
