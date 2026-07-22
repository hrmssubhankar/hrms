'use client'

import { useEffect, useState } from 'react'

type Recognition = {
  id: string; recipientId: string; nominatedBy: string | null; type: string
  reason: string | null; period: string | null; isPublic: boolean; createdAt: string
  recipientFirstName: string | null; recipientLastName: string | null
}
type Employee = { id: string; firstName: string; lastName: string }

const REC_TYPES = [
  { value: 'employee_of_quarter', label: 'Employee of the Quarter' },
  { value: 'peer',                label: 'Peer Recognition' },
  { value: 'safety_champion',     label: 'Safety (WHS) Champion' },
  { value: 'above_beyond',        label: '⭐ Above & Beyond' },
  { value: 'ndis_excellence',     label: 'NDIS Excellence' },
  { value: 'innovation',          label: 'Innovation' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function RecognitionPage() {
  const [recs,      setRecs]      = useState<Recognition[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ recipientId:'', nominatedBy:'', type:'peer', reason:'', period:'' })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/recognition').then(r => r.json())
    setRecs(data.recognitions ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function nominate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/recognition', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recognition & Rewards</h1>
          <p className="text-gray-400 text-sm mt-1">Celebrate employee achievements and peer nominations</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Nominate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={nominate} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Recipient *</label>
              <select required value={form.recipientId} onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nominated By</label>
              <select value={form.nominatedBy} onChange={e => setForm(f => ({ ...f, nominatedBy: e.target.value }))} className={INPUT}>
                <option value="">— Management —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {REC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Period</label>
              <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                placeholder="e.g. Q2-2026" className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="Why are you nominating this person?" className={INPUT} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Submitting…' : 'Submit Nomination'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : recs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No recognitions yet</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Start celebrating your team's achievements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recs.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-lg font-bold text-purple-300">
                  {r.recipientFirstName?.[0]}{r.recipientLastName?.[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{r.recipientFirstName} {r.recipientLastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{REC_TYPES.find(t => t.value === r.type)?.label ?? r.type}</p>
                </div>
                {r.period && <span className="ml-auto text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">{r.period}</span>}
              </div>
              {r.reason && <p className="text-sm text-gray-300 leading-relaxed">"{r.reason}"</p>}
              <p className="text-xs text-gray-600 mt-3 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-AU')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
