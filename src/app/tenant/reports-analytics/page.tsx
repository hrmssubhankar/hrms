'use client'

import { useState, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

type ReportType = 'headcount' | 'leave_summary' | 'payroll_summary' | 'shift_summary'

interface ReportConfig {
  type: ReportType
  label: string
  icon: string
  description: string
  filters: FilterDef[]
}

interface FilterDef {
  key: string
  label: string
  type: 'date'
}

const REPORT_CONFIGS: ReportConfig[] = [
  {
    type: 'headcount',
    label: 'Headcount Report',
    icon: '👥',
    description: 'Active employee count by employment type',
    filters: [],
  },
  {
    type: 'leave_summary',
    label: 'Leave Summary',
    icon: '🌴',
    description: 'Leave requests by type and status for a period',
    filters: [
      { key: 'startDate', label: 'From', type: 'date' },
      { key: 'endDate',   label: 'To',   type: 'date' },
    ],
  },
  {
    type: 'payroll_summary',
    label: 'Payroll Summary',
    icon: '💰',
    description: 'All payroll runs with totals',
    filters: [],
  },
  {
    type: 'shift_summary',
    label: 'Shift Summary',
    icon: '📅',
    description: 'Shifts by type and status for a period',
    filters: [
      { key: 'startDate', label: 'From', type: 'date' },
      { key: 'endDate',   label: 'To',   type: 'date' },
    ],
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportRow = Record<string, any>

function fmt(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—'
  const n = parseFloat(String(v))
  if (isNaN(n)) return String(v)
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' && (key.includes('pay') || key.includes('gross') || key.includes('net') || key.includes('tax') || key.includes('super'))) {
    return fmt(value)
  }
  if (typeof value === 'string' && (key.includes('Date') || key.includes('date') || key.includes('Start') || key.includes('End'))) {
    try { return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return String(value) }
  }
  if (typeof value === 'string') return value.replace(/_/g, ' ')
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function prettyKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

export default function ReportsAnalyticsPage() {
  const [selected, setSelected] = useState<ReportConfig | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [results, setResults] = useState<ReportRow[] | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveModal, setSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  const runReport = useCallback(async () => {
    if (!selected) return
    setRunning(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetchWithAuth('/api/tenant/reports-analytics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: selected.type, filters }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Report failed'); return }
      setResults(data.data || [])
    } catch (e) {
      setError('Network error — please try again')
    } finally { setRunning(false) }
  }, [selected, filters])

  const saveReport = async () => {
    if (!selected || !saveName) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/reports-analytics/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName, reportType: selected.type, filters }),
      })
      setSaveModal(false)
      setSaveName('')
    } finally { setSaving(false) }
  }

  const columns = results && results.length > 0 ? Object.keys(results[0]) : []

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* LEFT: Report picker */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Reports</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a report to run</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {REPORT_CONFIGS.map(cfg => (
            <button
              key={cfg.type}
              onClick={() => { setSelected(cfg); setFilters({}); setResults(null); setError(null) }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.type === cfg.type ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{cfg.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{cfg.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Report output */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-lg font-medium">Select a report</p>
              <p className="text-sm mt-1">Choose from the list on the left to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Report header + filters */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selected.icon} {selected.label}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selected.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {results && results.length > 0 && (
                    <button onClick={() => setSaveModal(true)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      💾 Save
                    </button>
                  )}
                  <button onClick={runReport} disabled={running}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {running ? 'Running…' : '▶ Run Report'}
                  </button>
                </div>
              </div>

              {/* Filters */}
              {selected.filters.length > 0 && (
                <div className="flex items-center gap-4 mt-4">
                  {selected.filters.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                      <input type={f.type} value={filters[f.key] || ''}
                        onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto p-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 mb-4">
                  {error}
                </div>
              )}

              {running && (
                <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="text-3xl mb-2">⏳</div>
                    <p className="text-sm">Running report…</p>
                  </div>
                </div>
              )}

              {!running && results === null && !error && (
                <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="text-3xl mb-2">▶</div>
                    <p className="text-sm">Click &ldquo;Run Report&rdquo; to see results</p>
                  </div>
                </div>
              )}

              {!running && results !== null && results.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No data found for the selected filters
                </div>
              )}

              {!running && results !== null && results.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{results.length} row{results.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {columns.map(col => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                              {prettyKey(col)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {results.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {columns.map(col => (
                              <td key={col} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap capitalize">
                                {formatValue(col, row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* SAVE MODAL */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Save Report</h3>
            <input
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Report name…"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={saveReport} disabled={saving || !saveName}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
