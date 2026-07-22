'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type LeaveTypeRow = {
  key: string
  label: string
  emoji: string
  color: string
  accrualNote: string
  entitlementDaysFT: number
  entitlementDaysPT: number
  entitlementDaysCasual: number
  isActive: boolean
  // edit state
  _dirty?: boolean
}

const INPUT = 'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500'
const LABEL = 'block text-xs font-medium text-gray-500 mb-1'

export default function LeaveSettingsPage() {
  const [types,   setTypes]   = useState<LeaveTypeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    // Load all types including inactive — use ?all=1 to bypass active filter
    fetch('/api/tenant/leave/types?all=1')
      .then(r => r.json())
      .then(d => setTypes((d.types ?? []).map((t: LeaveTypeRow) => ({ ...t, _dirty: false }))))
      .catch(() => setError('Failed to load leave types.'))
      .finally(() => setLoading(false))
  }, [])

  function update(key: string, field: keyof LeaveTypeRow, value: unknown) {
    setTypes(prev =>
      prev.map(t => t.key === key ? { ...t, [field]: value, _dirty: true } : t)
    )
    setSaved(false)
  }

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const payload = types.map(({ _dirty: _, ...rest }) => rest)
      const res  = await fetch('/api/tenant/leave/types', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ types: payload }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Save failed (${res.status}).`)
        return
      }
      const d = await res.json()
      setTypes((d.types ?? []).map((t: LeaveTypeRow) => ({ ...t, _dirty: false })))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Network error — please try again.')
    } finally { setSaving(false) }
  }

  const isDirty = types.some(t => t._dirty)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/tenant/leave"
            className="text-gray-500 hover:text-white transition">
            ← Leave
          </Link>
          <h1 className="text-2xl font-bold text-white">Leave Settings</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-400 font-medium">Saved</span>
          )}
          <button
            onClick={save}
            disabled={saving || !isDirty}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Configure leave type entitlements and availability for your organisation.
        Changes apply to all future balance calculations.
        Leave types are based on Australian Fair Work Act 2009 defaults.
      </p>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading…</div>
      ) : types.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No leave types found.</div>
      ) : (
        <div className="space-y-4">
          {types.map(t => (
            <div
              key={t.key}
              className={`bg-gray-900 border rounded-2xl overflow-hidden transition ${
                t._dirty ? 'border-purple-700/60' : t.isActive ? 'border-gray-800' : 'border-gray-800/40 opacity-60'
              }`}
            >
              {/* Row header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{t.accrualNote}</p>
                  </div>
                  {t._dirty && (
                    <span className="text-xs text-purple-400 bg-purple-900/30 border border-purple-800 px-2 py-0.5 rounded-full">
                      unsaved
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-xs text-gray-500">{t.isActive ? 'Active' : 'Inactive'}</span>
                  <button
                    type="button"
                    onClick={() => update(t.key, 'isActive', !t.isActive)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      t.isActive ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      t.isActive ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>

              {/* Entitlement fields */}
              {t.isActive && (
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className={LABEL}>Full-Time Entitlement (days/year)</label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={t.entitlementDaysFT}
                      onChange={e => update(t.key, 'entitlementDaysFT', parseInt(e.target.value) || 0)}
                      className={INPUT}
                    />
                    <p className="text-xs text-gray-600 mt-1">0 = no entitlement · 999 = unlimited</p>
                  </div>
                  <div>
                    <label className={LABEL}>Part-Time Entitlement (days/year)</label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={t.entitlementDaysPT}
                      onChange={e => update(t.key, 'entitlementDaysPT', parseInt(e.target.value) || 0)}
                      className={INPUT}
                    />
                    <p className="text-xs text-gray-600 mt-1">Usually same as FT (pro-rata calculated separately)</p>
                  </div>
                  <div>
                    <label className={LABEL}>Casual Entitlement (days/year)</label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={t.entitlementDaysCasual}
                      onChange={e => update(t.key, 'entitlementDaysCasual', parseInt(e.target.value) || 0)}
                      className={INPUT}
                    />
                    <p className="text-xs text-gray-600 mt-1">Often 0 or 2 per occasion</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && types.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-4 text-xs text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-500 mb-1">Notes</p>
          <p>• Setting a type to <strong className="text-gray-400">Inactive</strong> hides it from the leave request form. Existing requests are not affected.</p>
          <p>• Entitlement changes apply to balance calculations going forward. Historical requests are recalculated on the next view.</p>
          <p>• <strong className="text-gray-400">999</strong> is used internally to represent unlimited leave (e.g. Unpaid Leave). It displays as ∞ in the balances view.</p>
        </div>
      )}
    </div>
  )
}
