'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  firstName: string
  lastName: string
  preferredName: string | null
  ndisNumber: string | null
  isActive: boolean
}

interface Incident {
  id: string
  incidentDate: string
  incidentTime: string | null
  location: string | null
  incidentType: string
  severity: string
  description: string
  immediateAction: string | null
  witnesses: string | null
  reportedBy: string | null
  reportedTo: string | null
  ndisReportable: boolean
  policeReport: boolean
  policeReportNumber: string | null
  status: string
  outcome: string | null
  followUpRequired: boolean
  followUpDate: string | null
  followUpNotes: string | null
  createdBy: string | null
  createdAt: string
}

interface BehaviourPlan {
  id: string
  planName: string
  behaviourType: string | null
  triggers: string | null
  earlyWarnings: string | null
  preventionStrategies: string | null
  deEscalationStrategies: string | null
  responseStrategies: string | null
  postIncidentSupport: string | null
  authorisedBy: string | null
  reviewDate: string | null
  status: string
  notes: string | null
  createdBy: string | null
  createdAt: string
}

interface RestrictivePractice {
  id: string
  practiceType: string
  description: string
  authorisedBy: string | null
  authorisedDate: string | null
  expiryDate: string | null
  regulatoryApproval: boolean
  approvalReference: string | null
  monitoringFrequency: string | null
  lastReviewDate: string | null
  nextReviewDate: string | null
  status: string
  notes: string | null
  createdBy: string | null
  createdAt: string
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function severityBadge(s: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    major:    'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    minor:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    open:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    investigating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    closed:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    active:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    review:      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    inactive:    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    expired:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncidentBehaviourPage() {
  const [participants, setParticipants]       = useState<Participant[]>([])
  const [search, setSearch]                   = useState('')
  const [selectedId, setSelectedId]           = useState<string | null>(null)
  const [activeTab, setActiveTab]             = useState<'incidents' | 'behaviour' | 'restrictive'>('incidents')

  const [incidents, setIncidents]             = useState<Incident[]>([])
  const [behaviourPlans, setBehaviourPlans]   = useState<BehaviourPlan[]>([])
  const [restrictivePractices, setRestrictive] = useState<RestrictivePractice[]>([])
  const [loading, setLoading]                 = useState(false)

  // Modals
  const [showIncidentModal, setShowIncidentModal]       = useState(false)
  const [showBehaviourModal, setShowBehaviourModal]     = useState(false)
  const [showRestrictiveModal, setShowRestrictiveModal] = useState(false)

  // Form states
  const [incidentForm, setIncidentForm] = useState({
    incidentDate: '', incidentTime: '', location: '', incidentType: 'general',
    severity: 'minor', description: '', immediateAction: '', witnesses: '',
    reportedBy: '', reportedTo: '', ndisReportable: false, policeReport: false,
    policeReportNumber: '', status: 'open', outcome: '',
    followUpRequired: false, followUpDate: '', followUpNotes: '',
  })

  const [behaviourForm, setBehaviourForm] = useState({
    planName: '', behaviourType: '', triggers: '', earlyWarnings: '',
    preventionStrategies: '', deEscalationStrategies: '', responseStrategies: '',
    postIncidentSupport: '', authorisedBy: '', reviewDate: '', status: 'active', notes: '',
  })

  const [restrictiveForm, setRestrictiveForm] = useState({
    practiceType: '', description: '', authorisedBy: '', authorisedDate: '',
    expiryDate: '', regulatoryApproval: false, approvalReference: '',
    monitoringFrequency: '', lastReviewDate: '', nextReviewDate: '',
    status: 'active', notes: '',
  })

  const [saving, setSaving] = useState(false)

  // ─── Fetch participants ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetchWithAuth(`/api/tenant/incident-behaviour/participants?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const d = await res.json()
        setParticipants(d.participants ?? [])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // ─── Fetch detail data ────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (pid: string) => {
    setLoading(true)
    try {
      const [iRes, bRes, rRes] = await Promise.all([
        fetchWithAuth(`/api/tenant/incident-behaviour/participants/${pid}/incidents`),
        fetchWithAuth(`/api/tenant/incident-behaviour/participants/${pid}/behaviour-plans`),
        fetchWithAuth(`/api/tenant/incident-behaviour/participants/${pid}/restrictive-practices`),
      ])
      if (iRes.ok) { const d = await iRes.json(); setIncidents(d.incidents ?? []) }
      if (bRes.ok) { const d = await bRes.json(); setBehaviourPlans(d.plans ?? []) }
      if (rRes.ok) { const d = await rRes.json(); setRestrictive(d.practices ?? []) }
    } finally { setLoading(false) }
  }, [])

  const handleSelect = (pid: string) => {
    setSelectedId(pid)
    setActiveTab('incidents')
    fetchDetail(pid)
  }

  const selectedParticipant = participants.find(p => p.id === selectedId)

  // ─── Submit handlers ──────────────────────────────────────────────────────
  const submitIncident = async () => {
    if (!selectedId || !incidentForm.incidentDate || !incidentForm.description) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/tenant/incident-behaviour/participants/${selectedId}/incidents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm),
      })
      if (res.ok) {
        setShowIncidentModal(false)
        setIncidentForm({
          incidentDate: '', incidentTime: '', location: '', incidentType: 'general',
          severity: 'minor', description: '', immediateAction: '', witnesses: '',
          reportedBy: '', reportedTo: '', ndisReportable: false, policeReport: false,
          policeReportNumber: '', status: 'open', outcome: '',
          followUpRequired: false, followUpDate: '', followUpNotes: '',
        })
        fetchDetail(selectedId)
      }
    } finally { setSaving(false) }
  }

  const submitBehaviourPlan = async () => {
    if (!selectedId || !behaviourForm.planName) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/tenant/incident-behaviour/participants/${selectedId}/behaviour-plans`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(behaviourForm),
      })
      if (res.ok) {
        setShowBehaviourModal(false)
        setBehaviourForm({
          planName: '', behaviourType: '', triggers: '', earlyWarnings: '',
          preventionStrategies: '', deEscalationStrategies: '', responseStrategies: '',
          postIncidentSupport: '', authorisedBy: '', reviewDate: '', status: 'active', notes: '',
        })
        fetchDetail(selectedId)
      }
    } finally { setSaving(false) }
  }

  const submitRestrictive = async () => {
    if (!selectedId || !restrictiveForm.practiceType || !restrictiveForm.description) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/tenant/incident-behaviour/participants/${selectedId}/restrictive-practices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restrictiveForm),
      })
      if (res.ok) {
        setShowRestrictiveModal(false)
        setRestrictiveForm({
          practiceType: '', description: '', authorisedBy: '', authorisedDate: '',
          expiryDate: '', regulatoryApproval: false, approvalReference: '',
          monitoringFrequency: '', lastReviewDate: '', nextReviewDate: '',
          status: 'active', notes: '',
        })
        fetchDetail(selectedId)
      }
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">

      {/* ── Left Panel: Participant List ──────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            🚨 Incidents &amp; Behaviour
          </h2>
          <input
            type="text"
            placeholder="Search participants…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {participants.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No participants found.</p>
          ) : participants.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedId === p.id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500' : ''}`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {p.preferredName || p.firstName} {p.lastName}
              </p>
              {p.ndisNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">NDIS: {p.ndisNumber}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Detail ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-4">🚨</div>
              <p className="text-lg font-medium">Select a participant</p>
              <p className="text-sm mt-1">View and manage incidents, behaviour plans, and restrictive practices</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedParticipant
                      ? `${selectedParticipant.preferredName || selectedParticipant.firstName} ${selectedParticipant.lastName}`
                      : 'Participant'}
                  </h3>
                  {selectedParticipant?.ndisNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">NDIS: {selectedParticipant.ndisNumber}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeTab === 'incidents' && (
                    <button onClick={() => setShowIncidentModal(true)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                      + Log Incident
                    </button>
                  )}
                  {activeTab === 'behaviour' && (
                    <button onClick={() => setShowBehaviourModal(true)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                      + Add Plan
                    </button>
                  )}
                  {activeTab === 'restrictive' && (
                    <button onClick={() => setShowRestrictiveModal(true)}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                      + Add Practice
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {([
                  { key: 'incidents',   label: '🚨 Incidents',           count: incidents.length },
                  { key: 'behaviour',   label: '🧠 Behaviour Plans',      count: behaviourPlans.length },
                  { key: 'restrictive', label: '🔒 Restrictive Practices', count: restrictivePractices.length },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (

                /* ── Incidents Tab ─────────────────────────────────────────── */
                activeTab === 'incidents' ? (
                  incidents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-3">🚨</div>
                      <p>No incidents recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incidents.map(inc => (
                        <div key={inc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {severityBadge(inc.severity)}
                              {statusBadge(inc.status)}
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{inc.incidentType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{inc.incidentDate}</p>
                              {inc.incidentTime && <p className="text-xs text-gray-500 dark:text-gray-400">{inc.incidentTime}</p>}
                            </div>
                          </div>
                          {inc.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">📍 {inc.location}</p>
                          )}
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{inc.description}</p>
                          {inc.immediateAction && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Immediate Action</p>
                              <p className="text-sm text-blue-900 dark:text-blue-200">{inc.immediateAction}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {inc.reportedBy && <span>Reported by: {inc.reportedBy}</span>}
                            {inc.reportedTo && <span>Reported to: {inc.reportedTo}</span>}
                            {inc.ndisReportable && <span className="text-red-600 dark:text-red-400 font-medium">⚠️ NDIS Reportable</span>}
                            {inc.policeReport && <span className="text-orange-600 dark:text-orange-400 font-medium">🚔 Police Report {inc.policeReportNumber ? `(${inc.policeReportNumber})` : ''}</span>}
                            {inc.followUpRequired && <span className="text-purple-600 dark:text-purple-400 font-medium">📋 Follow-up required{inc.followUpDate ? `: ${inc.followUpDate}` : ''}</span>}
                          </div>
                          {inc.outcome && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mt-3">
                              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Outcome</p>
                              <p className="text-sm text-green-900 dark:text-green-200">{inc.outcome}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )

                /* ── Behaviour Plans Tab ───────────────────────────────────── */
                ) : activeTab === 'behaviour' ? (
                  behaviourPlans.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-3">🧠</div>
                      <p>No behaviour support plans</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {behaviourPlans.map(plan => (
                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{plan.planName}</h4>
                            {statusBadge(plan.status)}
                          </div>
                          {plan.behaviourType && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Behaviour: {plan.behaviourType}</p>
                          )}
                          {[
                            { label: '⚡ Triggers',               value: plan.triggers },
                            { label: '🔔 Early Warnings',         value: plan.earlyWarnings },
                            { label: '🛡️ Prevention Strategies',   value: plan.preventionStrategies },
                            { label: '😌 De-escalation',          value: plan.deEscalationStrategies },
                            { label: '🔧 Response Strategies',    value: plan.responseStrategies },
                            { label: '💚 Post-Incident Support',  value: plan.postIncidentSupport },
                          ].filter(x => x.value).map(x => (
                            <div key={x.label} className="mb-3 last:mb-0">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{x.label}</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{x.value}</p>
                            </div>
                          ))}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            {plan.authorisedBy && <span>Authorised by: {plan.authorisedBy}</span>}
                            {plan.reviewDate && <span>Review: {plan.reviewDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )

                /* ── Restrictive Practices Tab ─────────────────────────────── */
                ) : (
                  restrictivePractices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-3">🔒</div>
                      <p>No restrictive practices recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {restrictivePractices.map(rp => (
                        <div key={rp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{rp.practiceType}</h4>
                              {rp.regulatoryApproval && rp.approvalReference && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Approval ref: {rp.approvalReference}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {rp.regulatoryApproval && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">✓ Approved</span>
                              )}
                              {statusBadge(rp.status)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{rp.description}</p>
                          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {rp.authorisedBy    && <span>Authorised by: {rp.authorisedBy}</span>}
                            {rp.authorisedDate  && <span>Authorised: {rp.authorisedDate}</span>}
                            {rp.expiryDate      && <span className={`${new Date(rp.expiryDate) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>Expires: {rp.expiryDate}</span>}
                            {rp.monitoringFrequency && <span>Monitoring: {rp.monitoringFrequency}</span>}
                            {rp.lastReviewDate  && <span>Last review: {rp.lastReviewDate}</span>}
                            {rp.nextReviewDate  && <span>Next review: {rp.nextReviewDate}</span>}
                          </div>
                          {rp.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">{rp.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Log Incident
      ══════════════════════════════════════════════════════════════════════ */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log Incident</h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" className={inputCls} value={incidentForm.incidentDate} onChange={e => setIncidentForm(f => ({ ...f, incidentDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <input type="time" className={inputCls} value={incidentForm.incidentTime} onChange={e => setIncidentForm(f => ({ ...f, incidentTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input type="text" placeholder="Where did the incident occur?" className={inputCls} value={incidentForm.location} onChange={e => setIncidentForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Incident Type</label>
                  <select className={inputCls} value={incidentForm.incidentType} onChange={e => setIncidentForm(f => ({ ...f, incidentType: e.target.value }))}>
                    <option value="general">General</option>
                    <option value="physical">Physical</option>
                    <option value="verbal">Verbal / Emotional</option>
                    <option value="self_harm">Self-Harm</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="missing_person">Missing Person</option>
                    <option value="medication_error">Medication Error</option>
                    <option value="near_miss">Near Miss</option>
                    <option value="financial">Financial</option>
                    <option value="sexual">Sexual</option>
                    <option value="neglect">Neglect</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Severity</label>
                  <select className={inputCls} value={incidentForm.severity} onChange={e => setIncidentForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description *</label>
                <textarea rows={4} placeholder="Describe what happened…" className={inputCls} value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Immediate Action Taken</label>
                <textarea rows={2} placeholder="What action was taken immediately?" className={inputCls} value={incidentForm.immediateAction} onChange={e => setIncidentForm(f => ({ ...f, immediateAction: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Reported By</label>
                  <input type="text" className={inputCls} value={incidentForm.reportedBy} onChange={e => setIncidentForm(f => ({ ...f, reportedBy: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Reported To</label>
                  <input type="text" className={inputCls} value={incidentForm.reportedTo} onChange={e => setIncidentForm(f => ({ ...f, reportedTo: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Witnesses</label>
                <input type="text" placeholder="Names of witnesses" className={inputCls} value={incidentForm.witnesses} onChange={e => setIncidentForm(f => ({ ...f, witnesses: e.target.value }))} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={incidentForm.ndisReportable} onChange={e => setIncidentForm(f => ({ ...f, ndisReportable: e.target.checked }))} className="rounded" />
                  NDIS Reportable Incident
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={incidentForm.policeReport} onChange={e => setIncidentForm(f => ({ ...f, policeReport: e.target.checked }))} className="rounded" />
                  Police Report Made
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={incidentForm.followUpRequired} onChange={e => setIncidentForm(f => ({ ...f, followUpRequired: e.target.checked }))} className="rounded" />
                  Follow-Up Required
                </label>
              </div>
              {incidentForm.policeReport && (
                <div>
                  <label className={labelCls}>Police Report Number</label>
                  <input type="text" className={inputCls} value={incidentForm.policeReportNumber} onChange={e => setIncidentForm(f => ({ ...f, policeReportNumber: e.target.value }))} />
                </div>
              )}
              {incidentForm.followUpRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Follow-Up Date</label>
                    <input type="date" className={inputCls} value={incidentForm.followUpDate} onChange={e => setIncidentForm(f => ({ ...f, followUpDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Follow-Up Notes</label>
                    <input type="text" className={inputCls} value={incidentForm.followUpNotes} onChange={e => setIncidentForm(f => ({ ...f, followUpNotes: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={incidentForm.status} onChange={e => setIncidentForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Outcome</label>
                <textarea rows={2} placeholder="Outcome or resolution notes" className={inputCls} value={incidentForm.outcome} onChange={e => setIncidentForm(f => ({ ...f, outcome: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowIncidentModal(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={submitIncident} disabled={saving || !incidentForm.incidentDate || !incidentForm.description}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Log Incident'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Add Behaviour Plan
      ══════════════════════════════════════════════════════════════════════ */}
      {showBehaviourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Behaviour Support Plan</h3>
              <button onClick={() => setShowBehaviourModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Plan Name *</label>
                  <input type="text" placeholder="e.g. Aggression Management Plan" className={inputCls} value={behaviourForm.planName} onChange={e => setBehaviourForm(f => ({ ...f, planName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Behaviour Type</label>
                  <input type="text" placeholder="e.g. Physical aggression" className={inputCls} value={behaviourForm.behaviourType} onChange={e => setBehaviourForm(f => ({ ...f, behaviourType: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Triggers</label>
                <textarea rows={2} placeholder="What triggers this behaviour?" className={inputCls} value={behaviourForm.triggers} onChange={e => setBehaviourForm(f => ({ ...f, triggers: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Early Warning Signs</label>
                <textarea rows={2} placeholder="Signs that indicate escalation is beginning…" className={inputCls} value={behaviourForm.earlyWarnings} onChange={e => setBehaviourForm(f => ({ ...f, earlyWarnings: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Prevention Strategies</label>
                <textarea rows={2} placeholder="Strategies to prevent the behaviour…" className={inputCls} value={behaviourForm.preventionStrategies} onChange={e => setBehaviourForm(f => ({ ...f, preventionStrategies: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>De-escalation Strategies</label>
                <textarea rows={2} placeholder="How to de-escalate once triggered…" className={inputCls} value={behaviourForm.deEscalationStrategies} onChange={e => setBehaviourForm(f => ({ ...f, deEscalationStrategies: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Response Strategies</label>
                <textarea rows={2} placeholder="Active response during the behaviour…" className={inputCls} value={behaviourForm.responseStrategies} onChange={e => setBehaviourForm(f => ({ ...f, responseStrategies: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Post-Incident Support</label>
                <textarea rows={2} placeholder="Support after an incident occurs…" className={inputCls} value={behaviourForm.postIncidentSupport} onChange={e => setBehaviourForm(f => ({ ...f, postIncidentSupport: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Authorised By</label>
                  <input type="text" className={inputCls} value={behaviourForm.authorisedBy} onChange={e => setBehaviourForm(f => ({ ...f, authorisedBy: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Review Date</label>
                  <input type="date" className={inputCls} value={behaviourForm.reviewDate} onChange={e => setBehaviourForm(f => ({ ...f, reviewDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={behaviourForm.status} onChange={e => setBehaviourForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="review">Under Review</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} className={inputCls} value={behaviourForm.notes} onChange={e => setBehaviourForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowBehaviourModal(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={submitBehaviourPlan} disabled={saving || !behaviourForm.planName}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Add Restrictive Practice
      ══════════════════════════════════════════════════════════════════════ */}
      {showRestrictiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Restrictive Practice</h3>
              <button onClick={() => setShowRestrictiveModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Practice Type *</label>
                  <select className={inputCls} value={restrictiveForm.practiceType} onChange={e => setRestrictiveForm(f => ({ ...f, practiceType: e.target.value }))}>
                    <option value="">Select type…</option>
                    <option value="Chemical Restraint">Chemical Restraint</option>
                    <option value="Mechanical Restraint">Mechanical Restraint</option>
                    <option value="Physical Restraint">Physical Restraint</option>
                    <option value="Environmental Restraint">Environmental Restraint</option>
                    <option value="Seclusion">Seclusion</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={restrictiveForm.status} onChange={e => setRestrictiveForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="review">Under Review</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description *</label>
                <textarea rows={3} placeholder="Describe the restrictive practice in detail…" className={inputCls} value={restrictiveForm.description} onChange={e => setRestrictiveForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Authorised By</label>
                  <input type="text" className={inputCls} value={restrictiveForm.authorisedBy} onChange={e => setRestrictiveForm(f => ({ ...f, authorisedBy: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Authorised Date</label>
                  <input type="date" className={inputCls} value={restrictiveForm.authorisedDate} onChange={e => setRestrictiveForm(f => ({ ...f, authorisedDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Expiry Date</label>
                  <input type="date" className={inputCls} value={restrictiveForm.expiryDate} onChange={e => setRestrictiveForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Monitoring Frequency</label>
                  <input type="text" placeholder="e.g. Weekly, Monthly" className={inputCls} value={restrictiveForm.monitoringFrequency} onChange={e => setRestrictiveForm(f => ({ ...f, monitoringFrequency: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
                  <input type="checkbox" checked={restrictiveForm.regulatoryApproval} onChange={e => setRestrictiveForm(f => ({ ...f, regulatoryApproval: e.target.checked }))} className="rounded" />
                  Regulatory Approval Obtained
                </label>
                {restrictiveForm.regulatoryApproval && (
                  <input type="text" placeholder="Approval reference number" className={inputCls} value={restrictiveForm.approvalReference} onChange={e => setRestrictiveForm(f => ({ ...f, approvalReference: e.target.value }))} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Last Review Date</label>
                  <input type="date" className={inputCls} value={restrictiveForm.lastReviewDate} onChange={e => setRestrictiveForm(f => ({ ...f, lastReviewDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Next Review Date</label>
                  <input type="date" className={inputCls} value={restrictiveForm.nextReviewDate} onChange={e => setRestrictiveForm(f => ({ ...f, nextReviewDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} className={inputCls} value={restrictiveForm.notes} onChange={e => setRestrictiveForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowRestrictiveModal(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={submitRestrictive} disabled={saving || !restrictiveForm.practiceType || !restrictiveForm.description}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Practice'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
