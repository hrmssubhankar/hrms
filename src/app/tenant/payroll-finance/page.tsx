'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface PayrollRun {
  id: string
  name: string
  periodStart: string
  periodEnd: string
  payDate: string | null
  frequency: string
  status: string
  totalGross: string
  totalNet: string
  totalTax: string
  totalSuper: string
  employeeCount: number
  notes: string | null
  createdBy: string | null
  finalisedBy: string | null
  finalisedAt: string | null
  createdAt: string
}

interface RunEntry {
  id: string
  firstName: string | null
  lastName: string | null
  employeeNumber: string | null
  employmentType: string | null
  hoursWorked: string
  grossPay: string
  paygWithholding: string
  superContribution: string
  netPay: string
}

const STATUS_COLORS: Record<string, string> = {
  draft:       'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  processing:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  finalised:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly',
}

function fmt(val: string | number | null | undefined) {
  if (val === null || val === undefined) return '$0.00'
  return `$${parseFloat(String(val)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PayrollFinancePage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [selected, setSelected] = useState<PayrollRun | null>(null)
  const [entries, setEntries] = useState<RunEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', periodStart: '', periodEnd: '', payDate: '', frequency: 'fortnightly', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/tenant/payroll-finance/runs')
      const data = await res.json()
      setRuns(data.runs || [])
    } finally { setLoading(false) }
  }, [])

  const loadEntries = useCallback(async (runId: string) => {
    setEntriesLoading(true)
    try {
      const res = await fetchWithAuth(`/api/tenant/payroll-finance/runs/${runId}/entries`)
      const data = await res.json()
      setEntries(data.entries || [])
    } finally { setEntriesLoading(false) }
  }, [])

  useEffect(() => { loadRuns() }, [loadRuns])

  const selectRun = (run: PayrollRun) => {
    setSelected(run)
    loadEntries(run.id)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetchWithAuth('/api/tenant/payroll-finance/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await loadRuns()
        setShowModal(false)
        setForm({ name: '', periodStart: '', periodEnd: '', payDate: '', frequency: 'fortnightly', notes: '' })
      }
    } finally { setSubmitting(false) }
  }

  const finalise = async (runId: string) => {
    await fetchWithAuth(`/api/tenant/payroll-finance/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finalised' }),
    })
    await loadRuns()
    if (selected?.id === runId) setSelected(s => s ? { ...s, status: 'finalised' } : s)
  }

  const markPaid = async (runId: string) => {
    await fetchWithAuth(`/api/tenant/payroll-finance/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    await loadRuns()
    if (selected?.id === runId) setSelected(s => s ? { ...s, status: 'paid' } : s)
  }

  const totalsByStatus = runs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">💰 Payroll Runs</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >+ New Run</button>
          </div>
          {/* Status summary chips */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsByStatus).map(([s, n]) => (
              <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s]}`}>
                {s} ({n})
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
          ) : runs.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">No payroll runs yet</div>
          ) : (
            runs.map(run => (
              <div
                key={run.id}
                onClick={() => selectRun(run)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selected?.id === run.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{run.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {fmtDate(run.periodStart)} – {fmtDate(run.periodEnd)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[run.status]}`}>
                    {run.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{FREQ_LABELS[run.frequency] || run.frequency}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(run.totalNet)} net</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <div className="text-5xl mb-3">💰</div>
              <p className="text-lg font-medium">Select a payroll run</p>
              <p className="text-sm mt-1">or create a new one to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pay period: {fmtDate(selected.periodStart)} – {fmtDate(selected.periodEnd)}
                    {selected.payDate && <> · Pay date: {fmtDate(selected.payDate)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                  {selected.status === 'draft' && (
                    <button
                      onClick={() => finalise(selected.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >Finalise</button>
                  )}
                  {selected.status === 'finalised' && (
                    <button
                      onClick={() => markPaid(selected.id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >Mark as Paid</button>
                  )}
                </div>
              </div>

              {/* Summary tiles */}
              <div className="mt-5 grid grid-cols-4 gap-4">
                {[
                  { label: 'Gross Pay',     value: fmt(selected.totalGross), color: 'blue' },
                  { label: 'Tax (PAYG)',     value: fmt(selected.totalTax),   color: 'red' },
                  { label: 'Super',          value: fmt(selected.totalSuper), color: 'purple' },
                  { label: 'Net Pay',        value: fmt(selected.totalNet),   color: 'green' },
                ].map(tile => (
                  <div key={tile.label} className={`bg-${tile.color}-50 dark:bg-${tile.color}-900/20 rounded-xl p-4`}>
                    <p className={`text-xs font-medium text-${tile.color}-600 dark:text-${tile.color}-400`}>{tile.label}</p>
                    <p className={`text-xl font-bold text-${tile.color}-700 dark:text-${tile.color}-300 mt-1`}>{tile.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entries table */}
            <div className="flex-1 overflow-auto p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Employee Entries ({entries.length})
              </h3>
              {entriesLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading entries…</div>
              ) : entries.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No entries yet. Add employee pay entries to this run.
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['Employee', 'Type', 'Hours', 'Gross', 'Tax', 'Super', 'Net'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {entries.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{e.firstName} {e.lastName}</p>
                            <p className="text-xs text-gray-400">{e.employeeNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{e.employmentType || '—'}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{parseFloat(e.hoursWorked || '0').toFixed(1)}h</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmt(e.grossPay)}</td>
                          <td className="px-4 py-3 text-red-600 dark:text-red-400">{fmt(e.paygWithholding)}</td>
                          <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{fmt(e.superContribution)}</td>
                          <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">{fmt(e.netPay)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* NEW RUN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Payroll Run</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Run Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Fortnight 14 – Aug 2026"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start *</label>
                  <input required type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End *</label>
                  <input required type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pay Date</label>
                  <input type="date" value={form.payDate} onChange={e => setForm(f => ({ ...f, payDate: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
