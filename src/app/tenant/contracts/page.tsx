'use client'

import { useEffect, useState, useCallback } from 'react'
import FileUpload from '@/components/ui/FileUpload'

type Contract = {
  id: string; employeeId: string; type: string; status: string
  pdfUrl: string | null; signedPdfUrl: string | null
  sentAt: string | null; signedAt: string | null; tfnProvided: boolean; superFund: string | null; createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
  employeeEmail: string | null; employeeEntityName: string | null
}
type Stats = { total: number; draft: number; sent: number; signed: number }
type Employee = { id: string; firstName: string; lastName: string }

const CONTRACT_TYPES = [
  { value: 'employment',  label: 'Permanent Employment' },
  { value: 'casual',      label: '⏱ Casual Employment' },
  { value: 'contractor',  label: 'Independent Contractor' },
  { value: 'traineeship', label: 'Traineeship' },
  { value: 'volunteer',   label: 'Volunteer' },
]

const STATUS_STYLE: Record<string, string> = {
  draft:  'bg-gray-800 text-gray-400 border-gray-700',
  sent:   'bg-blue-900/50 text-blue-300 border-blue-800',
  signed: 'bg-green-900/50 text-green-300 border-green-800',
  void:   'bg-red-900/50 text-red-300 border-red-800',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function ContractsPage() {
  const [contracts,  setContracts]  = useState<Contract[]>([])
  const [stats,      setStats]      = useState<Stats>({ total:0, draft:0, sent:0, signed:0 })
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ employeeId:'', type:'employment', pdfUrl:'', superFund:'', tfnProvided: false })
  const [taxSuper, setTaxSuper] = useState<Record<string, { tfn: boolean; fund: string }>>({})

  const load = useCallback(async (st = filterStatus) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (st) p.set('status', st)
    const res  = await fetch(`/api/tenant/contracts?${p}`)
    const data = await res.json()
    setContracts(data.contracts ?? [])
    setStats(data.stats ?? { total:0, draft:0, sent:0, signed:0 })
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/contracts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setShowForm(false); setForm({ employeeId:'', type:'employment', pdfUrl:'', superFund:'', tfnProvided:false })
    setSaving(false); load()
  }

  async function patch(id: string, updates: Record<string, unknown>) {
    await fetch('/api/tenant/contracts', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, ...updates }),
    })
    load()
  }

  async function saveTaxSuper(id: string) {
    const f = taxSuper[id]
    if (!f) return
    await patch(id, { tfnProvided: f.tfn, superFund: f.fund })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employment Contracts</h1>
          <p className="text-gray-400 text-sm mt-1">Create, send, and track employment contracts and onboarding documents</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ New Contract'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',  value: stats.total,  color: 'text-white' },
          { label: 'Draft',  value: stats.draft,  color: 'text-gray-400' },
          { label: 'Sent',   value: stats.sent,   color: 'text-blue-400' },
          { label: 'Signed', value: stats.signed, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Create New Contract</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Contract Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <FileUpload
                label="Contract Document (optional)"
                accept=".pdf,.doc,.docx"
                currentUrl={form.pdfUrl || null}
                onUpload={r => setForm(f => ({ ...f, pdfUrl: r.url }))}
              />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Creating…' : 'Create Contract'}
          </button>
        </form>
      )}

      {/* Filter */}
      <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(e.target.value) }}
        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="signed">Signed</option>
        <option value="void">Void</option>
      </select>

      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : contracts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No contracts yet</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Create a contract to begin the employment documentation process.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => {
            const isOpen = expanded === c.id
            const ts = taxSuper[c.id] ?? { tfn: c.tfnProvided, fund: c.superFund ?? '' }
            return (
              <div key={c.id} className={`bg-gray-900 border rounded-xl overflow-hidden ${
                c.status === 'signed' ? 'border-green-900/50' : 'border-gray-800'
              }`}>
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-medium text-sm">{c.employeeFirstName} {c.employeeLastName}</span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                        {CONTRACT_TYPES.find(t => t.value === c.type)?.label ?? c.type}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[c.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.employeeEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {c.signedAt && <p className="text-xs text-green-400">Signed {new Date(c.signedAt).toLocaleDateString('en-AU')}</p>}
                    {c.sentAt && !c.signedAt && <p className="text-xs text-blue-400">Sent {new Date(c.sentAt).toLocaleDateString('en-AU')}</p>}
                    {!c.sentAt && <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-AU')}</p>}
                    <p className="text-xs text-gray-600 mt-0.5 dark:text-gray-400">{isOpen ? '▲' : '▼'}</p>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                    {/* Status actions */}
                    {c.status !== 'signed' && c.status !== 'void' && (
                      <div className="flex gap-2 flex-wrap">
                        {c.status === 'draft' && (
                          <button onClick={() => patch(c.id, { status: 'sent' })}
                            className="text-xs bg-blue-900/40 border border-blue-800 text-blue-300 hover:bg-blue-900/60 px-3 py-1.5 rounded-lg transition">
                            Mark as Sent
                          </button>
                        )}
                        {c.status === 'sent' && (
                          <button onClick={() => patch(c.id, { status: 'signed' })}
                            className="text-xs bg-green-900/40 border border-green-800 text-green-300 hover:bg-green-900/60 px-3 py-1.5 rounded-lg transition">
                            Mark as Signed
                          </button>
                        )}
                        <button onClick={() => patch(c.id, { status: 'void' })}
                          className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 px-3 py-1.5 rounded-lg transition">
                          Void
                        </button>
                      </div>
                    )}

                    {/* Document upload / link */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Contract Document</p>
                      <FileUpload
                        accept=".pdf,.doc,.docx"
                        currentUrl={c.pdfUrl}
                        currentName={c.pdfUrl ? 'Contract document' : null}
                        onUpload={r => patch(c.id, { pdfUrl: r.url })}
                      />
                    </div>

                    {/* Signed PDF upload */}
                    {(c.status === 'signed' || c.signedPdfUrl) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Signed Copy</p>
                        <FileUpload
                          accept=".pdf"
                          currentUrl={c.signedPdfUrl}
                          currentName={c.signedPdfUrl ? 'Signed contract' : null}
                          onUpload={r => patch(c.id, { signedPdfUrl: r.url })}
                        />
                      </div>
                    )}

                    {/* Tax & super */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Tax & Superannuation</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={ts.tfn}
                            onChange={e => setTaxSuper(prev => ({ ...prev, [c.id]: { ...ts, tfn: e.target.checked } }))}
                            className="accent-green-500 w-4 h-4" />
                          <span className="text-sm text-gray-300">TFN Provided</span>
                        </label>
                        <div>
                          <input value={ts.fund}
                            onChange={e => setTaxSuper(prev => ({ ...prev, [c.id]: { ...ts, fund: e.target.value } }))}
                            placeholder="Super fund name" className={INPUT} />
                        </div>
                      </div>
                      <button onClick={() => saveTaxSuper(c.id)}
                        className="mt-2 text-xs bg-gray-800 border border-gray-700 text-gray-300 hover:border-purple-600 px-3 py-1.5 rounded-lg transition">
                        Save Tax & Super
                      </button>
                    </div>

                    {/* Signed info */}
                    {c.status === 'signed' && (
                      <div className="bg-green-950/40 border border-green-800/50 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-xl"></span>
                        <div>
                          <p className="text-sm font-semibold text-green-300">Contract Executed</p>
                          {c.signedAt && <p className="text-xs text-gray-400">Signed {new Date(c.signedAt).toLocaleDateString('en-AU')}</p>}
                        </div>
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
