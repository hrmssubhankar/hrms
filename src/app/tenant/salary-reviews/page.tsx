'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface SalaryReview {
  id: string
  employeeId: string
  employeeName?: string
  employeeEmail?: string
  reviewType: string
  reviewDate: string
  effectiveDate?: string
  currentSalary: string
  currentBasis: string
  proposedSalary?: string
  proposedBasis?: string
  incrementAmount?: string
  incrementPercent?: string
  justification?: string
  performanceRating?: string
  marketData?: string
  status: string
  submittedBy?: string
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  hrNotes?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  implemented: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', implemented: 'Implemented',
}

const REVIEW_TYPE_LABEL: Record<string, string> = {
  annual: 'Annual', probation: 'Probation', merit: 'Merit',
  market: 'Market', promotion: 'Promotion', out_of_cycle: 'Out of Cycle',
}

const NEXT_STATUSES: Record<string, { status: string; label: string; color: string }[]> = {
  draft: [{ status: 'submitted', label: 'Submit for Review', color: 'bg-blue-600 hover:bg-blue-700' }],
  submitted: [{ status: 'under_review', label: 'Begin Review', color: 'bg-yellow-600 hover:bg-yellow-700' }],
  under_review: [
    { status: 'approved', label: 'Approve', color: 'bg-green-600 hover:bg-green-700' },
    { status: 'rejected', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' },
  ],
  approved: [{ status: 'implemented', label: 'Mark Implemented', color: 'bg-purple-600 hover:bg-purple-700' }],
}

const EMPTY_FORM = {
  employeeId: '', reviewType: 'annual', reviewDate: '',
  effectiveDate: '', currentSalary: '', currentBasis: 'annual',
  proposedSalary: '', proposedBasis: 'annual', justification: '',
  performanceRating: '', marketData: '', status: 'draft',
}

export default function SalaryReviewsPage() {
  const [reviews, setReviews] = useState<SalaryReview[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<SalaryReview | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [hrNotes, setHrNotes] = useState('')

  useEffect(() => {
    loadReviews()
    fetchWithAuth('/api/tenant/employees?limit=200')
      .then(r => r.json())
      .then(d => setEmployees(d.employees ?? []))
  }, [])

  function loadReviews() {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    fetchWithAuth(`/api/tenant/salary-reviews?${params}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {})
  }

  useEffect(() => { loadReviews() }, [search, statusFilter])

  async function saveReview() {
    setSaving(true)
    try {
      const r = await fetchWithAuth('/api/tenant/salary-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (d.review) {
        setShowModal(false)
        setForm(EMPTY_FORM)
        loadReviews()
        setSelected(d.review)
      }
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(reviewId: string, status: string) {
    const body: Record<string, string> = { status }
    if (status === 'rejected') body.rejectionReason = rejectionReason
    const r = await fetchWithAuth(`/api/tenant/salary-reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    if (d.review) {
      setSelected(d.review)
      loadReviews()
    }
  }

  async function saveHrNotes(reviewId: string) {
    const r = await fetchWithAuth(`/api/tenant/salary-reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hrNotes }),
    })
    const d = await r.json()
    if (d.review) setSelected(d.review)
  }

  function openReview(review: SalaryReview) {
    setSelected(review)
    setHrNotes(review.hrNotes ?? '')
    setRejectionReason(review.rejectionReason ?? '')
  }

  const fmtSalary = (val?: string, basis?: string) => {
    if (!val) return '—'
    const n = parseFloat(val)
    return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2 })} / ${basis ?? 'yr'}`
  }

  const pending = reviews.filter(r => ['submitted', 'under_review'].includes(r.status)).length
  const approved = reviews.filter(r => r.status === 'approved').length

  return (
    <div className="flex h-full gap-4 p-6">
      {/* Left panel */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Reviews</h2>
          <button
            onClick={() => { setShowModal(true); setForm(EMPTY_FORM) }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            + New
          </button>
        </div>

        {/* KPI mini cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pending}</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
        </div>

        <input
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          placeholder="Search employee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {reviews.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No reviews found</p>
          )}
          {reviews.map(review => (
            <button
              key={review.id}
              onClick={() => openReview(review)}
              className={`w-full text-left px-3 py-3 rounded-xl transition border ${
                selected?.id === review.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {review.employeeName ?? review.employeeId}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{REVIEW_TYPE_LABEL[review.reviewType] ?? review.reviewType} · {review.reviewDate}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[review.status] ?? ''}`}>
                  {STATUS_LABEL[review.status] ?? review.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {fmtSalary(review.currentSalary, review.currentBasis)}
                {review.proposedSalary && ` → ${fmtSalary(review.proposedSalary, review.proposedBasis)}`}
                {review.incrementPercent && ` (+${parseFloat(review.incrementPercent).toFixed(1)}%)`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-sm">Select a review to see details</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selected.employeeName ?? selected.employeeId}
                  </h3>
                  <p className="text-sm text-gray-500">{selected.employeeEmail}</p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status] ?? ''}`}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Review Type</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{REVIEW_TYPE_LABEL[selected.reviewType] ?? selected.reviewType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Review Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selected.reviewDate}</p>
                </div>
                {selected.effectiveDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Effective Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selected.effectiveDate}</p>
                  </div>
                )}
                {selected.performanceRating && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Performance Rating</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{selected.performanceRating.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>

              {/* Salary comparison */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Salary</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtSalary(selected.currentSalary, selected.currentBasis)}</p>
                </div>
                {selected.proposedSalary && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Proposed Salary</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmtSalary(selected.proposedSalary, selected.proposedBasis)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Increment</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {selected.incrementAmount ? `$${parseFloat(selected.incrementAmount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}` : '—'}
                        {selected.incrementPercent && ` (${parseFloat(selected.incrementPercent).toFixed(1)}%)`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Justification */}
              {selected.justification && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Justification</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.justification}</p>
                </div>
              )}

              {/* Workflow trail */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workflow Trail</p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  {selected.submittedBy && <div>Submitted by {selected.submittedBy} on {new Date(selected.submittedAt!).toLocaleDateString()}</div>}
                  {selected.reviewedBy && <div>Reviewed by {selected.reviewedBy} on {new Date(selected.reviewedAt!).toLocaleDateString()}</div>}
                  {selected.approvedBy && <div>Approved by {selected.approvedBy} on {new Date(selected.approvedAt!).toLocaleDateString()}</div>}
                </div>
              </div>

              {/* Rejection reason */}
              {selected.status === 'rejected' && selected.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{selected.rejectionReason}</p>
                </div>
              )}

              {/* HR Notes */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">HR Notes</p>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                  rows={3}
                  value={hrNotes}
                  onChange={e => setHrNotes(e.target.value)}
                />
                <button
                  onClick={() => saveHrNotes(selected.id)}
                  className="mt-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Save Notes
                </button>
              </div>

              {/* Rejection reason field */}
              {selected.status === 'under_review' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Rejection Reason (if rejecting)</p>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection…"
                  />
                </div>
              )}

              {/* Action buttons */}
              {NEXT_STATUSES[selected.status] && (
                <div className="flex gap-2">
                  {NEXT_STATUSES[selected.status].map(({ status, label, color }) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selected.id, status)}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition ${color}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Salary Review</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employee *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee…</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Review Type</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.reviewType} onChange={e => setForm(f => ({ ...f, reviewType: e.target.value }))}>
                    {Object.entries(REVIEW_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Review Date *</label>
                  <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Salary ($) *</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.currentSalary} onChange={e => setForm(f => ({ ...f, currentSalary: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Basis</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.currentBasis} onChange={e => setForm(f => ({ ...f, currentBasis: e.target.value }))}>
                    <option value="annual">Annual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Proposed Salary ($)</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.proposedSalary} onChange={e => setForm(f => ({ ...f, proposedSalary: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Basis</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    value={form.proposedBasis} onChange={e => setForm(f => ({ ...f, proposedBasis: e.target.value }))}>
                    <option value="annual">Annual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Performance Rating</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  value={form.performanceRating} onChange={e => setForm(f => ({ ...f, performanceRating: e.target.value }))}>
                  <option value="">— Not set —</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="exceeds">Exceeds Expectations</option>
                  <option value="meets">Meets Expectations</option>
                  <option value="below">Below Expectations</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Effective Date</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Justification</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" rows={3}
                  value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submit immediately</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={saveReview} disabled={saving || !form.employeeId || !form.reviewDate || !form.currentSalary}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Create Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
