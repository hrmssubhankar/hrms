'use client'

import { useEffect, useState } from 'react'
import FileUpload, { type UploadResult } from '@/components/ui/FileUpload'

// ── Types ─────────────────────────────────────────────────────────────────────
type MyDoc = {
  id: string; category: string; title: string; blobUrl: string
  fileName: string | null; fileSizeBytes: number | null; mimeType: string | null
  status: string; expiryDate: string | null; notes: string | null
  version: number; createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MY_DOC_CATEGORIES = [
  'Police Check',
  'Working With Children Check',
  'NDIS Worker Screening',
  'NDIS Module Completion',
  'First Aid Certificate',
  'CPR Certificate',
  'Manual Handling Certificate',
  "Driver's Licence",
  "Driver's Licence — Vehicle Class",
  'Vehicle Registration',
  'Visa / Work Rights',
  'COVID Vaccination Record',
  'Tax File Number Declaration',
  'Superannuation Form',
  'Bank Details Form',
  'Training Certificate',
  'Trade Licence / Certification',
  'ID Document',
  'Other',
]

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:         { bg: 'bg-green-900/40 border-green-800', text: 'text-green-300', label: 'Active' },
  pending_review: { bg: 'bg-amber-900/40 border-amber-800', text: 'text-amber-300', label: 'Pending Review' },
  expired:        { bg: 'bg-red-900/40 border-red-800',    text: 'text-red-300',   label: 'Expired' },
  archived:       { bg: 'bg-gray-800 border-gray-700',      text: 'text-gray-400',  label: 'Archived' },
}

const MIME_ICON: Record<string, string> = {
  'application/pdf':  '📄', 'image/png': '🖼', 'image/jpeg': '🖼',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
}
const mimeIcon = (m: string | null) => m ? (MIME_ICON[m] ?? '📁') : '📁'

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const today = new Date().toISOString().split('T')[0]
const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

function expiryBadge(exp: string | null) {
  if (!exp) return null
  if (exp < today) return { text: 'Expired', cls: 'text-red-400 bg-red-900/30 border-red-800' }
  if (exp <= in30) {
    const d = Math.round((new Date(exp + 'T00:00:00').getTime() - Date.now()) / 86400000)
    return { text: `Expires in ${d}d`, cls: 'text-amber-400 bg-amber-900/30 border-amber-800' }
  }
  return { text: `Expires ${fmtDate(exp)}`, cls: 'text-gray-500 bg-gray-800 border-gray-700' }
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL = 'block text-xs font-medium text-gray-400 mb-1'

// Require expiry for certain categories
const EXPIRY_CATS = new Set([
  'Police Check', 'Working With Children Check', 'NDIS Worker Screening',
  'First Aid Certificate', 'CPR Certificate', 'Manual Handling Certificate',
  "Driver's Licence", "Driver's Licence — Vehicle Class", 'Vehicle Registration',
  'Visa / Work Rights', 'COVID Vaccination Record', 'Trade Licence / Certification',
])

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyDocumentsPage() {
  const [docs,       setDocs]       = useState<MyDoc[]>([])
  const [loading,    setLoading]    = useState(true)
  const [linked,     setLinked]     = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', category: 'Police Check', blobUrl: '',
    fileName: '', fileSizeBytes: 0, mimeType: '',
    expiryDate: '', notes: '',
  })

  async function load() {
    setLoading(true)
    const data = await fetch('/api/tenant/my-documents').then(r => r.json())
    setLinked(data.employeeLinked !== false)
    setDocs(data.documents ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.blobUrl) return
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/tenant/my-documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title,
          category:      form.category,
          blobUrl:       form.blobUrl,
          fileName:      form.fileName,
          fileSizeBytes: form.fileSizeBytes,
          mimeType:      form.mimeType,
          expiryDate:    form.expiryDate || null,
          notes:         form.notes,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setSaveError(d.error ?? `Failed (${res.status})`)
        return
      }
      setShowForm(false)
      setForm({ title:'', category:'Police Check', blobUrl:'', fileName:'', fileSizeBytes:0, mimeType:'', expiryDate:'', notes:'' })
      load()
    } catch {
      setSaveError('Network error — please try again.')
    } finally { setSaving(false) }
  }

  // Split docs by urgency
  const expiredDocs    = docs.filter(d => d.expiryDate && d.expiryDate < today)
  const expiringDocs   = docs.filter(d => d.expiryDate && d.expiryDate >= today && d.expiryDate <= in30)
  const pendingDocs    = docs.filter(d => d.status === 'pending_review' && (!d.expiryDate || d.expiryDate >= today))
  const activeDocs     = docs.filter(d => d.status === 'active' && (!d.expiryDate || d.expiryDate > in30))
  const archivedDocs   = docs.filter(d => d.status === 'archived')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">📂 My Documents</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upload personal compliance documents for HR review</p>
        </div>
        {linked && (
          <button
            onClick={() => { setShowForm(v => !v); setSaveError(null) }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Upload Document'}
          </button>
        )}
      </div>

      {/* Not linked state */}
      {!loading && !linked && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center space-y-3">
          <p className="text-5xl">🔗</p>
          <p className="text-gray-300 font-medium">Account not linked to an employee record</p>
          <p className="text-sm text-gray-500">Contact HR to link your account before uploading documents.</p>
        </div>
      )}

      {/* Info note */}
      {linked && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-300">
            📋 Documents you upload are sent to <strong>Pending Review</strong>. HR will activate them once verified.
            Expiry dates trigger alerts to HR before they lapse.
          </p>
        </div>
      )}

      {/* Upload form */}
      {showForm && linked && (
        <form onSubmit={submit} className="bg-gray-900 border border-purple-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Upload Document for HR Review</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL}>Title *</label>
              <input required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Police Check — issued 12 Jan 2026" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Document Type *</label>
              <select required value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT}>
                {MY_DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>
                Expiry Date{EXPIRY_CATS.has(form.category) ? ' *' : ''}
              </label>
              <input type="date" value={form.expiryDate}
                required={EXPIRY_CATS.has(form.category)}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className={INPUT} />
              {EXPIRY_CATS.has(form.category) && !form.expiryDate && (
                <p className="text-xs text-amber-500 mt-1">Required for this document type</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <FileUpload
                label="File *"
                currentUrl={form.blobUrl || null}
                currentName={form.fileName || null}
                onUpload={(r: UploadResult) => setForm(f => ({
                  ...f, blobUrl: r.url, fileName: r.fileName,
                  fileSizeBytes: r.fileSizeBytes, mimeType: r.mimeType,
                }))}
              />
              <input type="hidden" required value={form.blobUrl} onChange={() => {}} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Notes (optional)</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Issuing authority, card number, state…" className={INPUT} />
            </div>
          </div>
          {saveError && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
              ⚠ {saveError}
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.blobUrl}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? 'Uploading…' : 'Submit for Review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : linked && docs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-14 text-center space-y-3">
          <p className="text-5xl">📂</p>
          <p className="text-gray-300 font-medium">No documents yet</p>
          <p className="text-sm text-gray-500">Upload your compliance documents to keep HR informed of your certifications.</p>
        </div>
      ) : linked ? (
        <div className="space-y-6">

          {/* Expired */}
          {expiredDocs.length > 0 && (
            <DocSection title="🔴 Expired" docs={expiredDocs} />
          )}

          {/* Expiring soon */}
          {expiringDocs.length > 0 && (
            <DocSection title="⚠️ Expiring Soon" docs={expiringDocs} />
          )}

          {/* Pending review */}
          {pendingDocs.length > 0 && (
            <DocSection title="⏳ Pending HR Review" docs={pendingDocs} note="HR will review and activate these documents." />
          )}

          {/* Active */}
          {activeDocs.length > 0 && (
            <DocSection title="✅ Active" docs={activeDocs} />
          )}

          {/* Archived */}
          {archivedDocs.length > 0 && (
            <DocSection title="🗄 Archived" docs={archivedDocs} />
          )}
        </div>
      ) : null}
    </div>
  )
}

// ── Doc section component ──────────────────────────────────────────────────────
function DocSection({ title, docs, note }: { title: string; docs: MyDoc[]; note?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-gray-600">({docs.length})</span>
        {note && <span className="text-xs text-gray-500 ml-1">— {note}</span>}
      </div>
      <div className="grid gap-3">
        {docs.map(d => {
          const badge = expiryBadge(d.expiryDate)
          const ss = STATUS_STYLE[d.status]
          return (
            <div key={d.id} className={`border rounded-xl p-4 flex items-start gap-4 ${ss?.bg ?? 'bg-gray-900 border-gray-800'}`}>
              <span className="text-2xl mt-0.5 shrink-0">{mimeIcon(d.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <a href={d.blobUrl} target="_blank" rel="noopener noreferrer"
                    className={`text-sm font-semibold underline underline-offset-2 ${ss?.text ?? 'text-purple-400 hover:text-purple-300'}`}>
                    {d.title} ↗
                  </a>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ss?.bg} ${ss?.text}`}>
                    {ss?.label ?? d.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {d.category}
                  {d.fileName && <span className="ml-2">· {d.fileName} {fmtSize(d.fileSizeBytes)}</span>}
                </p>
                {badge && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${badge.cls}`}>
                    {badge.text}
                  </span>
                )}
                {d.notes && <p className="text-xs text-gray-600 mt-1 italic">{d.notes}</p>}
              </div>
              <div className="text-xs text-gray-600 shrink-0">
                {new Date(d.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

