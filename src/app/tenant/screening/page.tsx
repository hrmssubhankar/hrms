'use client'

import { useState, useEffect, useCallback } from 'react'

type Record_ = {
  id: string; employeeId: string; checkType: string; status: string
  referenceNumber: string | null; issuedDate: string | null; expiryDate: string | null
  notes: string | null; verifiedAt: string | null; createdAt: string
  firstName: string | null; lastName: string | null; email: string | null
}
type Stats = { total: number; green: number; amber: number; red: number; pending: number; expiringSoon: number }
type Employee = { id: string; firstName: string; lastName: string }

const CHECK_TYPES = [
  'police_check', 'wwcc', 'ndis_screening', 'aged_care_check',
  'working_rights', 'first_aid', 'manual_handling', 'infection_control',
]

const STATUS_COLORS: Record<string, string> = {
  green:   'bg-green-100 text-green-700',
  amber:   'bg-yellow-100 text-yellow-700',
  red:     'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-green-500', amber: 'bg-yellow-500', red: 'bg-red-500', pending: 'bg-gray-400',
}

export default function ScreeningPage() {
  const [records, setRecords]     = useState<Record_[]>([])
  const [stats, setStats]         = useState<Stats>({ total:0,green:0,amber:0,red:0,pending:0,expiringSoon:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected]   = useState<Record_ | null>(null)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [typeFilter, setType]     = useState('')
  const [search, setSearch]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ employeeId:'', checkType:'police_check', referenceNumber:'', issuedDate:'', expiryDate:'', notes:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (typeFilter)   p.set('checkType', typeFilter)
    if (search)       p.set('search', search)
    const res = await fetch(`/api/tenant/screening?${p}`)
    if (res.ok) { const d = await res.json(); setRecords(d.records ?? []); setStats(d.stats ?? {}) }
    setLoading(false)
  }, [statusFilter, typeFilter, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/tenant/employees?limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create() {
    setSaving(true)
    await fetch('/api/tenant/screening', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setShowCreate(false); setSaving(false); load()
  }

  async function patch(id: string, updates: Record<string, unknown>) {
    await fetch('/api/tenant/screening', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id,...updates}) })
    load(); if (selected?.id === id) setSelected(s => s ? {...s,...updates as any} : s)
  }

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Screening & Checks</h1>
          <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">Police checks, WWCC, NDIS screening, working rights</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">+ Add Check</button>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 flex-wrap dark:bg-gray-800 dark:border-gray-800">
        {[
          { label:'Total', value:stats.total, cls:'text-gray-900' },
          { label:'Clear', value:stats.green, cls:'text-green-600' },
          { label:'Amber', value:stats.amber, cls:'text-yellow-600' },
          { label:'Expired/Failed', value:stats.red, cls:'text-red-600' },
          { label:'Pending', value:stats.pending, cls:'text-gray-500' },
          { label:'Expiring ≤30d', value:stats.expiringSoon, cls:'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white dark:bg-gray-900 dark:border-gray-700">
          <div className="p-3 border-b border-gray-100 space-y-2 dark:border-gray-800">
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm dark:border-gray-700" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2">
              <select className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs dark:border-gray-700" value={statusFilter} onChange={e => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="green">Clear</option>
                <option value="amber">Amber</option>
                <option value="red">Expired/Failed</option>
                <option value="pending">Pending</option>
              </select>
              <select className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs dark:border-gray-700" value={typeFilter} onChange={e => setType(e.target.value)}>
                <option value="">All types</option>
                {CHECK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-gray-400">Loading…</p> : records.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No records found</p>
            ) : records.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition  dark:border-gray-800${selected?.id === r.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{r.checkType.replace(/_/g,' ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status] ?? 'bg-gray-300'}`} />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                  </div>
                </div>
                {r.expiryDate && (
                  <p className={`text-[10px] mt-1 ${daysUntil(r.expiryDate) < 30 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    Expires: {new Date(r.expiryDate).toLocaleDateString()} ({daysUntil(r.expiryDate)}d)
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex-1 p-6 overflow-y-auto bg-white space-y-5 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selected.firstName} {selected.lastName}</h2>
                <p className="text-sm text-gray-500 capitalize dark:text-gray-400">{selected.checkType.replace(/_/g,' ')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status] ?? ''}`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label:'Reference Number', field:'referenceNumber', value: selected.referenceNumber },
                { label:'Issued Date', field:'issuedDate', value: selected.issuedDate, type:'date' },
                { label:'Expiry Date', field:'expiryDate', value: selected.expiryDate, type:'date' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700"
                    defaultValue={f.value ?? ''}
                    onBlur={e => patch(selected.id, { [f.field]: e.target.value || null })}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Status</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700"
                  value={selected.status}
                  onChange={e => { patch(selected.id, { status: e.target.value }); setSelected({...selected, status:e.target.value}) }}
                >
                  <option value="pending">Pending</option>
                  <option value="amber">Amber — Submitted</option>
                  <option value="green">Clear — Verified</option>
                  <option value="red">Expired / Failed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Notes</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none dark:border-gray-700"
                defaultValue={selected.notes ?? ''} onBlur={e => patch(selected.id, { notes: e.target.value })} />
            </div>

            {selected.verifiedAt && (
              <p className="text-xs text-gray-400">Verified: {new Date(selected.verifiedAt).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Select a record to view details</div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Add Screening Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Employee *</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.employeeId} onChange={e => setForm(f => ({...f, employeeId:e.target.value}))}>
                  <option value="">Select…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Check Type *</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.checkType} onChange={e => setForm(f => ({...f, checkType:e.target.value}))}>
                  {CHECK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Reference #</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.referenceNumber} onChange={e => setForm(f => ({...f, referenceNumber:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Expiry Date</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.expiryDate} onChange={e => setForm(f => ({...f, expiryDate:e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 dark:text-gray-400 dark:border-gray-700">Cancel</button>
              <button onClick={create} disabled={saving || !form.employeeId} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Adding…' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
