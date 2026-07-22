'use client'

import { useState, useCallback } from 'react'

const REPORTS = [
  { id:'headcount',  label:'Headcount',          icon:'', description:'All employees by type and status' },
  { id:'leave',      label:'Leave Summary',       icon:'️', description:'Leave requests in a date range' },
  { id:'compliance', label:'Compliance / Checks', icon:'', description:'Screening record status overview' },
  { id:'turnover',   label:'Turnover / Exits',    icon:'', description:'Separation and exit records' },
  { id:'whs',        label:'WHS Incidents',       icon:'', description:'Workplace safety incidents summary' },
]

type ReportRow = Record<string, unknown>
type Summary  = Record<string, number>

function downloadCsv(rows: ReportRow[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const a = document.createElement('a')
  a.href  = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default function ReportsPage() {
  const [selected, setSelected]   = useState('headcount')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [data, setData]           = useState<ReportRow[]>([])
  const [summary, setSummary]     = useState<Summary>({})
  const [loading, setLoading]     = useState(false)
  const [ran, setRan]             = useState(false)

  const run = useCallback(async () => {
    setLoading(true); setRan(true)
    const p = new URLSearchParams({ report: selected })
    if (dateFrom) p.set('from', dateFrom)
    if (dateTo)   p.set('to',   dateTo)
    const res = await fetch(`/api/tenant/reports?${p}`)
    if (res.ok) {
      const d = await res.json()
      setData(d.data ?? [])
      setSummary(d.summary ?? {})
    }
    setLoading(false)
  }, [selected, dateFrom, dateTo])

  const report = REPORTS.find(r => r.id === selected)!
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => !k.endsWith('Id') && k !== 'id') : []

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and export HR reports</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Report Type</p>
            <div className="space-y-1">
              {REPORTS.map(r => (
                <button key={r.id} onClick={() => { setSelected(r.id); setRan(false); setData([]); setSummary({}) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${selected===r.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span className="mr-2">{r.icon}</span>{r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Date Range</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button onClick={run} disabled={loading}
              className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Running…' : 'Run Report'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!ran ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <p className="text-5xl mb-4">{report.icon}</p>
                <h2 className="text-lg font-semibold text-gray-900">{report.label}</h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">{report.description}</p>
                <button onClick={run} className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">Run Report</button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Generating report…</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary cards */}
              {Object.keys(summary).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(summary).map(([k, v]) => (
                    <div key={k} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{v}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{k.replace(/([A-Z])/g,' $1').toLowerCase()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Export + row count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600"><span className="font-medium">{data.length}</span> records</p>
                <button onClick={() => downloadCsv(data, `${selected}-report.csv`)}
                  disabled={data.length === 0}
                  className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  ⬇ Export CSV
                </button>
              </div>

              {/* Table */}
              {data.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">No data for this period</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {columns.map(c => (
                            <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                              {c.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            {columns.map(c => (
                              <td key={c} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                {row[c] instanceof Date
                                  ? (row[c] as Date).toLocaleDateString()
                                  : typeof row[c] === 'boolean'
                                  ? row[c] ? '' : '—'
                                  : String(row[c] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
