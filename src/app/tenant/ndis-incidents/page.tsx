'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Incident {
  id: string
  tenantId: string
  incidentType: string
  incidentCategory: string | null
  isReportable: boolean
  status: string
  severity: string
  participantId: string | null
  participantName: string | null
  workerName: string | null
  workerRole: string | null
  witnessNames: string | null
  title: string
  description: string
  location: string | null
  incidentDate: string
  discoveredDate: string | null
  reportedInternally: boolean
  internalReportDate: string | null
  commissionNotified: boolean
  commissionNotifyDate: string | null
  commissionRefNumber: string | null
  policeNotified: boolean
  policeReportNumber: string | null
  immediateActions: string | null
  rootCause: string | null
  outcomeDescription: string | null
  evidenceUrl: string | null
  assignedTo: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface IncidentAction {
  id: string
  incidentId: string
  description: string
  actionType: string
  priority: string
  status: string
  dueDate: string | null
  resolvedAt: string | null
  assignedTo: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { value: 'death',                            label: 'Death of a Participant' },
  { value: 'serious_injury',                   label: 'Serious Injury' },
  { value: 'abuse',                            label: 'Abuse' },
  { value: 'neglect',                          label: 'Neglect' },
  { value: 'unlawful_sexual',                  label: 'Unlawful Sexual Contact' },
  { value: 'unauthorised_restrictive_practice',label: 'Unauthorised Restrictive Practice' },
  { value: 'missing_participant',              label: 'Missing Participant' },
  { value: 'medication_error',                 label: 'Medication Error' },
  { value: 'physical_assault',                 label: 'Physical Assault' },
  { value: 'self_harm',                        label: 'Self-Harm / Suicide Attempt' },
  { value: 'property_damage',                  label: 'Property Damage' },
  { value: 'other',                            label: 'Other' },
]

const SEVERITIES = [
  { value: 'low',      label: 'Low',      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'medium',   label: 'Medium',   color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'high',     label: 'High',     color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
]

const STATUSES = [
  { value: 'open',                  label: 'Open',                   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'under_review',          label: 'Under Review',           color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'reported_to_commission',label: 'Reported to Commission', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'closed',                label: 'Closed',                 color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
]

const ACTION_TYPES = [
  { value: 'corrective',    label: 'Corrective' },
  { value: 'preventive',   label: 'Preventive' },
  { value: 'notification', label: 'Notification' },
  { value: 'investigation',label: 'Investigation' },
]

function severityColor(s: string) {
  return SEVERITIES.find(x => x.value === s)?.color ?? 'bg-gray-100 text-gray-800'
}
function statusColor(s: string) {
  return STATUSES.find(x => x.value === s)?.color ?? 'bg-gray-100 text-gray-800'
}
function incidentTypeLabel(t: string) {
  return INCIDENT_TYPES.find(x => x.value === t)?.label ?? t
}

function emptyForm() {
  return {
    title: '',
    incidentType: '',
    incidentCategory: '',
    description: '',
    severity: 'medium',
    participantName: '',
    workerName: '',
    workerRole: '',
    witnessNames: '',
    location: '',
    incidentDate: new Date().toISOString().slice(0, 16),
    discoveredDate: '',
    reportedInternally: false,
    internalReportDate: '',
    commissionNotified: false,
    commissionNotifyDate: '',
    commissionRefNumber: '',
    policeNotified: false,
    policeReportNumber: '',
    immediateActions: '',
    rootCause: '',
    outcomeDescription: '',
    evidenceUrl: '',
    assignedTo: '',
    notes: '',
    isReportable: true,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NDISIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterType,     setFilterType]     = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search,         setSearch]         = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal,   setShowViewModal]   = useState(false)
  const [editingId,       setEditingId]       = useState<string | null>(null)
  const [viewIncident,    setViewIncident]    = useState<Incident | null>(null)
  const [viewActions,     setViewActions]     = useState<IncidentAction[]>([])
  const [viewLoading,     setViewLoading]     = useState(false)

  // Form
  const [form,       setForm]       = useState(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])

  // Action form (inside view modal)
  const [showActionForm,  setShowActionForm]  = useState(false)
  const [actionForm,      setActionForm]      = useState({ description: '', actionType: 'corrective', priority: 'medium', dueDate: '', assignedTo: '', notes: '' })
  const [savingAction,    setSavingAction]    = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus)   params.set('status', filterStatus)
      if (filterType)     params.set('incidentType', filterType)
      if (filterSeverity) params.set('severity', filterSeverity)
      const res = await fetchWithAuth(`/api/tenant/ndis-incidents?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setIncidents(data.incidents ?? [])
    } catch {
      setError('Failed to load incidents.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, filterSeverity])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  // ── View modal ───────────────────────────────────────────────────────────

  async function openView(id: string) {
    setShowViewModal(true)
    setViewLoading(true)
    setShowActionForm(false)
    setActionForm({ description: '', actionType: 'corrective', priority: 'medium', dueDate: '', assignedTo: '', notes: '' })
    try {
      const res = await fetchWithAuth(`/api/tenant/ndis-incidents/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setViewIncident(data.incident)
      setViewActions(data.actions ?? [])
    } catch {
      setViewIncident(null)
    } finally {
      setViewLoading(false)
    }
  }

  // ── Create / Edit ────────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormErrors([])
    setShowCreateModal(true)
  }

  function openEdit(i: Incident) {
    setEditingId(i.id)
    setForm({
      title:               i.title,
      incidentType:        i.incidentType,
      incidentCategory:    i.incidentCategory ?? '',
      description:         i.description,
      severity:            i.severity,
      participantName:     i.participantName ?? '',
      workerName:          i.workerName ?? '',
      workerRole:          i.workerRole ?? '',
      witnessNames:        i.witnessNames ?? '',
      location:            i.location ?? '',
      incidentDate:        i.incidentDate ? new Date(i.incidentDate).toISOString().slice(0, 16) : '',
      discoveredDate:      i.discoveredDate ? new Date(i.discoveredDate).toISOString().slice(0, 16) : '',
      reportedInternally:  i.reportedInternally,
      internalReportDate:  i.internalReportDate ?? '',
      commissionNotified:  i.commissionNotified,
      commissionNotifyDate:i.commissionNotifyDate ?? '',
      commissionRefNumber: i.commissionRefNumber ?? '',
      policeNotified:      i.policeNotified,
      policeReportNumber:  i.policeReportNumber ?? '',
      immediateActions:    i.immediateActions ?? '',
      rootCause:           i.rootCause ?? '',
      outcomeDescription:  i.outcomeDescription ?? '',
      evidenceUrl:         i.evidenceUrl ?? '',
      assignedTo:          i.assignedTo ?? '',
      notes:               i.notes ?? '',
      isReportable:        i.isReportable,
    })
    setFormErrors([])
    setShowCreateModal(true)
  }

  async function handleSave() {
    const errs: string[] = []
    if (!form.title.trim())        errs.push('Title is required')
    if (!form.incidentType)        errs.push('Incident type is required')
    if (!form.description.trim())  errs.push('Description is required')
    if (!form.incidentDate)        errs.push('Incident date is required')
    if (errs.length) { setFormErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        incidentDate:  form.incidentDate || null,
        discoveredDate:form.discoveredDate || null,
        internalReportDate:   form.internalReportDate || null,
        commissionNotifyDate: form.commissionNotifyDate || null,
        commissionRefNumber:  form.commissionRefNumber || null,
        policeReportNumber:   form.policeReportNumber || null,
        incidentCategory:     form.incidentCategory || null,
        participantName:      form.participantName || null,
        workerName:           form.workerName || null,
        workerRole:           form.workerRole || null,
        witnessNames:         form.witnessNames || null,
        location:             form.location || null,
        immediateActions:     form.immediateActions || null,
        rootCause:            form.rootCause || null,
        outcomeDescription:   form.outcomeDescription || null,
        evidenceUrl:          form.evidenceUrl || null,
        assignedTo:           form.assignedTo || null,
        notes:                form.notes || null,
      }

      const url    = editingId ? `/api/tenant/ndis-incidents/${editingId}` : '/api/tenant/ndis-incidents'
      const method = editingId ? 'PATCH' : 'POST'
      const res    = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const d = await res.json()
        setFormErrors([d.error ?? 'Save failed'])
        return
      }
      setShowCreateModal(false)
      fetchIncidents()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this incident report? This cannot be undone.')) return
    await fetchWithAuth(`/api/tenant/ndis-incidents/${id}`, { method: 'DELETE' })
    fetchIncidents()
  }

  // ── Action form ──────────────────────────────────────────────────────────

  async function handleAddAction() {
    if (!viewIncident || !actionForm.description.trim()) return
    setSavingAction(true)
    try {
      const res = await fetchWithAuth(`/api/tenant/ndis-incidents/${viewIncident.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm),
      })
      if (res.ok) {
        setShowActionForm(false)
        setActionForm({ description: '', actionType: 'corrective', priority: 'medium', dueDate: '', assignedTo: '', notes: '' })
        // Refresh actions
        const r2 = await fetchWithAuth(`/api/tenant/ndis-incidents/${viewIncident.id}/actions`)
        if (r2.ok) { const d = await r2.json(); setViewActions(d.actions ?? []) }
      }
    } finally {
      setSavingAction(false)
    }
  }

  // ── Filter helpers ───────────────────────────────────────────────────────

  const filtered = incidents.filter(i => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      (i.participantName ?? '').toLowerCase().includes(q) ||
      (i.workerName ?? '').toLowerCase().includes(q) ||
      (i.location ?? '').toLowerCase().includes(q)
    )
  })

  const totalCount      = incidents.length
  const openCount       = incidents.filter(i => i.status === 'open').length
  const criticalCount   = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length
  const commissionCount = incidents.filter(i => i.commissionNotified).length

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NDIS Reportable Incidents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage incidents reportable to the NDIS Quality and Safeguards Commission
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Report Incident
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents',          value: totalCount,      color: 'text-gray-900 dark:text-white' },
          { label: 'Open',                     value: openCount,       color: 'text-blue-600 dark:text-blue-400' },
          { label: 'High / Critical',          value: criticalCount,   color: 'text-red-600 dark:text-red-400' },
          { label: 'Reported to Commission',   value: commissionCount, color: 'text-purple-600 dark:text-purple-400' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search title, participant, worker…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="">All Types</option>
          {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={fetchIncidents}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading incidents…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {incidents.length === 0 ? 'No incidents reported yet. Click "Report Incident" to log one.' : 'No incidents match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Incident</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Severity</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Incident Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(incident => (
                  <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{incident.title}</div>
                      {incident.participantName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Participant: {incident.participantName}</div>
                      )}
                      {incident.location && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{incident.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      {incidentTypeLabel(incident.incidentType)}
                      {incident.isReportable && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Reportable</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${severityColor(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor(incident.status)}`}>
                        {STATUSES.find(s => s.value === incident.status)?.label ?? incident.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      {new Date(incident.incidentDate).toLocaleDateString('en-AU')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {incident.commissionNotified ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">✓ Notified</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openView(incident.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs">View</button>
                        <button onClick={() => openEdit(incident)}
                          className="text-gray-600 dark:text-gray-400 hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(incident.id)}
                          className="text-red-600 dark:text-red-400 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Incident Report' : 'Report New Incident'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5">
              {formErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 space-y-1">
                  {formErrors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
              )}

              {/* Basic info */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 w-full">Incident Details</legend>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Brief descriptive title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Type *</label>
                    <select value={form.incidentType} onChange={e => setForm(f => ({ ...f, incidentType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select type…</option>
                      {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity *</label>
                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Date & Time *</label>
                    <input type="datetime-local" value={form.incidentDate} onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discovered Date & Time</label>
                    <input type="datetime-local" value={form.discoveredDate} onChange={e => setForm(f => ({ ...f, discoveredDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Where did the incident occur?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={4} placeholder="Detailed description of what happened…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </fieldset>

              {/* People */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 w-full">People Involved</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participant Name</label>
                    <input value={form.participantName} onChange={e => setForm(f => ({ ...f, participantName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Worker Name</label>
                    <input value={form.workerName} onChange={e => setForm(f => ({ ...f, workerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Worker Role</label>
                    <input value={form.workerRole} onChange={e => setForm(f => ({ ...f, workerRole: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Witness Names</label>
                    <input value={form.witnessNames} onChange={e => setForm(f => ({ ...f, witnessNames: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
              </fieldset>

              {/* Reporting */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 w-full">Reporting & Notifications</legend>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.isReportable} onChange={e => setForm(f => ({ ...f, isReportable: e.target.checked }))}
                      className="rounded" />
                    Reportable to NDIS Commission
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.reportedInternally} onChange={e => setForm(f => ({ ...f, reportedInternally: e.target.checked }))}
                      className="rounded" />
                    Reported Internally
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.commissionNotified} onChange={e => setForm(f => ({ ...f, commissionNotified: e.target.checked }))}
                      className="rounded" />
                    Commission Notified
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.policeNotified} onChange={e => setForm(f => ({ ...f, policeNotified: e.target.checked }))}
                      className="rounded" />
                    Police Notified
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {form.reportedInternally && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Report Date</label>
                      <input type="date" value={form.internalReportDate} onChange={e => setForm(f => ({ ...f, internalReportDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  )}
                  {form.commissionNotified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Notify Date</label>
                        <input type="date" value={form.commissionNotifyDate} onChange={e => setForm(f => ({ ...f, commissionNotifyDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Reference #</label>
                        <input value={form.commissionRefNumber} onChange={e => setForm(f => ({ ...f, commissionRefNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </>
                  )}
                  {form.policeNotified && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Police Report Number</label>
                      <input value={form.policeReportNumber} onChange={e => setForm(f => ({ ...f, policeReportNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Response */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 w-full">Response & Outcome</legend>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Immediate Actions Taken</label>
                  <textarea value={form.immediateActions} onChange={e => setForm(f => ({ ...f, immediateActions: e.target.value }))}
                    rows={3} placeholder="What was done immediately after the incident?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Root Cause</label>
                  <textarea value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
                    rows={2} placeholder="Identified root cause of the incident…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
                  <textarea value={form.outcomeDescription} onChange={e => setForm(f => ({ ...f, outcomeDescription: e.target.value }))}
                    rows={2} placeholder="Final outcome or resolution…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </fieldset>

              {/* Admin */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 w-full">Administration</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                    <input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                      placeholder="Name or email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence / Document URL</label>
                    <input value={form.evidenceUrl} onChange={e => setForm(f => ({ ...f, evidenceUrl: e.target.value }))}
                      placeholder="https://…"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </fieldset>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Update Incident' : 'Report Incident'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              {viewLoading ? (
                <div className="text-center text-gray-500">Loading…</div>
              ) : !viewIncident ? (
                <div className="text-center text-red-500">Failed to load incident.</div>
              ) : (
                <>
                  {/* Title + badges */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{viewIncident.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColor(viewIncident.severity)}`}>
                        {viewIncident.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(viewIncident.status)}`}>
                        {STATUSES.find(s => s.value === viewIncident.status)?.label ?? viewIncident.status}
                      </span>
                      {viewIncident.isReportable && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Reportable</span>
                      )}
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: 'Type',          value: incidentTypeLabel(viewIncident.incidentType) },
                      { label: 'Date',          value: new Date(viewIncident.incidentDate).toLocaleString('en-AU') },
                      { label: 'Location',      value: viewIncident.location },
                      { label: 'Participant',   value: viewIncident.participantName },
                      { label: 'Worker',        value: viewIncident.workerName ? `${viewIncident.workerName}${viewIncident.workerRole ? ` (${viewIncident.workerRole})` : ''}` : null },
                      { label: 'Witnesses',     value: viewIncident.witnessNames },
                      { label: 'Assigned To',   value: viewIncident.assignedTo },
                      { label: 'Commission Ref',value: viewIncident.commissionRefNumber },
                      { label: 'Police Report', value: viewIncident.policeReportNumber },
                    ].filter(r => r.value).map(row => (
                      <div key={row.label}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{row.label}</p>
                        <p className="text-gray-900 dark:text-white">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Notifications row */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${viewIncident.reportedInternally ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {viewIncident.reportedInternally ? '✓' : '○'} Internal Report
                    </span>
                    <span className={`flex items-center gap-1 ${viewIncident.commissionNotified ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {viewIncident.commissionNotified ? '✓' : '○'} Commission
                    </span>
                    <span className={`flex items-center gap-1 ${viewIncident.policeNotified ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {viewIncident.policeNotified ? '✓' : '○'} Police
                    </span>
                  </div>

                  {/* Narrative fields */}
                  {[
                    { label: 'Description',       text: viewIncident.description },
                    { label: 'Immediate Actions', text: viewIncident.immediateActions },
                    { label: 'Root Cause',        text: viewIncident.rootCause },
                    { label: 'Outcome',           text: viewIncident.outcomeDescription },
                    { label: 'Notes',             text: viewIncident.notes },
                  ].filter(f => f.text).map(f => (
                    <div key={f.label}>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.label}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{f.text}</p>
                    </div>
                  ))}

                  {/* Actions log */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">Action Log ({viewActions.length})</h4>
                      <button onClick={() => setShowActionForm(v => !v)}
                        className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                        + Add Action
                      </button>
                    </div>

                    {showActionForm && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                          <textarea value={actionForm.description} onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
                            rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
                            <select value={actionForm.actionType} onChange={e => setActionForm(f => ({ ...f, actionType: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white">
                              {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select value={actionForm.priority} onChange={e => setActionForm(f => ({ ...f, priority: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input type="date" value={actionForm.dueDate} onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                            <input value={actionForm.assignedTo} onChange={e => setActionForm(f => ({ ...f, assignedTo: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowActionForm(false)} className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded">Cancel</button>
                          <button onClick={handleAddAction} disabled={savingAction}
                            className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                            {savingAction ? 'Saving…' : 'Add'}
                          </button>
                        </div>
                      </div>
                    )}

                    {viewActions.length === 0 ? (
                      <p className="text-sm text-gray-400">No actions logged yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {viewActions.map(a => (
                          <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-800 dark:text-gray-200">{a.description}</p>
                              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                a.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                a.priority === 'high'     ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                a.priority === 'medium'   ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              }`}>{a.priority}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{ACTION_TYPES.find(t => t.value === a.actionType)?.label ?? a.actionType}</span>
                              {a.dueDate && <span>Due: {new Date(a.dueDate).toLocaleDateString('en-AU')}</span>}
                              {a.assignedTo && <span>→ {a.assignedTo}</span>}
                              <span>{new Date(a.createdAt).toLocaleDateString('en-AU')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
