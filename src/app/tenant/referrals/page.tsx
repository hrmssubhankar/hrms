'use client'

import { useEffect, useState } from 'react'

type Referral = {
  id: string; referrerId: string; referredName: string | null; referredEmail: string | null
  status: string; bonusAmount: string | null; bonusPaidAt: string | null; createdAt: string
  referrerFirstName: string | null; referrerLastName: string | null
}
type Stats = { total: number; pending: number; hired: number; bonusPaid: number }
type Employee = { id: string; firstName: string; lastName: string }

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-blue-900/50 text-blue-300 border-blue-800',
  screening:'bg-purple-900/50 text-purple-300 border-purple-800',
  hired:    'bg-green-900/50 text-green-300 border-green-800',
  rejected: 'bg-red-900/50 text-red-300 border-red-800',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, pending:0, hired:0, bonusPaid:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({ referrerId:'', referredName:'', referredEmail:'', bonusAmount:'', notes:'' })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/referrals').then(r => r.json())
    setReferrals(data.referrals ?? [])
    setStats(data.stats ?? { total:0, pending:0, hired:0, bonusPaid:0 })
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/referrals', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  async function advance(id: string, status: string) {
    await fetch('/api/tenant/referrals', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status }) })
    load()
  }

  async function payBonus(id: string) {
    await fetch('/api/tenant/referrals', { method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ id, bonusPaidAt: new Date().toISOString() }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <p className="text-gray-400 text-sm mt-1">Track employee referrals and bonus payments</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Submit Referral'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total',      value:stats.total,     color:'text-white' },
          { label:'Pending',    value:stats.pending,   color:'text-blue-400' },
          { label:'Hired',      value:stats.hired,     color:'text-green-400' },
          { label:'Bonus Paid', value:stats.bonusPaid, color:'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Referring Employee *</label>
              <select required value={form.referrerId} onChange={e => setForm(f => ({ ...f, referrerId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Referred Person Name *</label>
              <input required value={form.referredName} onChange={e => setForm(f => ({ ...f, referredName: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Referred Email</label>
              <input type="email" value={form.referredEmail} onChange={e => setForm(f => ({ ...f, referredEmail: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bonus Amount ($)</label>
              <input type="number" step="0.01" value={form.bonusAmount} onChange={e => setForm(f => ({ ...f, bonusAmount: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Submitting…' : 'Submit Referral'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : referrals.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-300 font-medium">No referrals yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-medium text-sm">{r.referredName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>{r.status}</span>
                  {r.bonusPaidAt && <span className="text-xs text-green-400">Bonus paid</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Referred by {r.referrerFirstName} {r.referrerLastName}
                  {r.bonusAmount && <span className="ml-2 text-purple-400">${Number(r.bonusAmount).toFixed(2)} bonus</span>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status === 'pending' && (
                  <button onClick={() => advance(r.id, 'screening')}
                    className="text-xs bg-purple-600/20 border border-purple-700 text-purple-300 hover:bg-purple-600/40 px-2.5 py-1 rounded transition">
                    → Screening
                  </button>
                )}
                {r.status === 'screening' && (
                  <button onClick={() => advance(r.id, 'hired')}
                    className="text-xs bg-green-900/40 border border-green-800 text-green-300 hover:bg-green-900/60 px-2.5 py-1 rounded transition">
                    Hired
                  </button>
                )}
                {r.status === 'hired' && !r.bonusPaidAt && r.bonusAmount && (
                  <button onClick={() => payBonus(r.id)}
                    className="text-xs bg-amber-900/40 border border-amber-800 text-amber-300 hover:bg-amber-900/60 px-2.5 py-1 rounded transition">
                    Pay Bonus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
