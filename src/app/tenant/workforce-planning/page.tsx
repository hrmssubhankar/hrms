'use client'

import { useEffect, useState, useCallback } from 'react'

type Plan = {
  id: string; departmentId: string | null; positionId: string | null
  plannedCount: number; currentCount: number; vacancyCount: number
  targetDate: string | null; status: string; notes: string | null; createdAt: string
  departmentName: string | null; positionTitle: string | null
}
type Stats = { totalPlanned: number; totalCurrent: number; totalVacancies: number; openRoles: number }

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function WorkforcePlanningPage() {
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [stats,   setStats]   = useState<Stats>({ totalPlanned:0, totalCurrent:0, totalVacancies:0, openRoles:0 })
  const [loading, setLoading] = useState(true)
  const [showForm,setShowForm]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({ plannedCount: 1, currentCount: 0, vacancyCount: 0, targetDate: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/workforce-planning').then(r => r.json())
    setPlans(data.plans ?? [])
    setStats(data.stats ?? { totalPlanned:0, totalCurrent:0, totalVacancies:0, openRoles:0 })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/workforce-planning', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  async function close(id: string) {
    await fetch('/api/tenant/workforce-planning', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status:'filled' }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workforce Planning</h1>
          <p className="text-gray-400 text-sm mt-1">Track headcount targets, vacancies, and hiring pipeline</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Add Plan'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Planned',   value:stats.totalPlanned,   color:'text-white' },
          { label:'Current',   value:stats.totalCurrent,   color:'text-green-400' },
          { label:'Vacancies', value:stats.totalVacancies, color:'text-amber-400' },
          { label:'Open Roles',value:stats.openRoles,      color:'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Add Headcount Plan</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Planned Count *</label>
              <input required type="number" min={1} value={form.plannedCount}
                onChange={e => setForm(f => ({ ...f, plannedCount: Number(e.target.value) }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Current Count</label>
              <input type="number" min={0} value={form.currentCount}
                onChange={e => setForm(f => ({ ...f, currentCount: Number(e.target.value) }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Vacancies</label>
              <input type="number" min={0} value={form.vacancyCount}
                onChange={e => setForm(f => ({ ...f, vacancyCount: Number(e.target.value) }))} className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Target Date</label>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={INPUT} />
          </div>
          <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Add Plan'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : plans.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">📐</p>
          <p className="text-gray-300 font-medium">No workforce plans yet</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                {['Role / Department','Planned','Current','Vacancies','Target Date','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {plans.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <p className="text-gray-200">{p.positionTitle ?? 'General'}</p>
                    {p.departmentName && <p className="text-xs text-gray-500">{p.departmentName}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.plannedCount}</td>
                  <td className="px-4 py-3 text-green-400">{p.currentCount}</td>
                  <td className="px-4 py-3">
                    <span className={p.vacancyCount > 0 ? 'text-amber-400 font-medium' : 'text-gray-500'}>{p.vacancyCount}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.targetDate ? new Date(p.targetDate + 'T00:00:00').toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.status === 'open' ? 'bg-blue-900/50 text-blue-300 border-blue-800' : 'bg-green-900/50 text-green-300 border-green-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'open' && (
                      <button onClick={() => close(p.id)}
                        className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400 px-2 py-1 rounded transition">
                        Mark Filled
                      </button>
                    )}
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
