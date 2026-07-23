'use client'

import { useEffect, useState } from 'react'

type DEIRecord = {
  id: string; employeeId: string; gender: string | null; indigenousStatus: boolean | null
  disabilityStatus: boolean | null; culturalBackground: string | null
  adjustmentsRequired: string | null; selfReported: boolean; createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
}
type Summary = { total: number; byGender: Record<string, number>; indigenous: number; disability: number; adjustments: number }
type Employee = { id: string; firstName: string; lastName: string }

const INPUT = 'w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function DEIPage() {
  const [records,   setRecords]   = useState<DEIRecord[]>([])
  const [summary,   setSummary]   = useState<Summary>({ total:0, byGender:{}, indigenous:0, disability:0, adjustments:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    employeeId:'', gender:'', indigenousStatus: null as boolean | null,
    disabilityStatus: null as boolean | null, culturalBackground:'', adjustmentsRequired:'',
  })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/dei').then(r => r.json())
    setRecords(data.records ?? [])
    setSummary(data.summary ?? { total:0, byGender:{}, indigenous:0, disability:0, adjustments:0 })
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/dei', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  const pct = (n: number) => summary.total > 0 ? `${Math.round((n / summary.total) * 100)}%` : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Diversity, Equity & Inclusion</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Self-reported diversity data to support equity and inclusion initiatives</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Add Data'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Records</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Indigenous / TSI</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.indigenous}</p>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{pct(summary.indigenous)} of workforce</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Disability</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{summary.disability}</p>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{pct(summary.disability)} of workforce</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Need Adjustments</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{summary.adjustments}</p>
        </div>
      </div>

      {/* Gender breakdown */}
      {Object.keys(summary.byGender).length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">Gender</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.byGender).map(([g, n]) => (
              <div key={g} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{g}</p>
                <p className="text-white text-lg font-bold">{n} <span className="text-xs text-gray-500 dark:text-gray-400">{pct(n)}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 dark:text-gray-400">
            This information is self-reported and confidential. It is used only for aggregate reporting to support DEI initiatives.
          </p>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Employee *</label>
            <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
              <option value="">— Select —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Gender Identity</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={INPUT}>
                <option value="">Prefer not to say</option>
                {['Man','Woman','Non-binary','Gender diverse','Self-describe'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Cultural Background</label>
              <input value={form.culturalBackground} onChange={e => setForm(f => ({ ...f, culturalBackground: e.target.value }))}
                placeholder="e.g. Australian, Vietnamese, Sudanese…" className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.indigenousStatus ?? false}
                onChange={e => setForm(f => ({ ...f, indigenousStatus: e.target.checked }))} className="accent-purple-500 w-4 h-4" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Aboriginal or Torres Strait Islander</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.disabilityStatus ?? false}
                onChange={e => setForm(f => ({ ...f, disabilityStatus: e.target.checked }))} className="accent-purple-500 w-4 h-4" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Living with a disability</span>
            </label>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Workplace Adjustments Required</label>
            <textarea value={form.adjustmentsRequired} onChange={e => setForm(f => ({ ...f, adjustmentsRequired: e.target.value }))}
              rows={2} placeholder="e.g. Ergonomic chair, screen reader, flexible hours…" className={INPUT} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-600 dark:text-gray-400 text-sm">Loading…</p> : records.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-14 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No DEI data on record</p>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Encourage employees to self-report to support DEI reporting.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                {['Employee','Gender','Indigenous','Disability','Adjustments'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-100 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.employeeFirstName} {r.employeeLastName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.gender ?? '—'}</td>
                  <td className="px-4 py-3">{r.indigenousStatus ? <span className="text-amber-400">Yes</span> : <span className="text-gray-600 dark:text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">{r.disabilityStatus ? <span className="text-blue-400">Yes</span> : <span className="text-gray-600 dark:text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate">{r.adjustmentsRequired ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
