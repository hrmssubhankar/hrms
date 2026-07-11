'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type OnboardingRecord = {
  id: string
  employeeId: string
  stage: string
  status: string
  completedAt: string | null
  checklist: { id: string; task: string; done: boolean; category: string }[]
  notes: string | null
  createdAt: string
  employeeFirstName: string | null
  employeeLastName:  string | null
  employeeEmail:     string | null
  employeePositionId: string | null
  employeeStartDate: string | null
}

type Stats = { total: number; pending: number; in_progress: number; completed: number }

const STAGE_LABELS: Record<string, string> = {
  pre_start:      'Pre-start',
  day1:           'Day 1',
  week1:          'Week 1',
  weeks2_4:       'Weeks 2–4',
  end_probation:  'End of Probation',
  fully_active:   'Fully Active',
}

const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  in_progress: 'bg-blue-900/50 text-blue-300 border-blue-800',
  completed:   'bg-green-900/50 text-green-300 border-green-800',
}

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([])
  const [stats,   setStats]   = useState<Stats>({ total: 0, pending: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('')

  async function load(s = search, f = filter) {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (f) params.set('status', f)
    const res  = await fetch(`/api/tenant/onboarding?${params}`)
    const data = await res.json()
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total: 0, pending: 0, in_progress: 0, completed: 0 })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function progress(checklist: OnboardingRecord['checklist']) {
    if (!checklist?.length) return 0
    return Math.round(checklist.filter(t => t.done).length / checklist.length * 100)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Onboarding & Induction</h1>
          <p className="text-gray-400 text-sm mt-1">Track new employee onboarding progress</p>
        </div>
        <Link href="/tenant/onboarding/new"
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
          + Start Onboarding
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: stats.total,       color: 'text-white',       onClick: () => { setFilter(''); load(search, '') } },
          { label: 'Pending',     value: stats.pending,     color: 'text-yellow-400',  onClick: () => { setFilter('pending');     load(search, 'pending') } },
          { label: 'In Progress', value: stats.in_progress, color: 'text-blue-400',    onClick: () => { setFilter('in_progress'); load(search, 'in_progress') } },
          { label: 'Completed',   value: stats.completed,   color: 'text-green-400',   onClick: () => { setFilter('completed');   load(search, 'completed') } },
        ].map(s => (
          <button key={s.label} onClick={s.onClick}
            className={`bg-gray-900 border rounded-xl p-5 text-left transition hover:border-purple-700 ${
              (filter === (s.label === 'Total' ? '' : s.label.toLowerCase().replace(' ', '_')))
                ? 'border-purple-600' : 'border-gray-800'
            }`}>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value, filter) }}
          placeholder="Search by name or email…"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        {(search || filter) && (
          <button onClick={() => { setSearch(''); setFilter(''); load('', '') }}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-lg transition">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : records.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-300 font-medium">No onboarding records yet</p>
          <p className="text-gray-500 text-sm mt-1">Start onboarding a new employee to get going.</p>
          <Link href="/tenant/onboarding/new"
            className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2 rounded-lg transition">
            + Start Onboarding
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Stage</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Progress</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Start Date</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const pct  = progress(r.checklist)
                const done = r.checklist?.filter(t => t.done).length ?? 0
                const tot  = r.checklist?.length ?? 0
                return (
                  <tr key={r.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(r.employeeFirstName?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{r.employeeFirstName} {r.employeeLastName}</p>
                          <p className="text-gray-400 text-xs">{r.employeeEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-300">{STAGE_LABELS[r.stage] ?? r.stage}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                        {r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{done}/{tot}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {r.employeeStartDate
                        ? new Date(r.employeeStartDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/tenant/onboarding/${r.id}`}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
