'use client'

import { useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type Priority = 'info' | 'warning' | 'critical'

type Announcement = {
  id:            string
  title:         string
  body:          string
  priority:      Priority
  targetTenants: string
  expiresAt:     string | null
  createdAt:     string
  createdBy:     string
  isActive:      boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#7c3aed'

const PRIORITY_CONFIG: Record<Priority, {
  label: string
  icon: string
  dot: string
  badge: string
  border: string
  glow: string
}> = {
  info: {
    label:  'Info',
    icon:   'ℹ',
    dot:    '#60a5fa',
    badge:  'bg-blue-900/30 text-blue-300 border-blue-700/50',
    border: 'rgba(96,165,250,0.15)',
    glow:   'rgba(96,165,250,0.06)',
  },
  warning: {
    label:  'Warning',
    icon:   '⚠',
    dot:    '#fbbf24',
    badge:  'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
    border: 'rgba(251,191,36,0.15)',
    glow:   'rgba(251,191,36,0.06)',
  },
  critical: {
    label:  'Critical',
    icon:   '🚨',
    dot:    '#f87171',
    badge:  'bg-red-900/30 text-red-300 border-red-700/50',
    border: 'rgba(248,113,113,0.2)',
    glow:   'rgba(248,113,113,0.08)',
  },
}

const EMPTY_FORM = {
  title: '', body: '', priority: 'info', targetTenants: 'all', expiresAt: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.badge}`}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

function fmtDate(d: string | number | null) {
  if (!d) return null
  return new Date(d).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isExpired(expiresAt: string | null) {
  return expiresAt ? new Date(expiresAt) < new Date() : false
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  function load() {
    setLoading(true)
    fetch('/api/super-admin/announcements')
      .then(r => r.json())
      .then(d => { setAnnouncements(d.announcements ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function publish() {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/super-admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to publish'); setSaving(false); return }
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
      load()
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/super-admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    })
    setAnnouncements(a => a.map(x => x.id === id ? { ...x, isActive: !current } : x))
  }

  async function deleteAnn(id: string) {
    if (!confirm('Permanently delete this announcement?')) return
    await fetch(`/api/super-admin/announcements?id=${id}`, { method: 'DELETE' })
    setAnnouncements(a => a.filter(x => x.id !== id))
  }

  const active   = announcements.filter(a => a.isActive && !isExpired(a.expiresAt))
  const inactive = announcements.filter(a => !a.isActive || isExpired(a.expiresAt))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">Platform Announcements</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            Broadcast notices to all tenants — shown as a banner in every client dashboard and delivered by email.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(null) }}
          className="shrink-0 text-[13px] font-semibold px-4 py-2 rounded-lg text-white transition-all"
          style={{ background: showForm ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, boxShadow: showForm ? 'none' : `0 0 20px ${ACCENT}40` }}
        >
          {showForm ? '✕ Cancel' : '+ New Announcement'}
        </button>
      </div>

      {/* Summary row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active',   value: active.length,             accent: '#4ade80' },
            { label: 'Inactive', value: inactive.length,           accent: 'rgba(255,255,255,0.3)' },
            { label: 'Total',    value: announcements.length,      accent: 'rgba(255,255,255,0.5)' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-widest text-white/30 mb-1">{c.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: c.accent }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl p-5 space-y-4"
          style={{ background: 'rgba(124,58,237,0.06)', border: `1px solid ${ACCENT}30` }}>
          <p className="text-[13px] font-semibold text-purple-300">New Announcement</p>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/30 mb-1.5 block">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Scheduled maintenance on 15 Sep"
              className="w-full rounded-lg px-3 py-2 text-[13px] text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/30 mb-1.5 block">Message *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Enter the message all tenants will see…"
              className="w-full rounded-lg px-3 py-2 text-[13px] text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-white/30 mb-1.5 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="info">ℹ Info</option>
                <option value="warning">⚠ Warning</option>
                <option value="critical">🚨 Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-white/30 mb-1.5 block">Audience</label>
              <select
                value={form.targetTenants}
                onChange={e => setForm(f => ({ ...f, targetTenants: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="all">All Tenants</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-white/30 mb-1.5 block">Expires (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <button
            onClick={publish}
            disabled={saving || !form.title.trim() || !form.body.trim()}
            className="text-[13px] font-semibold px-5 py-2 rounded-lg text-white transition disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` }}
          >
            {saving ? 'Publishing…' : 'Publish Announcement'}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && announcements.length === 0 && (
        <div className="rounded-xl p-14 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">📢</p>
          <p className="text-[14px] font-medium text-white/40">No announcements yet</p>
          <p className="text-[12px] text-white/20 mt-1">Create one to broadcast a message to all client tenants</p>
        </div>
      )}

      {/* Active announcements */}
      {active.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Active ({active.length})</p>
          {active.map(ann => <AnnCard key={ann.id} ann={ann} onToggle={toggleActive} onDelete={deleteAnn} />)}
        </section>
      )}

      {/* Inactive / expired */}
      {inactive.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mt-2">Inactive / Expired ({inactive.length})</p>
          {inactive.map(ann => <AnnCard key={ann.id} ann={ann} onToggle={toggleActive} onDelete={deleteAnn} dimmed />)}
        </section>
      )}
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function AnnCard({
  ann, onToggle, onDelete, dimmed = false,
}: {
  ann: Announcement
  onToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  dimmed?: boolean
}) {
  const p   = PRIORITY_CONFIG[ann.priority] ?? PRIORITY_CONFIG.info
  const exp = isExpired(ann.expiresAt)

  return (
    <div
      className="rounded-xl p-4 transition-opacity"
      style={{
        background: dimmed ? 'rgba(255,255,255,0.02)' : p.glow,
        border: `1px solid ${dimmed ? 'rgba(255,255,255,0.06)' : p.border}`,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <span className="text-[18px] shrink-0 mt-0.5 leading-none">{p.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-[13px] font-semibold text-white/90">{ann.title}</span>
            <PriorityBadge priority={ann.priority} />
            {!ann.isActive && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-white/30">Inactive</span>
            )}
            {exp && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-red-700/40 text-red-400/70">Expired</span>
            )}
            <span className="text-[11px] text-white/25">
              → {ann.targetTenants === 'all' ? 'All tenants' : ann.targetTenants}
            </span>
          </div>

          <p className="text-[12px] text-white/50 leading-relaxed whitespace-pre-wrap">{ann.body}</p>

          <div className="flex items-center gap-4 mt-2 text-[11px] text-white/25">
            <span>By {ann.createdBy}</span>
            <span>{fmtDate(ann.createdAt)}</span>
            {ann.expiresAt && !exp && <span>Expires {fmtDate(ann.expiresAt)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(ann.id, ann.isActive)}
            className="text-[11px] px-3 py-1 rounded-lg border transition"
            style={ann.isActive
              ? { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }
              : { borderColor: 'rgba(74,222,128,0.3)', color: '#4ade80' }}
          >
            {ann.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(ann.id)}
            className="text-[11px] text-red-400/60 hover:text-red-400 px-2 py-1 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
