'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type MigrationStatus = 'applied' | 'pending'

type Migration = {
  name:        string
  description: string
  status:      MigrationStatus
}

type ListResponse = {
  summary: { total: number; applied: number; pending: number }
  migrations: Migration[]
}

type RunResult = {
  name:       string
  status:     'applied' | 'error'
  durationMs: number
  error?:     string
}

type RunResponse = {
  message: string
  results: RunResult[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#7c3aed'

// ── Helpers ──────────────────────────────────────────────────────────────────

function MigBadge({ status }: { status: MigrationStatus }) {
  return status === 'applied' ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
      bg-green-900/40 text-green-300 border border-green-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
      Applied
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
      bg-yellow-900/30 text-yellow-300 border border-yellow-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block animate-pulse" />
      Pending
    </span>
  )
}

function ResultBadge({ status }: { status: 'applied' | 'error' }) {
  return status === 'applied' ? (
    <span className="text-[11px] font-semibold text-green-400">✓ Applied</span>
  ) : (
    <span className="text-[11px] font-semibold text-red-400">✗ Error</span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MigrationsPage() {
  const [data,    setData]    = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [applying,   setApplying]   = useState(false)
  const [runResults, setRunResults] = useState<RunResult[] | null>(null)
  const [runMessage, setRunMessage] = useState<string | null>(null)
  const [runError,   setRunError]   = useState<string | null>(null)

  const fetchMigrations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/super-admin/migrations')
      const json = await res.json()
      if (res.ok) setData(json)
      else setError(json.error ?? `Error ${res.status}`)
    } catch {
      setError('Network error — could not reach migrations API')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMigrations() }, [fetchMigrations])

  async function applyPending() {
    setApplying(true)
    setRunResults(null)
    setRunMessage(null)
    setRunError(null)
    try {
      const res  = await fetch('/api/super-admin/migrations', { method: 'POST' })
      const json: RunResponse = await res.json()
      setRunResults(json.results ?? [])
      setRunMessage(json.message ?? null)
      if (!res.ok && res.status !== 207) setRunError(json.message ?? `Error ${res.status}`)
    } catch {
      setRunError('Network error — could not reach migrations API')
    }
    setApplying(false)
    // Refresh list after run
    await fetchMigrations()
  }

  const pending = data?.summary.pending ?? 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">Schema Migrations</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            All tenants share one database — running migrations here keeps every client in sync automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchMigrations}
            disabled={loading}
            className="text-[13px] px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition disabled:opacity-40"
          >
            {loading ? '⟳' : '⟳ Refresh'}
          </button>
          <button
            onClick={applyPending}
            disabled={applying || loading || pending === 0}
            className="text-[13px] px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: pending > 0
                ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`
                : 'rgba(255,255,255,0.06)',
              boxShadow: pending > 0 ? `0 0 20px ${ACCENT}40` : 'none',
            }}
          >
            {applying
              ? '⟳ Applying…'
              : pending === 0
              ? '✓ All Applied'
              : `Apply ${pending} Pending`}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',   value: data.summary.total,   accent: 'rgba(255,255,255,0.5)' },
            { label: 'Applied', value: data.summary.applied, accent: '#4ade80' },
            { label: 'Pending', value: data.summary.pending, accent: data.summary.pending > 0 ? '#fbbf24' : '#4ade80' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-widest text-white/30 mb-1">{c.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: c.accent }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Run results */}
      {runResults && runResults.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: runError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[13px] font-semibold" style={{ color: runError ? '#f87171' : '#4ade80' }}>
              {runMessage}
            </p>
          </div>
          {runResults.map((r, i) => (
            <div key={r.name}
              className="flex items-center gap-3 px-4 py-3"
              style={i < runResults.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}>
              <ResultBadge status={r.status} />
              <span className="text-[13px] text-white/70 font-mono flex-1 truncate">{r.name}</span>
              <span className="text-[11px] text-white/25 shrink-0">{r.durationMs}ms</span>
              {r.error && <span className="text-[11px] text-red-400 truncate max-w-[200px]">{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {runResults && runResults.length === 0 && runMessage && (
        <div className="rounded-xl px-4 py-3 text-[13px] text-white/50"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {runMessage}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl px-4 py-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[13px] font-medium text-red-400">{error}</p>
        </div>
      )}

      {/* Migration list */}
      {loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : data && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-white/[0.05]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">Migration</span>
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold text-right">Status</span>
          </div>

          {data.migrations.map((m, i) => (
            <div
              key={m.name}
              className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
              style={i < data.migrations.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-mono text-white/80 truncate">{m.name}</p>
                <p className="text-[11px] text-white/30 mt-0.5 truncate">{m.description}</p>
              </div>
              <MigBadge status={m.status} />
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-xl px-4 py-3.5 flex items-start gap-3"
        style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <span className="text-purple-400 text-[16px] shrink-0 mt-0.5">ℹ</span>
        <p className="text-[12px] text-white/40 leading-relaxed">
          All migrations use <code className="text-purple-300/70 text-[11px]">CREATE TABLE IF NOT EXISTS</code> /
          {' '}<code className="text-purple-300/70 text-[11px]">ADD COLUMN IF NOT EXISTS</code> — they are safe to
          run multiple times. New clients added via the platform automatically share this database and inherit the
          current schema with no extra steps.
        </p>
      </div>
    </div>
  )
}
