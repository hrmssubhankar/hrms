'use client'

import { useEffect, useState, useCallback } from 'react'

type SeparationRecord = {
  id: string; employeeId: string; type: string; reason: string | null
  noticeDate: string | null; lastWorkingDay: string | null
  exitInterviewAt: string | null; exitInterviewNotes: string | null
  checklistComplete: boolean; assetsReturned: boolean; systemAccessRevoked: boolean
  status: string; createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
  employeeEmail: string | null; employeeStartDate: string | null; employeeEntityName: string | null
}
type SeparationEvent = { id: string; event: string; note: string | null; performedBy: string | null; createdAt: string }
type Stats = { total: number; pending: number; active: number; completed: number; resignation: number; termination: number }
type Employee = { id: string; firstName: string; lastName: string }

const SEP_TYPES = [
  { value: 'resignation',    label: '️  Resignation' },
  { value: 'termination',    label: 'Termination' },
  { value: 'redundancy',     label: 'Redundancy' },
  { value: 'contract_end',   label: 'Contract End' },
  { value: 'retirement',     label: 'Retirement' },
  { value: 'abandonment',    label: 'Abandonment' },
]

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-blue-900/50 text-blue-300 border-blue-800',
  active:    'bg-amber-900/50 text-amber-300 border-amber-800',
  completed: 'bg-green-900/50 text-green-300 border-green-800',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function SeparationPage() {
  const [records,   setRecords]   = useState<SeparationRecord[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, pending:0, active:0, completed:0, resignation:0, termination:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [form, setForm] = useState({
    employeeId: '', type: 'resignation', reason: '', noticeDate: '', lastWorkingDay: '',
  })
  const [interviewFields, setInterviewFields] = useState<Record<string, { at: string; notes: string }>>({})
  const [sepEvents,   setSepEvents]   = useState<Record<string, SeparationEvent[]>>({})
  const [noteFields,  setNoteFields]  = useState<Record<string, string>>({})
  const [savingNote,  setSavingNote]  = useState<string | null>(null)

  const load = useCallback(async (st = filterStatus, t = filterType) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (st) p.set('status', st)
    if (t)  p.set('type', t)
    const res  = await fetch(`/api/tenant/separation?${p}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0, pending:0, active:0, completed:0, resignation:0, termination:0 })
    setLoading(false)
  }, [filterStatus, filterType])

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function initiate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tenant/separation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ employeeId:'', type:'resignation', reason:'', noticeDate:'', lastWorkingDay:'' })
    setSaving(false)
    load()
  }

  async function patch(id: string, updates: Record<string, unknown>) {
    await fetch(`/api/tenant/separation/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    load()
    loadEvents(id)
  }

  async function loadEvents(id: string) {
    const res  = await fetch(`/api/tenant/separation/${id}`)
    const data = await res.json()
    setSepEvents(prev => ({ ...prev, [id]: data.events ?? [] }))
  }

  async function addNote(id: string) {
    const note = noteFields[id]?.trim()
    if (!note) return
    setSavingNote(id)
    await fetch(`/api/tenant/separation/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _note: note }),
    })
    setNoteFields(prev => ({ ...prev, [id]: '' }))
    setSavingNote(null)
    loadEvents(id)
  }

  async function saveInterview(id: string) {
    const f = interviewFields[id]
    if (!f) return
    await patch(id, { exitInterviewAt: f.at, exitInterviewNotes: f.notes })
  }

  const progress = (r: SeparationRecord) => {
    let done = 0
    if (r.assetsReturned)      done++
    if (r.systemAccessRevoked) done++
    if (r.exitInterviewAt)     done++
    return Math.round((done / 3) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Separation & Exit Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage employee departures, offboarding checklists, and exit interviews</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Initiate Separation'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: 'text-white' },
          { label: 'Pending',     value: stats.pending,     color: 'text-blue-400' },
          { label: 'Active',      value: stats.active,      color: 'text-amber-400' },
          { label: 'Completed',   value: stats.completed,   color: 'text-green-400' },
          { label: 'Resignations',value: stats.resignation, color: 'text-purple-400' },
          { label: 'Terminations',value: stats.termination, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Initiate form */}
      {showForm && (
        <form onSubmit={initiate} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-300">Initiate Separation Process</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Separation Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {SEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notice Date</label>
              <input type="date" value={form.noticeDate} onChange={e => setForm(f => ({ ...f, noticeDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Last Working Day</label>
              <input type="date" value={form.lastWorkingDay} onChange={e => setForm(f => ({ ...f, lastWorkingDay: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="Brief reason for separation…" className={INPUT} />
          </div>
          {form.type === 'termination' && (
            <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              ️ Termination — ensure proper documentation and HR sign-off before proceeding. Seek legal advice if required.
            </div>
          )}
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg transition">
            {saving ? 'Initiating…' : 'Begin Separation'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(e.target.value, filterType) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); load(filterStatus, e.target.value) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          <option value="">All types</option>
          {SEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Records */}
      {loading ? <div className="text-gray-400 text-sm">Loading…</div> : records.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No separation records</p>
          <p className="text-gray-500 text-sm mt-1">Initiate a separation to begin the offboarding process.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const isOpen = expanded === r.id
            const pct    = progress(r)
            const iField = interviewFields[r.id] ?? { at: r.exitInterviewAt?.split('T')[0] ?? '', notes: r.exitInterviewNotes ?? '' }
            return (
              <div key={r.id} className={`bg-gray-900 border rounded-xl overflow-hidden ${
                r.status === 'completed' ? 'border-green-900' : r.type === 'termination' ? 'border-red-900/50' : 'border-gray-800'
              }`}>
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => { const next = isOpen ? null : r.id; setExpanded(next); if (next) loadEvents(next) }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm">
                        {r.employeeFirstName} {r.employeeLastName}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                        {SEP_TYPES.find(t => t.value === r.type)?.label ?? r.type}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                    {r.employeeEmail && <p className="text-xs text-gray-500">{r.employeeEmail}</p>}

                    {/* Progress bar */}
                    {r.status !== 'completed' && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-gray-500">Offboarding progress</span>
                          <span className={`text-xs font-medium ${pct === 100 ? 'text-green-400' : 'text-gray-400'}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full">
                          <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-purple-600'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {r.lastWorkingDay && (
                      <p className="text-xs text-amber-400 font-medium">LWD {new Date(r.lastWorkingDay).toLocaleDateString('en-AU')}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">{isOpen ? '▲' : '▼'}</p>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-800 px-5 py-4 space-y-5">
                    {/* Key dates */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Notice Date', value: r.noticeDate },
                        { label: 'Last Working Day', value: r.lastWorkingDay },
                        { label: 'Entity', value: r.employeeEntityName },
                      ].map(d => (
                        <div key={d.label} className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">{d.label}</p>
                          <p className="text-sm text-gray-200">{d.value ? (d.value.includes('-') ? new Date(d.value).toLocaleDateString('en-AU') : d.value) : '—'}</p>
                        </div>
                      ))}
                    </div>

                    {r.reason && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-gray-300">{r.reason}</p>
                      </div>
                    )}

                    {/* Offboarding checklist */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Offboarding Checklist</p>
                      <div className="space-y-2">
                        {[
                          {
                            label: 'Assets Returned',
                            desc: 'Laptop, access cards, keys, uniforms, PPE',
                            done: r.assetsReturned,
                            key: 'assetsReturned',
                          },
                          {
                            label: 'System Access Revoked',
                            desc: 'Email, payroll, HR systems, facility access',
                            done: r.systemAccessRevoked,
                            key: 'systemAccessRevoked',
                          },
                        ].map(item => (
                          <label key={item.key}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              item.done
                                ? 'bg-green-950/40 border-green-800/60'
                                : 'bg-gray-800/40 border-gray-700 hover:border-gray-600'
                            } ${r.status === 'completed' ? 'pointer-events-none' : ''}`}>
                            <input
                              type="checkbox"
                              checked={item.done}
                              disabled={r.status === 'completed'}
                              onChange={e => patch(r.id, { [item.key]: e.target.checked })}
                              className="mt-0.5 accent-green-500 w-4 h-4 shrink-0"
                            />
                            <div>
                              <p className={`text-sm font-medium ${item.done ? 'text-green-300 line-through' : 'text-gray-200'}`}>{item.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            {item.done && <span className="ml-auto text-green-400 text-sm"></span>}
                          </label>
                        ))}
                      </div>
                      {r.assetsReturned && r.systemAccessRevoked && !r.checklistComplete && (
                        <p className="text-xs text-green-400 mt-2">Both items complete — offboarding will auto-close</p>
                      )}
                      {r.checklistComplete && (
                        <p className="text-xs text-green-400 mt-2">Offboarding checklist complete</p>
                      )}
                    </div>

                    {/* Exit interview */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Exit Interview</p>
                      {r.exitInterviewAt && r.status === 'completed' ? (
                        <div className="bg-gray-800/40 rounded-lg p-3 space-y-1">
                          <p className="text-xs text-gray-500">Conducted {new Date(r.exitInterviewAt).toLocaleDateString('en-AU')}</p>
                          {r.exitInterviewNotes && <p className="text-sm text-gray-300">{r.exitInterviewNotes}</p>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Interview Date</label>
                              <input type="date"
                                value={iField.at}
                                onChange={e => setInterviewFields(prev => ({ ...prev, [r.id]: { ...iField, at: e.target.value } }))}
                                className={INPUT} />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Notes / Summary</label>
                            <textarea
                              value={iField.notes}
                              onChange={e => setInterviewFields(prev => ({ ...prev, [r.id]: { ...iField, notes: e.target.value } }))}
                              rows={3} placeholder="Key themes, feedback, suggestions from exit interview…"
                              className={INPUT} />
                          </div>
                          <button onClick={() => saveInterview(r.id)}
                            className="text-xs bg-purple-600/20 border border-purple-700 text-purple-300 hover:bg-purple-600/40 px-3 py-1.5 rounded-lg transition">
                            Save Interview
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Completion badge */}
                    {r.status === 'completed' && (
                      <div className="bg-green-950/40 border border-green-800/50 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl"></span>
                        <div>
                          <p className="text-sm font-semibold text-green-300">Offboarding Complete</p>
                          <p className="text-xs text-gray-400">All checklist items confirmed. Employee has been fully offboarded.</p>
                        </div>
                      </div>
                    )}

                    {/* ── Event History ─────────────────────────────── */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">History & Notes</p>

                      {/* Add note */}
                      <div className="flex gap-2 mb-4">
                        <input
                          value={noteFields[r.id] ?? ''}
                          onChange={e => setNoteFields(prev => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Add a note or comment…"
                          className={INPUT} />
                        <button
                          disabled={savingNote === r.id || !noteFields[r.id]?.trim()}
                          onClick={() => addNote(r.id)}
                          className="shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition">
                          Add
                        </button>
                      </div>

                      {/* Timeline */}
                      {(sepEvents[r.id] ?? []).length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-3">No events recorded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(sepEvents[r.id] ?? []).map((ev, i, arr) => (
                            <div key={ev.id} className="flex gap-3 items-start">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs">
                                  {ev.event === 'initiated'                ? ''
                                   : ev.event === 'notice_received'        ? ''
                                   : ev.event === 'exit_interview_scheduled' ? ''
                                   : ev.event === 'exit_interview_done'    ? ''
                                   : ev.event === 'assets_returned'        ? ''
                                   : ev.event === 'access_revoked'         ? ''
                                   : ev.event === 'completed'              ? ''
                                   : ev.event === 'checklist_completed'    ? '️'
                                   : ''}
                                </div>
                                {i < arr.length - 1 && <div className="w-px h-3 bg-gray-700 mt-1" />}
                              </div>
                              <div className="flex-1 pb-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-white capitalize">{ev.event.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-gray-600 shrink-0">
                                    {new Date(ev.createdAt).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}
                                  </p>
                                </div>
                                {ev.note        && <p className="text-xs text-gray-400 mt-0.5">{ev.note}</p>}
                                {ev.performedBy && <p className="text-xs text-gray-600 mt-0.5">by {ev.performedBy}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
