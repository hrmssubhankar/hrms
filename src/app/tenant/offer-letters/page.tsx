'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

type Offer = {
  id: string; candidateName: string; candidateEmail: string
  position: string; department: string | null; employmentType: string
  startDate: string | null; salaryAmount: number | null; salaryCycle: string
  status: string; sentAt: string | null; acceptedAt: string | null
  rejectedAt: string | null; expiresAt: string | null; pdfUrl: string | null
  notes: string | null; createdBy: string | null; createdAt: string; templateContent: string | null
}
type OfferEvent = { id: string; event: string; note: string | null; performedBy: string | null; createdAt: string }
type Stats = { total: number; draft: number; sent: number; accepted: number; rejected: number; expired: number }
type Employee = { id: string; firstName: string; lastName: string }

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-gray-800 text-gray-400 border-gray-700',
  sent:      'bg-blue-900/50 text-blue-300 border-blue-800',
  accepted:  'bg-green-900/50 text-green-300 border-green-800',
  rejected:  'bg-red-900/50 text-red-300 border-red-800',
  expired:   'bg-amber-900/50 text-amber-300 border-amber-800',
  withdrawn: 'bg-gray-800 text-gray-500 border-gray-700',
}

const EVENT_ICON: Record<string, string> = {
  created:'📝', sent:'📤', viewed:'👁', accepted:'✅', rejected:'❌',
  expired:'⏰', withdrawn:'↩️', pdf_generated:'📄', note_added:'💬', updated:'✏️',
}

const EMP_TYPES = [
  { value: 'full_time',   label: 'Full-Time' },
  { value: 'part_time',   label: 'Part-Time' },
  { value: 'casual',      label: 'Casual' },
  { value: 'contractor',  label: 'Contractor' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL = 'block text-xs font-medium text-gray-400 mb-1'

const DEFAULT_TEMPLATE = (o: Partial<Offer> & { orgName?: string }) => `Dear ${o.candidateName || '[Candidate Name]'},

We are delighted to offer you the position of ${o.position || '[Position Title]'} at ${o.orgName || '[Organisation Name]'}.

EMPLOYMENT DETAILS
Position:         ${o.position || '[Position Title]'}
Department:       ${o.department || '[Department]'}
Employment Type:  ${o.employmentType || 'Full-Time'}
Start Date:       ${o.startDate || '[Start Date]'}
Salary:           $${o.salaryAmount?.toLocaleString() || '[Salary]'} ${o.salaryCycle || 'per annum'}

This offer is subject to the successful completion of reference and background checks.

Please confirm your acceptance of this offer by replying to this email or signing the attached acceptance form before the expiry date.

We look forward to welcoming you to the team.

Yours sincerely,
[Hiring Manager Name]
[Title]
[Organisation Name]`

export default function OfferLettersPage() {
  const [offers,     setOffers]     = useState<Offer[]>([])
  const [stats,      setStats]      = useState<Stats>({ total:0,draft:0,sent:0,accepted:0,rejected:0,expired:0 })
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [loading,    setLoading]    = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search,     setSearch]     = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [selected,   setSelected]   = useState<Offer | null>(null)
  const [events,     setEvents]     = useState<OfferEvent[]>([])
  const [noteText,   setNoteText]   = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const printRef    = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    candidateName: '', candidateEmail: '', position: '', department: '',
    employmentType: 'full_time', startDate: '', salaryAmount: '', salaryCycle: 'annual',
    notes: '', expiresAt: '', templateContent: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search)       params.set('search', search)
    const res  = await fetch(`/api/tenant/offer-letters?${params}`)
    const data = await res.json()
    setOffers(data.offers ?? [])
    setStats(data.stats ?? { total:0,draft:0,sent:0,accepted:0,rejected:0,expired:0 })
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/tenant/employees').then(r=>r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  function initForm() {
    setForm({ candidateName:'',candidateEmail:'',position:'',department:'',
      employmentType:'full_time',startDate:'',salaryAmount:'',salaryCycle:'annual',
      notes:'',expiresAt:'',templateContent:'' })
    setShowForm(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const content = form.templateContent || DEFAULT_TEMPLATE({
      candidateName: form.candidateName, position: form.position,
      department: form.department, employmentType: form.employmentType,
      startDate: form.startDate, salaryAmount: Number(form.salaryAmount) || 0,
      salaryCycle: form.salaryCycle,
    })
    const res  = await fetch('/api/tenant/offer-letters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, salaryAmount: Number(form.salaryAmount)||null, templateContent: content }),
    })
    setSaving(false)
    if (res.ok) { setShowForm(false); load() }
  }

  async function selectOffer(offer: Offer) {
    setSelected(offer)
    const res  = await fetch(`/api/tenant/offer-letters/${offer.id}`)
    const data = await res.json()
    setSelected(data.offer)
    setEvents(data.events ?? [])
  }

  async function updateStatus(status: string) {
    if (!selected) return
    const res = await fetch(`/api/tenant/offer-letters/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { selectOffer(selected); load() }
  }

  async function addNote() {
    if (!selected || !noteText.trim()) return
    setAddingNote(true)
    await fetch(`/api/tenant/offer-letters/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _note: noteText.trim() }),
    })
    setNoteText(''); setAddingNote(false)
    selectOffer(selected)
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete this draft offer letter?')) return
    await fetch(`/api/tenant/offer-letters/${id}`, { method: 'DELETE' })
    setSelected(null); load()
  }

  function printOffer() {
    if (!selected) return
    const content = selected.templateContent || DEFAULT_TEMPLATE(selected)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Offer Letter — ${selected.candidateName}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px 60px; color: #111; }
      h1 { font-size: 16pt; margin-bottom: 4px; }
      .header { border-bottom: 2px solid #1a4fff; padding-bottom: 12px; margin-bottom: 24px; }
      .meta { font-size: 10pt; color: #555; }
      pre { font-family: inherit; white-space: pre-wrap; }
      @media print { body { margin: 20px 40px; } }
    </style></head><body>
    <div class="header">
      <h1>Offer Letter</h1>
      <div class="meta">Date: ${new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}&nbsp;&nbsp;|&nbsp;&nbsp;
      Ref: ${selected.id.slice(0,8).toUpperCase()}</div>
    </div>
    <pre>${content}</pre>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`)
    win.document.close()
  }

  function fmt(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Offer Letters</h1>
          <p className="text-gray-400 text-sm mt-0.5">Generate, send and track candidate offer letters</p>
        </div>
        <button onClick={initForm}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition">
          + New Offer Letter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total',    value: stats.total,    col: 'border-gray-700' },
          { label: 'Draft',    value: stats.draft,    col: 'border-gray-600' },
          { label: 'Sent',     value: stats.sent,     col: 'border-blue-700' },
          { label: 'Accepted', value: stats.accepted, col: 'border-green-700' },
          { label: 'Rejected', value: stats.rejected, col: 'border-red-700' },
          { label: 'Expired',  value: stats.expired,  col: 'border-amber-700' },
        ].map(s => (
          <div key={s.label} className={`bg-gray-900 border rounded-xl p-3 text-center ${s.col}`}>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e=>{setSearch(e.target.value)}}
          placeholder="Search candidate / position…"
          className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="">All Status</option>
          {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-sm">No offer letters yet. Create your first one.</p>
            </div>
          ) : offers.map(o => (
            <div key={o.id} onClick={() => selectOffer(o)}
              className={`p-4 rounded-xl border cursor-pointer transition ${selected?.id === o.id ? 'border-purple-600 bg-purple-900/20' : 'border-gray-800 bg-gray-900 hover:border-gray-600'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-white truncate">{o.candidateName}</p>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                  {o.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{o.position}{o.department ? ` · ${o.department}` : ''}</p>
              <p className="text-xs text-gray-500 mt-1">{o.candidateEmail}</p>
              <p className="text-xs text-gray-600 mt-1">{fmt(o.createdAt)}{o.salaryAmount ? ` · $${o.salaryAmount.toLocaleString()} p/a` : ''}</p>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 text-sm">Select an offer letter to view details and history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Offer detail card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.candidateName}</h2>
                    <p className="text-sm text-purple-400">{selected.position}</p>
                    <p className="text-xs text-gray-400">{selected.candidateEmail}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[selected.status] ?? ''}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  {[
                    { label:'Employment Type', value: EMP_TYPES.find(t=>t.value===selected.employmentType)?.label ?? selected.employmentType },
                    { label:'Department',      value: selected.department || '—' },
                    { label:'Start Date',      value: fmt(selected.startDate) },
                    { label:'Salary',          value: selected.salaryAmount ? `$${selected.salaryAmount.toLocaleString()} / ${selected.salaryCycle}` : '—' },
                    { label:'Sent',            value: fmt(selected.sentAt) },
                    { label:'Expires',         value: fmt(selected.expiresAt) },
                    { label:'Accepted',        value: fmt(selected.acceptedAt) },
                    { label:'Rejected',        value: fmt(selected.rejectedAt) },
                  ].map(r => (
                    <div key={r.label} className="bg-gray-800/60 rounded-lg p-2.5">
                      <p className="text-xs text-gray-500">{r.label}</p>
                      <p className="text-white text-xs font-medium mt-0.5">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={printOffer}
                    className="flex-1 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition">
                    🖨 Print / Download PDF
                  </button>
                  {selected.status === 'draft' && (
                    <button onClick={() => updateStatus('sent')}
                      className="flex-1 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                      📤 Mark as Sent
                    </button>
                  )}
                  {selected.status === 'sent' && (
                    <>
                      <button onClick={() => updateStatus('accepted')}
                        className="flex-1 py-2 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition">
                        ✅ Mark Accepted
                      </button>
                      <button onClick={() => updateStatus('rejected')}
                        className="flex-1 py-2 text-xs font-medium bg-red-700 hover:bg-red-600 text-white rounded-lg transition">
                        ❌ Mark Rejected
                      </button>
                    </>
                  )}
                  {['draft','sent'].includes(selected.status) && (
                    <button onClick={() => updateStatus('withdrawn')}
                      className="flex-1 py-2 text-xs font-medium border border-gray-700 text-gray-400 hover:text-white rounded-lg transition">
                      ↩ Withdraw
                    </button>
                  )}
                  {selected.status === 'draft' && (
                    <button onClick={() => deleteOffer(selected.id)}
                      className="py-2 px-3 text-xs text-red-400 border border-red-800 hover:bg-red-900/30 rounded-lg transition">
                      🗑
                    </button>
                  )}
                </div>
              </div>

              {/* Add note */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">Add Note</p>
                <div className="flex gap-2">
                  <input value={noteText} onChange={e=>setNoteText(e.target.value)}
                    placeholder="Internal note…"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                  <button onClick={addNote} disabled={addingNote || !noteText.trim()}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition">
                    Add
                  </button>
                </div>
              </div>

              {/* History timeline */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">History</p>
                {events.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No events yet</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm">
                            {EVENT_ICON[ev.event] ?? '📌'}
                          </div>
                          {i < events.length - 1 && <div className="w-px h-4 bg-gray-700 mt-1" />}
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-white capitalize">{ev.event.replace(/_/g,' ')}</p>
                            <p className="text-xs text-gray-600 shrink-0">{fmt(ev.createdAt)}</p>
                          </div>
                          {ev.note && <p className="text-xs text-gray-400 mt-0.5">{ev.note}</p>}
                          {ev.performedBy && <p className="text-xs text-gray-600 mt-0.5">by {ev.performedBy}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">New Offer Letter</h2>
              <button onClick={()=>setShowForm(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Candidate Name *</label>
                  <input required value={form.candidateName} onChange={e=>setForm(f=>({...f,candidateName:e.target.value}))} className={INPUT} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className={LABEL}>Candidate Email *</label>
                  <input required type="email" value={form.candidateEmail} onChange={e=>setForm(f=>({...f,candidateEmail:e.target.value}))} className={INPUT} placeholder="jane@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Position *</label>
                  <input required value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} className={INPUT} placeholder="Support Worker" />
                </div>
                <div>
                  <label className={LABEL}>Department</label>
                  <input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} className={INPUT} placeholder="Community Care" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Employment Type</label>
                  <select value={form.employmentType} onChange={e=>setForm(f=>({...f,employmentType:e.target.value}))} className={INPUT}>
                    {EMP_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Offer Expires</label>
                  <input type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Annual Salary ($)</label>
                  <input type="number" value={form.salaryAmount} onChange={e=>setForm(f=>({...f,salaryAmount:e.target.value}))} className={INPUT} placeholder="65000" />
                </div>
                <div>
                  <label className={LABEL}>Salary Cycle</label>
                  <select value={form.salaryCycle} onChange={e=>setForm(f=>({...f,salaryCycle:e.target.value}))} className={INPUT}>
                    <option value="annual">Annual</option>
                    <option value="hourly">Hourly</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Offer Letter Content (leave blank for default template)</label>
                <textarea value={form.templateContent} onChange={e=>setForm(f=>({...f,templateContent:e.target.value}))}
                  className={INPUT + ' min-h-[120px] resize-y font-mono text-xs'} placeholder="Leave blank to use default template…" />
              </div>
              <div>
                <label className={LABEL}>Internal Notes</label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className={INPUT} placeholder="Optional HR notes (not shown to candidate)" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                  {saving ? 'Creating…' : 'Create Offer Letter'}
                </button>
                <button type="button" onClick={()=>setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Hidden printable div */}
      <div ref={printRef} className="hidden" />
    </div>
  )
}
