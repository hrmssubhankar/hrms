'use client'

import { useEffect, useState, useCallback } from 'react'

type Requisition = {
  id: string; title: string; description: string | null; status: string
  createdAt: string; closedAt: string | null
  applicationCount: number; hiredCount: number
}
type Application = {
  id: string; requisitionId: string; candidateId: string; status: string
  interviewScore: string | null; notes: string | null; createdAt: string; updatedAt: string
  candidateFirstName: string | null; candidateLastName: string | null
  candidateEmail: string | null; candidateSource: string | null
}
type Stats = { total: number; open: number; draft: number; closed: number; totalApps: number; hired: number }

const APP_STATUSES = [
  { value: 'received',    label: 'Received',    color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-900/50 text-purple-300 border-purple-800' },
  { value: 'interviewed', label: 'Interviewed', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  { value: 'checks',      label: 'Ref Checks',  color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  { value: 'offer',       label: 'Offer',       color: 'bg-teal-900/50 text-teal-300 border-teal-800' },
  { value: 'hired',       label: 'Hired',       color: 'bg-green-900/50 text-green-300 border-green-800' },
  { value: 'rejected',    label: 'Rejected',    color: 'bg-red-900/50 text-red-300 border-red-800' },
]

const REQ_STATUS_STYLE: Record<string, string> = {
  draft:  'bg-gray-800 text-gray-400 border-gray-700',
  open:   'bg-green-900/50 text-green-300 border-green-800',
  closed: 'bg-red-900/50 text-red-300 border-red-800',
}

const INPUT = 'w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function RecruitmentPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [stats,        setStats]        = useState<Stats>({ total:0, open:0, draft:0, closed:0, totalApps:0, hired:0 })
  const [applications, setApplications] = useState<Application[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tab, setTab]                   = useState<'jobs' | 'pipeline'>('jobs')
  const [selectedReq,  setSelectedReq]  = useState<Requisition | null>(null)
  const [showReqForm,  setShowReqForm]  = useState(false)
  const [showAppForm,  setShowAppForm]  = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [reqForm, setReqForm] = useState({ title: '', description: '', employmentType: 'full_time' })
  const [appForm, setAppForm] = useState({
    firstName:'', lastName:'', email:'', phone:'', source:'', notes:'',
  })
  // Inline card expand / edit
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [editingScore,  setEditingScore]  = useState<Record<string, string>>({})
  const [editingNotes,  setEditingNotes]  = useState<Record<string, string>>({})
  const [savingCard,    setSavingCard]    = useState<string | null>(null)

  const loadReqs = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/tenant/recruitment')
    const data = await res.json()
    setRequisitions(data.requisitions ?? [])
    setStats(data.stats ?? { total:0, open:0, draft:0, closed:0, totalApps:0, hired:0 })
    setLoading(false)
  }, [])

  const loadApps = useCallback(async (reqId: string) => {
    const res  = await fetch(`/api/tenant/recruitment?view=applications&requisitionId=${reqId}`)
    const data = await res.json()
    setApplications(data.applications ?? [])
  }, [])

  useEffect(() => { loadReqs() }, [])

  function openPipeline(req: Requisition) {
    setSelectedReq(req); setTab('pipeline'); loadApps(req.id)
  }

  async function createReq(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/recruitment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(reqForm) })
    setShowReqForm(false); setReqForm({ title:'', description:'', employmentType:'full_time' }); setSaving(false); loadReqs()
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault(); if (!selectedReq) return; setSaving(true)
    // First create candidate, then application
    const cRes  = await fetch('/api/tenant/recruitment', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _type:'candidate', ...appForm }),
    })
    const cData = await cRes.json()
    if (cData.record?.id) {
      await fetch('/api/tenant/recruitment', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ _type:'application', requisitionId: selectedReq.id, candidateId: cData.record.id, notes: appForm.notes }),
      })
    }
    setShowAppForm(false)
    setAppForm({ firstName:'', lastName:'', email:'', phone:'', source:'', notes:'' })
    setSaving(false); loadApps(selectedReq.id)
  }

  async function moveStatus(appId: string, status: string) {
    await fetch('/api/tenant/recruitment', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: appId, _type: 'application', status }),
    })
    if (selectedReq) loadApps(selectedReq.id)
  }

  async function saveCardNotes(appId: string) {
    setSavingCard(appId)
    await fetch('/api/tenant/recruitment', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        id: appId, _type: 'application',
        notes:          editingNotes[appId] ?? '',
        interviewScore: editingScore[appId] !== '' ? editingScore[appId] : undefined,
      }),
    })
    setSavingCard(null)
    if (selectedReq) loadApps(selectedReq.id)
  }

  function openOfferLetter(app: Application) {
    const params = new URLSearchParams({
      candidateName:  `${app.candidateFirstName ?? ''} ${app.candidateLastName ?? ''}`.trim(),
      candidateEmail: app.candidateEmail ?? '',
    })
    window.location.href = `/tenant/offer-letters?${params}`
  }

  async function updateReqStatus(id: string, status: string) {
    await fetch('/api/tenant/recruitment', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, status }),
    })
    loadReqs()
  }

  const appStyle = (v: string) => APP_STATUSES.find(s => s.value === v)?.color ?? 'bg-gray-800 text-gray-400 border-gray-700'
  const appLabel = (v: string) => APP_STATUSES.find(s => s.value === v)?.label ?? v

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruitment & ATS</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage job requisitions and candidate pipelines</p>
        </div>
        {tab === 'jobs' && (
          <button onClick={() => setShowReqForm(v => !v)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
            {showReqForm ? 'Cancel' : '+ New Job'}
          </button>
        )}
        {tab === 'pipeline' && selectedReq && (
          <button onClick={() => setShowAppForm(v => !v)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
            {showAppForm ? 'Cancel' : '+ Add Candidate'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Jobs',  value: stats.total,    color: 'text-white' },
          { label: 'Open',        value: stats.open,     color: 'text-green-400' },
          { label: 'Draft',       value: stats.draft,    color: 'text-gray-400' },
          { label: 'Closed',      value: stats.closed,   color: 'text-red-400' },
          { label: 'Applications',value: stats.totalApps,color: 'text-blue-400' },
          { label: 'Hired',       value: stats.hired,    color: 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        <button onClick={() => setTab('jobs')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === 'jobs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          Job Requisitions
        </button>
        {selectedReq && (
          <button onClick={() => setTab('pipeline')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === 'pipeline' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Pipeline — {selectedReq.title}
          </button>
        )}
      </div>

      {/* Create requisition form */}
      {tab === 'jobs' && showReqForm && (
        <form onSubmit={createReq} className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Create Job Requisition</h3>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Job Title *</label>
            <input required value={reqForm.title} onChange={e => setReqForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Support Worker — Community" className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
              <textarea value={reqForm.description} onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Role summary, key responsibilities, requirements…" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Employment Type</label>
              <select value={reqForm.employmentType} onChange={e => setReqForm(f => ({ ...f, employmentType: e.target.value }))} className={INPUT}>
                {[['full_time','Full-Time'],['part_time','Part-Time'],['casual','Casual'],['contractor','Contractor']].map(([v,l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Creating…' : 'Create Requisition'}
          </button>
        </form>
      )}

      {/* Add candidate form */}
      {tab === 'pipeline' && showAppForm && selectedReq && (
        <form onSubmit={addCandidate} className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Add Candidate to Pipeline</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">First Name *</label>
              <input required value={appForm.firstName} onChange={e => setAppForm(f => ({ ...f, firstName: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Last Name *</label>
              <input required value={appForm.lastName} onChange={e => setAppForm(f => ({ ...f, lastName: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Email *</label>
              <input required type="email" value={appForm.email} onChange={e => setAppForm(f => ({ ...f, email: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Phone</label>
              <input value={appForm.phone} onChange={e => setAppForm(f => ({ ...f, phone: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Source</label>
              <select value={appForm.source} onChange={e => setAppForm(f => ({ ...f, source: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {['Seek','LinkedIn','Indeed','Referral','Walk-in','Agency','Internal'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Notes</label>
            <textarea value={appForm.notes} onChange={e => setAppForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Initial notes about this candidate…" className={INPUT} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Adding…' : 'Add to Pipeline'}
          </button>
        </form>
      )}

      {loading ? <div className="text-gray-600 dark:text-gray-400 text-sm">Loading…</div> : (
        <>
          {/* Jobs list */}
          {tab === 'jobs' && (
            requisitions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No requisitions yet</p>
                <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Create a job requisition to begin hiring.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requisitions.map(r => (
                  <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">{r.title}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${REQ_STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                      {r.description && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{r.description}</p>}
                      <p className="text-xs text-gray-600 mt-2 dark:text-gray-400">
                        Created {new Date(r.createdAt).toLocaleDateString('en-AU')} · {r.applicationCount} application{r.applicationCount !== 1 ? 's' : ''} · {r.hiredCount} hired
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => openPipeline(r)}
                        className="text-xs bg-purple-600/20 border border-purple-700 text-purple-300 hover:bg-purple-600/40 px-3 py-1.5 rounded-lg transition">
                        View Pipeline
                      </button>
                      {r.status === 'draft' && (
                        <button onClick={() => updateReqStatus(r.id, 'open')}
                          className="text-xs bg-green-900/40 border border-green-800 text-green-300 hover:bg-green-900/60 px-3 py-1.5 rounded-lg transition">
                          Open Role
                        </button>
                      )}
                      {r.status === 'open' && (
                        <button onClick={() => updateReqStatus(r.id, 'closed')}
                          className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-700 hover:text-red-400 px-3 py-1.5 rounded-lg transition">
                          Close Role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Kanban Pipeline */}
          {tab === 'pipeline' && selectedReq && (
            applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
                <p className="text-gray-600 dark:text-gray-300 font-medium">No candidates in pipeline</p>
                <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Click &quot;+ Add Candidate&quot; to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max">
                  {APP_STATUSES.map(stage => {
                    const cols = applications.filter(a => a.status === stage.value)
                    return (
                      <div key={stage.value} className="w-60 flex-none space-y-2">
                        {/* Column header */}
                        <div className="flex items-center justify-between px-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stage.label}</p>
                          <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5 min-w-[20px] text-center">{cols.length}</span>
                        </div>

                        {/* Cards */}
                        <div className="space-y-2 min-h-[80px]">
                          {cols.map(a => {
                            const isExpanded = expandedId === a.id
                            const isSaving   = savingCard === a.id
                            const NEXT_STAGES = APP_STATUSES.filter(s => s.value !== stage.value)
                            return (
                              <div key={a.id}
                                className={`bg-white dark:bg-gray-900 border rounded-xl p-3 space-y-2 transition ${
                                  stage.value === 'hired'    ? 'border-green-800' :
                                  stage.value === 'rejected' ? 'border-red-900' :
                                  stage.value === 'offer'    ? 'border-teal-800' :
                                  'border-gray-200 dark:border-gray-800'
                                }`}>
                                {/* Card header */}
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {a.candidateFirstName} {a.candidateLastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{a.candidateEmail}</p>
                                    {a.candidateSource && (
                                      <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">via {a.candidateSource}</p>
                                    )}
                                    {a.interviewScore && (
                                      <p className="text-xs text-amber-400 mt-0.5">⭐ {a.interviewScore}/10</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setExpandedId(isExpanded ? null : a.id)
                                      if (!isExpanded) {
                                        setEditingNotes(prev => ({ ...prev, [a.id]: a.notes ?? '' }))
                                        setEditingScore(prev => ({ ...prev, [a.id]: a.interviewScore ?? '' }))
                                      }
                                    }}
                                    className="text-gray-500 hover:text-white text-xs shrink-0 mt-0.5 transition"
                                  >
                                    {isExpanded ? '▲' : '▼'}
                                  </button>
                                </div>

                                {/* Expanded notes/score */}
                                {isExpanded && (
                                  <div className="space-y-2 pt-1 border-t border-gray-200 dark:border-gray-800">
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Interview Score (0–10)</label>
                                      <input
                                        type="number" min="0" max="10" step="0.5"
                                        value={editingScore[a.id] ?? ''}
                                        onChange={e => setEditingScore(prev => ({ ...prev, [a.id]: e.target.value }))}
                                        placeholder="—"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                                      <textarea
                                        value={editingNotes[a.id] ?? ''}
                                        onChange={e => setEditingNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                                        rows={3}
                                        placeholder="Interview notes, feedback…"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white resize-none focus:outline-none focus:border-purple-500"
                                      />
                                    </div>
                                    <button
                                      disabled={isSaving}
                                      onClick={() => saveCardNotes(a.id)}
                                      className="w-full py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition">
                                      {isSaving ? 'Saving…' : 'Save Notes'}
                                    </button>
                                  </div>
                                )}

                                {/* Create offer letter CTA */}
                                {stage.value === 'offer' && (
                                  <button
                                    onClick={() => openOfferLetter(a)}
                                    className="w-full py-1.5 text-xs font-medium bg-teal-700 hover:bg-teal-600 text-white rounded-lg transition">
                                    📄 Create Offer Letter
                                  </button>
                                )}

                                {/* Move to stage */}
                                <div className="relative group">
                                  <button className="w-full py-1 text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition">
                                    Move to stage ▾
                                  </button>
                                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden hidden group-hover:block">
                                    {NEXT_STAGES.map(s => (
                                      <button key={s.value}
                                        onClick={() => moveStatus(a.id, s.value)}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition">
                                        → {s.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
