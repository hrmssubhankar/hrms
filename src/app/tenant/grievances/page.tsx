'use client'

import { useEffect, useState, useCallback } from 'react'

type Grievance = {
  id: string; lodgedBy: string | null; subjectId: string | null; type: string
  isAnonymous: boolean; riskRating: string | null; description: string; status: string
  assignedTo: string | null; outcome: string | null; closedAt: string | null
  createdAt: string; updatedAt: string
  subjectFirstName: string | null; subjectLastName: string | null; subjectEmail: string | null
}
type Stats = { total: number; new: number; active: number; closed: number; critical: number; high: number }
type Employee = { id: string; firstName: string; lastName: string }

const TYPES = [
  { value: 'grievance',         label: 'Grievance' },
  { value: 'misconduct',        label: 'Misconduct' },
  { value: 'bullying',          label: 'Bullying / Harassment' },
  { value: 'safety',            label: 'Safety (WHS) Concern' },
  { value: 'discrimination',    label: 'Discrimination' },
  { value: 'fraud',             label: 'Fraud / Theft' },
  { value: 'ndis_safeguarding', label: 'NDIS Safeguarding' },
]

const RISK_RATINGS = [
  { value: 'low',      label: 'Low',      color: 'text-gray-400',   bg: 'bg-gray-800/60 border-gray-700' },
  { value: 'medium',   label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-900/40 border-yellow-800' },
  { value: 'high',     label: 'High',     color: 'text-orange-400', bg: 'bg-orange-900/40 border-orange-800' },
  { value: 'critical', label: 'Critical', color: 'text-red-400',    bg: 'bg-red-900/50 border-red-800' },
]

// Investigation status flow
const STATUS_FLOW = [
  { value: 'new',       label: 'New' },
  { value: 'triage',    label: 'Triage' },
  { value: 'assigned',  label: 'Assigned' },
  { value: 'evidence',  label: 'Evidence' },
  { value: 'response',  label: 'Response' },
  { value: 'findings',  label: 'Findings' },
  { value: 'outcome',   label: 'Outcome' },
  { value: 'closed',    label: 'Closed' },
]

const STATUS_STYLE: Record<string, string> = {
  new:      'bg-blue-900/50 text-blue-300 border-blue-800',
  triage:   'bg-purple-900/50 text-purple-300 border-purple-800',
  assigned: 'bg-indigo-900/50 text-indigo-300 border-indigo-800',
  evidence: 'bg-amber-900/50 text-amber-300 border-amber-800',
  response: 'bg-orange-900/50 text-orange-300 border-orange-800',
  findings: 'bg-pink-900/50 text-pink-300 border-pink-800',
  outcome:  'bg-teal-900/50 text-teal-300 border-teal-800',
  closed:   'bg-gray-800 text-gray-400 border-gray-700',
}

const INPUT = 'w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function GrievancesPage() {
  const [records,   setRecords]   = useState<Grievance[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, new:0, active:0, closed:0, critical:0, high:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [form, setForm] = useState({
    lodgedBy:'', subjectId:'', type:'grievance', isAnonymous: false,
    riskRating:'medium', description:'',
  })
  const [outcomeText, setOutcomeText] = useState<Record<string, string>>({})

  const load = useCallback(async (st = filterStatus, t = filterType) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (st) p.set('status', st)
    if (t)  p.set('type', t)
    const res  = await fetch(`/api/tenant/grievances?${p}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0,new:0,active:0,closed:0,critical:0,high:0 })
    setLoading(false)
  }, [filterStatus, filterType])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function lodge(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/grievances', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ lodgedBy:'', subjectId:'', type:'grievance', isAnonymous:false, riskRating:'medium', description:'' })
    setSaving(false)
    load()
  }

  async function advance(id: string, currentStatus: string) {
    const idx  = STATUS_FLOW.findIndex(s => s.value === currentStatus)
    const next = STATUS_FLOW[idx + 1]?.value
    if (!next) return
    await fetch('/api/tenant/grievances', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    })
    load()
  }

  async function close(id: string) {
    const text = outcomeText[id] ?? ''
    await fetch('/api/tenant/grievances', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'closed', outcome: text }),
    })
    load()
  }

  const risk = (v: string | null) => RISK_RATINGS.find(r => r.value === v) ?? RISK_RATINGS[1]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Grievances & Investigations</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Lodge and manage grievances, misconduct, and NDIS safeguarding concerns</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Lodge Grievance'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',    value: stats.total,    color: 'text-white' },
          { label: 'New',      value: stats.new,      color: 'text-blue-400' },
          { label: 'Active',   value: stats.active,   color: 'text-amber-400' },
          { label: 'Closed',   value: stats.closed,   color: 'text-green-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          { label: 'High',     value: stats.high,     color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lodge form */}
      {showForm && (
        <form onSubmit={lodge} className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">Lodge New Grievance / Report</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Risk Rating</label>
              <select value={form.riskRating} onChange={e => setForm(f => ({ ...f, riskRating: e.target.value }))} className={INPUT}>
                {RISK_RATINGS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Lodged By</label>
              <select value={form.isAnonymous ? '__anon__' : form.lodgedBy}
                onChange={e => {
                  if (e.target.value === '__anon__') setForm(f => ({ ...f, isAnonymous: true, lodgedBy: '' }))
                  else setForm(f => ({ ...f, isAnonymous: false, lodgedBy: e.target.value }))
                }}
                className={INPUT}>
                <option value="">— Select —</option>
                <option value="__anon__">Anonymous</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Subject (person complaint is about)</label>
              <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} className={INPUT}>
                <option value="">— Not specified —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description *</label>
            <textarea required value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Describe the incident or concern in detail. Include dates, locations and any witnesses…"
              className={INPUT} />
          </div>

          {form.type === 'ndis_safeguarding' && (
            <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              NDIS Safeguarding — this may require mandatory reporting to the NDIS Quality and Safeguards Commission. Escalate immediately per your reporting obligations.
            </div>
          )}
          {form.riskRating === 'critical' && (
            <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              ️ Critical risk — stand-down of subject may be required pending investigation. Seek legal advice.
            </div>
          )}

          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Lodging…' : 'Lodge Report'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(e.target.value, filterType) }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          {STATUS_FLOW.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); load(filterStatus, e.target.value) }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Records */}
      {loading ? <div className="text-gray-600 dark:text-gray-400 text-sm">Loading…</div> : records.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No grievances on record</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Lodge a concern or report to begin an investigation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(g => {
            const r   = risk(g.riskRating)
            const isOpen = expanded === g.id
            const stageIdx = STATUS_FLOW.findIndex(s => s.value === g.status)
            return (
              <div key={g.id} className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden ${
                g.riskRating === 'critical' ? 'border-red-800' :
                g.riskRating === 'high'     ? 'border-orange-800/60' : 'border-gray-800'
              }`}>
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : g.id)}>
                  <div className={`w-2 h-10 rounded-full shrink-0 ${
                    g.riskRating === 'critical' ? 'bg-red-500' :
                    g.riskRating === 'high'     ? 'bg-orange-500' :
                    g.riskRating === 'medium'   ? 'bg-yellow-500' : 'bg-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-medium text-sm">
                        {TYPES.find(t => t.value === g.type)?.label ?? g.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${r.bg} ${r.color}`}>{r.label}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[g.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {STATUS_FLOW.find(s => s.value === g.status)?.label ?? g.status}
                      </span>
                      {g.isAnonymous && <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full dark:text-gray-400">Anonymous</span>}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{g.description}</p>
                    {g.subjectFirstName && (
                      <p className="text-gray-600 text-xs mt-0.5 dark:text-gray-400">Subject: {g.subjectFirstName} {g.subjectLastName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(g.createdAt).toLocaleDateString('en-AU')}</p>
                    <p className="text-xs text-gray-600 mt-0.5 dark:text-gray-400">{isOpen ? '▲' : '▼'}</p>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{g.description}</p>

                    {/* Stage timeline */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Investigation Stage</p>
                      <div className="flex items-center gap-0.5">
                        {STATUS_FLOW.map((s, i) => (
                          <div key={s.value} className="flex items-center flex-1">
                            <div className={`flex-1 h-1.5 rounded-full ${i <= stageIdx ? 'bg-purple-600' : 'bg-gray-800'}`} />
                            {i === STATUS_FLOW.length - 1 && (
                              <div className={`w-3 h-3 rounded-full ml-0.5 ${i <= stageIdx ? 'bg-purple-600' : 'bg-gray-800'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">New</span>
                        <span className="text-xs text-purple-400">{STATUS_FLOW.find(s => s.value === g.status)?.label}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Closed</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {g.status !== 'closed' && (
                      <div className="flex gap-2 flex-wrap">
                        {stageIdx < STATUS_FLOW.length - 2 && (
                          <button onClick={() => advance(g.id, g.status)}
                            className="text-xs bg-purple-600/20 border border-purple-700 text-purple-300 hover:bg-purple-600/40 px-3 py-1.5 rounded-lg transition">
                            Advance → {STATUS_FLOW[stageIdx + 1]?.label}
                          </button>
                        )}
                        {g.status !== 'closed' && (
                          <div className="flex gap-2 flex-1">
                            <input
                              value={outcomeText[g.id] ?? ''}
                              onChange={e => setOutcomeText(prev => ({ ...prev, [g.id]: e.target.value }))}
                              placeholder="Outcome / resolution notes…"
                              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-600" />
                            <button onClick={() => close(g.id)}
                              className="text-xs bg-green-900/40 border border-green-800 text-green-300 hover:bg-green-900/60 px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {g.outcome && (
                      <div className="bg-green-950/40 border border-green-800/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-400 mb-1">Outcome</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{g.outcome}</p>
                        {g.closedAt && <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Closed {new Date(g.closedAt).toLocaleDateString('en-AU')}</p>}
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
