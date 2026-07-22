'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type ChecklistItem = { id: string; task: string; done: boolean; category: string }

type Record_ = {
  id: string
  employeeId: string
  stage: string
  status: string
  completedAt: string | null
  buddyId: string | null
  checklist: ChecklistItem[]
  notes: string | null
  createdAt: string
  employeeFirstName: string | null
  employeeLastName:  string | null
  employeeEmail:     string | null
  employeePositionId: string | null
  employeeStartDate: string | null
  employeePhotoUrl:  string | null
}

const STAGE_LABELS: Record<string, string> = {
  pre_start:     'Pre-start',
  day1:          'Day 1',
  week1:         'Week 1',
  weeks2_4:      'Weeks 2–4',
  end_probation: 'End of Probation',
  fully_active:  'Fully Active',
}

const STAGES = Object.entries(STAGE_LABELS)

const CATEGORY_COLOR: Record<string, string> = {
  admin:      'bg-gray-700 text-gray-300',
  it:         'bg-blue-900/60 text-blue-300',
  hr:         'bg-purple-900/60 text-purple-300',
  legal:      'bg-amber-900/60 text-amber-300',
  compliance: 'bg-red-900/60 text-red-300',
  culture:    'bg-pink-900/60 text-pink-300',
}

const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  in_progress: 'bg-blue-900/50 text-blue-300 border-blue-800',
  completed:   'bg-green-900/50 text-green-300 border-green-800',
}

export default function OnboardingDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [rec,    setRec]    = useState<Record_ | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    fetch(`/api/tenant/onboarding/${id}`)
      .then(r => r.json())
      .then(d => setRec(d.record ?? null))
  }, [id])

  async function toggleItem(itemId: string) {
    if (!rec) return
    const updated = rec.checklist.map(t =>
      t.id === itemId ? { ...t, done: !t.done } : t
    )
    setRec({ ...rec, checklist: updated })

    setSaving(true)
    try {
      const res  = await fetch(`/api/tenant/onboarding/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ checklist: updated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Reflect any auto-status change from server
      setRec(r => r ? { ...r, status: data.record.status, completedAt: data.record.completedAt } : r)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function advanceStage() {
    if (!rec) return
    const idx  = STAGES.findIndex(([k]) => k === rec.stage)
    const next = STAGES[idx + 1]?.[0]
    if (!next) return
    setSaving(true)
    try {
      const res  = await fetch(`/api/tenant/onboarding/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRec(r => r ? { ...r, stage: data.record.stage } : r)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!rec) return <div className="text-gray-400">Loading…</div>

  const checklist = rec.checklist ?? []
  const done      = checklist.filter(t => t.done).length
  const pct       = checklist.length ? Math.round(done / checklist.length * 100) : 0
  const stageIdx  = STAGES.findIndex(([k]) => k === rec.stage)
  const canAdvance = stageIdx < STAGES.length - 1

  // Group checklist by category
  const grouped = checklist.reduce<Record<string, ChecklistItem[]>>((acc, t) => {
    ;(acc[t.category] = acc[t.category] ?? []).push(t)
    return acc
  }, {})

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-900 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {(rec.employeeFirstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {rec.employeeFirstName} {rec.employeeLastName}
            </h1>
            <p className="text-gray-400 text-sm">{rec.employeeEmail}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {saved && <span className="text-xs text-green-400">Saved </span>}
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_STYLE[rec.status] ?? 'bg-gray-800 text-gray-300 border-gray-700'}`}>
            {rec.status === 'in_progress' ? 'In Progress' : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
          </span>
          <Link href="/tenant/onboarding"
            className="text-xs border border-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition">
            ← Back
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300">{error}</div>}

      {/* Progress + stage */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Overall Progress</p>
            <p className="text-2xl font-bold text-white">{pct}%
              <span className="text-sm font-normal text-gray-400 ml-2">{done}/{checklist.length} tasks</span>
            </p>
          </div>
          {rec.employeeStartDate && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Start Date</p>
              <p className="text-sm text-white">
                {new Date(rec.employeeStartDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {/* Stage timeline */}
        <div className="flex items-center gap-1 pt-1">
          {STAGES.map(([key, label], i) => (
            <div key={key} className="flex items-center flex-1">
              <div className={`flex flex-col items-center flex-1 ${i < stageIdx ? 'opacity-100' : i === stageIdx ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  i < stageIdx  ? 'bg-green-600 text-white' :
                  i === stageIdx ? 'bg-purple-600 text-white ring-2 ring-purple-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {i < stageIdx ? '' : i + 1}
                </div>
                <p className="text-[10px] text-gray-400 text-center leading-tight">{label}</p>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded ${i < stageIdx ? 'bg-green-600' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {canAdvance && (
          <button onClick={advanceStage} disabled={saving}
            className="w-full mt-2 border border-purple-700 text-purple-300 hover:bg-purple-900/30 text-sm py-2 rounded-lg transition">
            {saving ? 'Saving…' : `Advance to ${STAGE_LABELS[STAGES[stageIdx + 1]?.[0]] ?? 'Next Stage'} →`}
          </button>
        )}
        {rec.status === 'completed' && rec.completedAt && (
          <p className="text-xs text-green-400 text-center">
            Completed {new Date(rec.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Checklist by category */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Onboarding Checklist</h2>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLOR[category] ?? 'bg-gray-700 text-gray-300'}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {items.filter(t => t.done).length}/{items.length}
              </span>
            </div>
            <ul className="divide-y divide-gray-800/50">
              {items.map(item => (
                <li key={item.id}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-800/30 transition ${saving ? 'pointer-events-none opacity-70' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition ${
                    item.done ? 'bg-purple-600 border-purple-600' : 'border-gray-600'
                  }`}>
                    {item.done && <span className="text-white text-xs"></span>}
                  </div>
                  <span className={`text-sm transition ${item.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.task}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Notes */}
      {rec.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Notes</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{rec.notes}</p>
        </div>
      )}

    </div>
  )
}
