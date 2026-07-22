'use client'

import { useEffect, useState } from 'react'

type Survey = { id: string; title: string; type: string | null; isAnonymous: boolean; questions: unknown[]; isActive: boolean; createdAt: string }
type Response = { id: string; surveyId: string; employeeId: string | null; answers: unknown; submittedAt: string; employeeFirstName: string | null; employeeLastName: string | null }
type Employee = { id: string; firstName: string; lastName: string }

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

const SURVEY_TYPES = [
  { value: 'new_starter_30', label: 'New Starter 30-day' },
  { value: 'probation_90',   label: 'Probation 90-day' },
  { value: 'annual',         label: 'Annual Engagement' },
  { value: 'pulse',          label: 'Pulse Check' },
  { value: 'exit',           label: 'Exit Survey' },
]

export default function EngagementPage() {
  const [surveys,   setSurveys]   = useState<Survey[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<Survey | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [showResp,  setShowResp]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ title:'', type:'pulse', isAnonymous:true })
  const [respForm, setRespForm] = useState({ employeeId:'', freeText:'' })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/engagement').then(r => r.json())
    setSurveys(data.surveys ?? [])
    setLoading(false)
  }

  const loadResponses = async (surveyId: string) => {
    const data = await fetch(`/api/tenant/engagement?surveyId=${surveyId}`).then(r => r.json())
    setResponses(data.responses ?? [])
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function createSurvey(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/engagement', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault(); if (!selected) return; setSaving(true)
    await fetch('/api/tenant/engagement', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _type:'response', surveyId: selected.id, employeeId: respForm.employeeId, answers: { feedback: respForm.freeText } }),
    })
    setShowResp(false); setSaving(false)
    if (selected) loadResponses(selected.id)
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch('/api/tenant/engagement', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, isActive }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Voice & Surveys</h1>
          <p className="text-gray-400 text-sm mt-1">Create surveys, collect responses, and track engagement</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ New Survey'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSurvey} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Survey Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {SURVEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-5">
              <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} className="accent-purple-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Anonymous responses</span>
            </label>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Creating…' : 'Create Survey'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : surveys.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No surveys yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {surveys.map(s => (
            <div key={s.id} className={`bg-gray-900 border rounded-xl p-5 ${selected?.id === s.id ? 'border-purple-600' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-white font-medium">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                    {SURVEY_TYPES.find(t => t.value === s.type)?.label ?? s.type ?? 'General'}
                    {s.isAnonymous && ' · Anonymous'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${s.isActive ? 'bg-green-900/50 text-green-300 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  {s.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                <button onClick={() => { setSelected(s); loadResponses(s.id) }}
                  className="text-xs bg-purple-600/20 border border-purple-700 text-purple-300 hover:bg-purple-600/40 px-3 py-1.5 rounded transition">
                  View Responses
                </button>
                {s.isActive && (
                  <button onClick={() => { setSelected(s); setShowResp(true) }}
                    className="text-xs bg-gray-800 border border-gray-700 text-gray-300 hover:border-purple-600 px-3 py-1.5 rounded transition">
                    + Record Response
                  </button>
                )}
                <button onClick={() => toggleActive(s.id, !s.isActive)}
                  className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 px-3 py-1.5 rounded transition">
                  {s.isActive ? 'Close' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record response form */}
      {showResp && selected && (
        <form onSubmit={submitResponse} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Record Response — {selected.title}</h3>
          {!selected.isAnonymous && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee</label>
              <select value={respForm.employeeId} onChange={e => setRespForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Feedback / Response</label>
            <textarea required value={respForm.freeText} onChange={e => setRespForm(f => ({ ...f, freeText: e.target.value }))}
              rows={4} placeholder="Employee feedback…" className={INPUT} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
              {saving ? 'Saving…' : 'Submit Response'}
            </button>
            <button type="button" onClick={() => setShowResp(false)}
              className="text-sm text-gray-400 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Responses panel */}
      {selected && responses.length > 0 && !showResp && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-3">Responses — {selected.title} ({responses.length})</p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {responses.map(r => (
              <div key={r.id} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">
                  {selected.isAnonymous ? 'Anonymous' : `${r.employeeFirstName} ${r.employeeLastName}`}
                  <span className="ml-2">{new Date(r.submittedAt).toLocaleDateString('en-AU')}</span>
                </p>
                <p className="text-sm text-gray-300">
                  {typeof r.answers === 'object' && r.answers !== null && 'feedback' in (r.answers as object)
                    ? (r.answers as {feedback: string}).feedback
                    : JSON.stringify(r.answers)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
