'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue'
type AuditResult = 'conformant' | 'non_conformant' | 'not_applicable' | 'partial'
type RiskRating  = 'low' | 'medium' | 'high' | 'critical'
type ActionStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Audit {
  id: string
  title: string
  auditType: string
  standard: string
  outcomeGroup: string | null
  status: AuditStatus
  result: AuditResult | null
  riskRating: RiskRating | null
  scheduledDate: string
  completedDate: string | null
  nextReviewDate: string | null
  auditorName: string | null
  auditorOrg: string | null
  findingSummary: string | null
  correctiveActions: string | null
  evidenceUrl: string | null
  notes: string | null
  assignedTo: string | null
  createdBy: string | null
  createdAt: string
}

interface CorrectiveAction {
  id: string
  auditId: string
  description: string
  priority: string
  status: ActionStatus
  dueDate: string | null
  assignedTo: string | null
  notes: string | null
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIT_TYPES = ['internal', 'external', 'certification', 'surveillance']
const AUDIT_TYPE_LABELS: Record<string, string> = {
  internal:      'Internal',
  external:      'External',
  certification: 'Certification',
  surveillance:  'Surveillance',
}

const NDIS_STANDARDS = [
  'NDIS Practice Standard 1.1 — Person-centred Supports',
  'NDIS Practice Standard 1.2 — Access to Supports',
  'NDIS Practice Standard 1.3 — Support Planning',
  'NDIS Practice Standard 1.4 — Support Provision',
  'NDIS Practice Standard 2.1 — Preventing & Responding to Violence, Abuse, Neglect, Exploitation & Discrimination',
  'NDIS Practice Standard 2.2 — Incident Management',
  'NDIS Practice Standard 2.3 — Reportable Incidents',
  'NDIS Practice Standard 2.4 — Complaints Management',
  'NDIS Practice Standard 3.1 — Governance & Operational Management',
  'NDIS Practice Standard 3.2 — Risk Management',
  'NDIS Practice Standard 3.3 — Quality Management',
  'NDIS Practice Standard 3.4 — Information Management',
  'NDIS Practice Standard 3.5 — Feedback & Complaints Management',
  'NDIS Practice Standard 4.1 — Specialist Behaviour Support',
  'NDIS Practice Standard 4.2 — Implementing Behaviour Support Plans',
  'NDIS Practice Standard 4.3 — Early Childhood Supports',
  'Other',
]

const OUTCOME_GROUPS = ['rights_protection', 'governance', 'support_provision', 'workforce']
const OUTCOME_GROUP_LABELS: Record<string, string> = {
  rights_protection: 'Rights & Protection',
  governance:        'Governance',
  support_provision: 'Support Provision',
  workforce:         'Workforce',
}

const STATUS_COLORS: Record<AuditStatus, string> = {
  scheduled:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  overdue:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const RESULT_COLORS: Record<string, string> = {
  conformant:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  non_conformant:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  partial:         'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  not_applicable:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const RISK_COLORS: Record<string, string> = {
  low:      'text-green-600 dark:text-green-400',
  medium:   'text-yellow-600 dark:text-yellow-400',
  high:     'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function cap(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const emptyForm = () => ({
  title: '',
  auditType: 'internal',
  standard: NDIS_STANDARDS[0],
  outcomeGroup: '',
  status: 'scheduled',
  result: '',
  riskRating: '',
  scheduledDate: '',
  completedDate: '',
  nextReviewDate: '',
  auditorName: '',
  auditorOrg: '',
  findingSummary: '',
  correctiveActions: '',
  evidenceUrl: '',
  notes: '',
  assignedTo: '',
})

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NdisAuditsPage() {
  const [audits, setAudits]             = useState<Audit[]>([])
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [search, setSearch]             = useState('')

  // Modal state
  const [showCreate, setShowCreate]       = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null)
  const [viewAudit, setViewAudit]         = useState<{ audit: Audit; actions: CorrectiveAction[] } | null>(null)
  const [saving, setSaving]               = useState(false)
  const [form, setForm]                   = useState(emptyForm())

  // Action form
  const [showActionForm, setShowActionForm] = useState(false)
  const [actionForm, setActionForm]         = useState({ description: '', priority: 'medium', dueDate: '', assignedTo: '', notes: '' })
  const [savingAction, setSavingAction]     = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterType)   params.set('auditType', filterType)
    if (filterResult) params.set('result', filterResult)
    const res = await fetchWithAuth(`/api/tenant/ndis-audits?${params}`)
    if (res.ok) {
      const data = await res.json()
      setAudits(data.audits ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterStatus, filterType, filterResult])

  async function openDetail(audit: Audit) {
    const res = await fetchWithAuth(`/api/tenant/ndis-audits/${audit.id}`)
    if (res.ok) {
      const data = await res.json()
      setViewAudit({ audit: data.audit, actions: data.actions ?? [] })
    }
  }

  async function handleSave() {
    setSaving(true)
    const isEdit = !!selectedAudit
    const url    = isEdit ? `/api/tenant/ndis-audits/${selectedAudit!.id}` : '/api/tenant/ndis-audits'
    const method = isEdit ? 'PATCH' : 'POST'

    const payload: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(form)) {
      payload[k] = v || null
    }

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowCreate(false)
      setSelectedAudit(null)
      setForm(emptyForm())
      load()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this audit record?')) return
    await fetchWithAuth(`/api/tenant/ndis-audits/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleAddAction() {
    if (!viewAudit) return
    setSavingAction(true)
    const res = await fetchWithAuth(`/api/tenant/ndis-audits/${viewAudit.audit.id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionForm),
    })
    if (res.ok) {
      const data = await res.json()
      setViewAudit(prev => prev ? { ...prev, actions: [data.action, ...prev.actions] } : null)
      setActionForm({ description: '', priority: 'medium', dueDate: '', assignedTo: '', notes: '' })
      setShowActionForm(false)
    }
    setSavingAction(false)
  }

  function openEdit(audit: Audit) {
    setSelectedAudit(audit)
    setForm({
      title:             audit.title,
      auditType:         audit.auditType,
      standard:          audit.standard,
      outcomeGroup:      audit.outcomeGroup ?? '',
      status:            audit.status,
      result:            audit.result ?? '',
      riskRating:        audit.riskRating ?? '',
      scheduledDate:     audit.scheduledDate ?? '',
      completedDate:     audit.completedDate ?? '',
      nextReviewDate:    audit.nextReviewDate ?? '',
      auditorName:       audit.auditorName ?? '',
      auditorOrg:        audit.auditorOrg ?? '',
      findingSummary:    audit.findingSummary ?? '',
      correctiveActions: audit.correctiveActions ?? '',
      evidenceUrl:       audit.evidenceUrl ?? '',
      notes:             audit.notes ?? '',
      assignedTo:        audit.assignedTo ?? '',
    })
    setShowCreate(true)
  }

  // ─── Summary stats ──────────────────────────────────────────────────────────
  const total       = audits.length
  const completed   = audits.filter(a => a.status === 'completed').length
  const overdue     = audits.filter(a => a.status === 'overdue').length
  const nonConform  = audits.filter(a => a.result === 'non_conformant').length
  const inProgress  = audits.filter(a => a.status === 'in_progress').length

  // ─── Filtered list ──────────────────────────────────────────────────────────
  const filtered = audits.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      a.standard.toLowerCase().includes(q) ||
      (a.auditorName ?? '').toLowerCase().includes(q)
    )
  })

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NDIS Practice Standards Audit</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track audit activities against NDIS Quality & Safeguards Commission standards
          </p>
        </div>
        <button
          onClick={() => { setSelectedAudit(null); setForm(emptyForm()); setShowCreate(true) }}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          + New Audit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Audits',      value: total,      color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Completed',         value: completed,  color: 'text-green-600 dark:text-green-400' },
          { label: 'Non-Conformant',    value: nonConform, color: 'text-red-600 dark:text-red-400' },
          { label: 'Overdue / Active',  value: overdue + inProgress, color: 'text-yellow-600 dark:text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search audits…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white min-w-[200px]"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">All Types</option>
          {AUDIT_TYPES.map(t => <option key={t} value={t}>{AUDIT_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={filterResult} onChange={e => setFilterResult(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">All Results</option>
          <option value="conformant">Conformant</option>
          <option value="non_conformant">Non-Conformant</option>
          <option value="partial">Partial</option>
          <option value="not_applicable">N/A</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading audits…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No audits found</p>
            <p className="text-sm">Create your first audit to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {['Title / Standard', 'Type', 'Scheduled', 'Status', 'Result', 'Risk', 'Auditor', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filtered.map(audit => (
                  <tr
                    key={audit.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    onClick={() => openDetail(audit)}
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{audit.title}</p>
                      <p className="text-xs text-gray-400 truncate">{audit.standard}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {AUDIT_TYPE_LABELS[audit.auditType] ?? cap(audit.auditType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {fmtDate(audit.scheduledDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[audit.status]}`}>
                        {cap(audit.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {audit.result ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_COLORS[audit.result]}`}>
                          {cap(audit.result)}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {audit.riskRating ? (
                        <span className={`text-xs font-semibold uppercase ${RISK_COLORS[audit.riskRating]}`}>
                          {cap(audit.riskRating)}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {audit.auditorName ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(audit)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mr-3 font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(audit.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ───────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedAudit ? 'Edit Audit' : 'New NDIS Audit'}
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audit Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual NDIS Internal Audit — Person-centred Supports"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>

              {/* Audit Type + Outcome Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audit Type *</label>
                  <select value={form.auditType} onChange={e => setForm(p => ({ ...p, auditType: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    {AUDIT_TYPES.map(t => <option key={t} value={t}>{AUDIT_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome Group</label>
                  <select value={form.outcomeGroup} onChange={e => setForm(p => ({ ...p, outcomeGroup: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    <option value="">— Select —</option>
                    {OUTCOME_GROUPS.map(g => <option key={g} value={g}>{OUTCOME_GROUP_LABELS[g]}</option>)}
                  </select>
                </div>
              </div>

              {/* Standard */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NDIS Practice Standard *</label>
                <select value={form.standard} onChange={e => setForm(p => ({ ...p, standard: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  {NDIS_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled Date *</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Completed Date</label>
                  <input type="date" value={form.completedDate} onChange={e => setForm(p => ({ ...p, completedDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Review Date</label>
                  <input type="date" value={form.nextReviewDate} onChange={e => setForm(p => ({ ...p, nextReviewDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              {/* Status + Result + Risk */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Result</label>
                  <select value={form.result ?? ''} onChange={e => setForm(p => ({ ...p, result: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    <option value="">— Pending —</option>
                    <option value="conformant">Conformant</option>
                    <option value="non_conformant">Non-Conformant</option>
                    <option value="partial">Partial</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Rating</label>
                  <select value={form.riskRating} onChange={e => setForm(p => ({ ...p, riskRating: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    <option value="">— None —</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Auditor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auditor Name</label>
                  <input type="text" value={form.auditorName} onChange={e => setForm(p => ({ ...p, auditorName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auditor Organisation</label>
                  <input type="text" value={form.auditorOrg} onChange={e => setForm(p => ({ ...p, auditorOrg: e.target.value }))}
                    placeholder="Organisation name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              {/* Assigned to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                <input type="text" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
                  placeholder="Email or name of person responsible"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>

              {/* Finding Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Finding Summary</label>
                <textarea rows={3} value={form.findingSummary} onChange={e => setForm(p => ({ ...p, findingSummary: e.target.value }))}
                  placeholder="Key findings from the audit…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none" />
              </div>

              {/* Corrective Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corrective Actions Required</label>
                <textarea rows={3} value={form.correctiveActions} onChange={e => setForm(p => ({ ...p, correctiveActions: e.target.value }))}
                  placeholder="Actions required to address non-conformances…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none" />
              </div>

              {/* Evidence URL + Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence / Report URL</label>
                <input type="url" value={form.evidenceUrl} onChange={e => setForm(p => ({ ...p, evidenceUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.scheduledDate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : selectedAudit ? 'Save Changes' : 'Create Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail / View Modal ───────────────────────────────────────────── */}
      {viewAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewAudit.audit.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{viewAudit.audit.standard}</p>
              </div>
              <button onClick={() => setViewAudit(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Type',          AUDIT_TYPE_LABELS[viewAudit.audit.auditType] ?? cap(viewAudit.audit.auditType)],
                  ['Outcome Group', viewAudit.audit.outcomeGroup ? OUTCOME_GROUP_LABELS[viewAudit.audit.outcomeGroup] ?? cap(viewAudit.audit.outcomeGroup) : '—'],
                  ['Scheduled',     fmtDate(viewAudit.audit.scheduledDate)],
                  ['Completed',     fmtDate(viewAudit.audit.completedDate)],
                  ['Next Review',   fmtDate(viewAudit.audit.nextReviewDate)],
                  ['Assigned To',   viewAudit.audit.assignedTo ?? '—'],
                  ['Auditor',       viewAudit.audit.auditorName ?? '—'],
                  ['Auditor Org',   viewAudit.audit.auditorOrg ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{value}</p>
                  </div>
                ))}
              </div>

              {/* Status + Result + Risk badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[viewAudit.audit.status]}`}>
                  {cap(viewAudit.audit.status)}
                </span>
                {viewAudit.audit.result && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${RESULT_COLORS[viewAudit.audit.result]}`}>
                    {cap(viewAudit.audit.result)}
                  </span>
                )}
                {viewAudit.audit.riskRating && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    viewAudit.audit.riskRating === 'critical' ? 'border-red-300 text-red-600' :
                    viewAudit.audit.riskRating === 'high'     ? 'border-orange-300 text-orange-600' :
                    viewAudit.audit.riskRating === 'medium'   ? 'border-yellow-300 text-yellow-600' :
                                                                'border-green-300 text-green-600'
                  }`}>
                    {cap(viewAudit.audit.riskRating)} Risk
                  </span>
                )}
              </div>

              {/* Finding + Actions summary */}
              {viewAudit.audit.findingSummary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Finding Summary</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewAudit.audit.findingSummary}</p>
                </div>
              )}
              {viewAudit.audit.correctiveActions && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Corrective Actions Required</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewAudit.audit.correctiveActions}</p>
                </div>
              )}
              {viewAudit.audit.evidenceUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Evidence / Report</p>
                  <a href={viewAudit.audit.evidenceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                    View Report ↗
                  </a>
                </div>
              )}

              {/* Corrective Actions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Corrective Action Log ({viewAudit.actions.length})</p>
                  <button onClick={() => setShowActionForm(p => !p)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                    + Add Action
                  </button>
                </div>

                {/* Add action form */}
                {showActionForm && (
                  <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-900/20 space-y-3">
                    <textarea rows={2} value={actionForm.description}
                      onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the corrective action…"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none" />
                    <div className="grid grid-cols-3 gap-3">
                      <select value={actionForm.priority} onChange={e => setActionForm(p => ({ ...p, priority: e.target.value }))}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <input type="date" value={actionForm.dueDate} onChange={e => setActionForm(p => ({ ...p, dueDate: e.target.value }))}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      <input type="text" value={actionForm.assignedTo} onChange={e => setActionForm(p => ({ ...p, assignedTo: e.target.value }))}
                        placeholder="Assigned to"
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowActionForm(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                      <button onClick={handleAddAction} disabled={savingAction || !actionForm.description}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                        {savingAction ? 'Saving…' : 'Add Action'}
                      </button>
                    </div>
                  </div>
                )}

                {viewAudit.actions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No corrective actions logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {viewAudit.actions.map(action => (
                      <div key={action.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{action.description}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-xs font-semibold ${RISK_COLORS[action.priority] ?? 'text-gray-500'}`}>
                              {cap(action.priority)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                          {action.dueDate && <span>Due {fmtDate(action.dueDate)}</span>}
                          {action.assignedTo && <span>→ {action.assignedTo}</span>}
                          <span className="capitalize">{action.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button onClick={() => { setViewAudit(null); openEdit(viewAudit.audit) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Edit Audit
              </button>
              <button onClick={() => setViewAudit(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
