'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Employee = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  preferredName: string | null
  dateOfBirth: string | null
  gender: string | null
  phone: string | null
  email: string
  address: string | null
  photoUrl: string | null
  entityName: string | null
  departmentName: string | null
  positionTitle: string | null
  departmentId: string | null
  positionId: string | null
  employmentType: string
  awardClassification: string | null
  payLevel: string | null
  annualSalary: string | null
  ordinaryHoursPerWeek: string | null
  startDate: string
  probationEndDate: string | null
  endDate: string | null
  isActive: boolean
  complianceStatus: string
  ndisWorker: boolean
  createdAt: string
  updatedAt: string
}

const COMPLIANCE_BADGE: Record<string, { label: string; cls: string }> = {
  green:   { label: 'Compliant',     cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  amber:   { label: 'Needs Review',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  red:     { label: 'Non-Compliant', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  pending: { label: 'Pending',       cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time:'Full-time', part_time:'Part-time', casual:'Casual', contractor:'Contractor', volunteer:'Volunteer',
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-AU', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const age  = (d: string | null) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  return ` (${Math.floor(diff / (365.25*24*3600*1000))} yrs)`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="sm:w-44 text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200">{value ?? '—'}</span>
    </div>
  )
}

const TABS = ['Overview', 'Employment', 'Emergency Contacts', 'Compliance', 'Documents', 'Training'] as const
type Tab = typeof TABS[number]

type ScreeningRecord = {
  id: string
  checkType: string
  status: string
  referenceNumber: string | null
  issuedDate: string | null
  expiryDate: string | null
  notes: string | null
}

type EmployeeDoc = {
  id: string
  category: string
  title: string
  blobUrl: string
  fileName: string | null
  fileSizeBytes: number | null
  mimeType: string | null
  status: string
  expiryDate: string | null
  createdAt: string
}

type EmergencyContact = {
  id: string
  name: string
  relationship: string | null
  phone: string | null
  email: string | null
  isPrimary: boolean
}

const BLANK_CONTACT = { name: '', relationship: '', phone: '', email: '', isPrimary: false }

export default function EmployeeProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [emp,     setEmp]    = useState<Employee | null>(null)
  const [loading, setLoading]= useState(true)
  const [tab,     setTab]    = useState<Tab>('Overview')
  const [saving,  setSaving] = useState(false)
  const [msg,     setMsg]    = useState('')

  // Emergency contacts state
  const [contacts,      setContacts]      = useState<EmergencyContact[]>([])
  const [contactsLoaded, setContactsLoaded] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact,  setEditingContact]  = useState<EmergencyContact | null>(null)
  const [contactForm,    setContactForm]    = useState(BLANK_CONTACT)
  const [contactSaving,  setContactSaving]  = useState(false)
  const [contactError,   setContactError]   = useState('')
  const [deletingContact, setDeletingContact] = useState<string | null>(null)

  // Compliance screening state
  const [screening,        setScreening]        = useState<ScreeningRecord[]>([])
  const [screeningLoaded,  setScreeningLoaded]  = useState(false)

  // Documents state
  const [docs,       setDocs]       = useState<EmployeeDoc[]>([])
  const [docsLoaded, setDocsLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/tenant/employees/${id}`)
      .then(r => r.json())
      .then(d => { setEmp(d.employee ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  // Load emergency contacts when that tab is first opened
  useEffect(() => {
    if (tab === 'Emergency Contacts' && !contactsLoaded) {
      fetch(`/api/tenant/employees/${id}/emergency-contacts`)
        .then(r => r.json())
        .then(d => { setContacts(d.contacts ?? []); setContactsLoaded(true) })
        .catch(() => setContactsLoaded(true))
    }
  }, [tab, id, contactsLoaded])

  // Load screening records when Compliance tab is first opened
  useEffect(() => {
    if (tab === 'Compliance' && !screeningLoaded) {
      fetch(`/api/tenant/compliance/screening?employeeId=${id}`)
        .then(r => r.json())
        .then(d => { setScreening(d.records ?? []); setScreeningLoaded(true) })
        .catch(() => setScreeningLoaded(true))
    }
  }, [tab, id, screeningLoaded])

  // Load documents when Documents tab is first opened
  useEffect(() => {
    if (tab === 'Documents' && !docsLoaded) {
      fetch(`/api/tenant/documents?employeeId=${id}`)
        .then(r => r.json())
        .then(d => { setDocs(d.documents ?? []); setDocsLoaded(true) })
        .catch(() => setDocsLoaded(true))
    }
  }, [tab, id, docsLoaded])

  function openAddContact() {
    setEditingContact(null)
    setContactForm(BLANK_CONTACT)
    setContactError('')
    setShowContactForm(true)
  }

  function openEditContact(c: EmergencyContact) {
    setEditingContact(c)
    setContactForm({ name: c.name, relationship: c.relationship ?? '', phone: c.phone ?? '', email: c.email ?? '', isPrimary: c.isPrimary })
    setContactError('')
    setShowContactForm(true)
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    setContactSaving(true)
    setContactError('')
    try {
      const payload = { ...contactForm, relationship: contactForm.relationship || null, phone: contactForm.phone || null, email: contactForm.email || null }
      const res = editingContact
        ? await fetch(`/api/tenant/employees/${id}/emergency-contacts`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId: editingContact.id, ...payload }) })
        : await fetch(`/api/tenant/employees/${id}/emergency-contacts`, { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setContactError(d.error ?? 'Failed to save'); return }
      // Refresh list
      const refreshed = await fetch(`/api/tenant/employees/${id}/emergency-contacts`).then(r => r.json())
      setContacts(refreshed.contacts ?? [])
      setShowContactForm(false)
    } catch {
      setContactError('Network error — please try again.')
    } finally {
      setContactSaving(false)
    }
  }

  async function deleteContact(contactId: string) {
    setDeletingContact(contactId)
    try {
      await fetch(`/api/tenant/employees/${id}/emergency-contacts`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId }) })
      setContacts(prev => prev.filter(c => c.id !== contactId))
    } finally {
      setDeletingContact(null)
    }
  }

  async function toggleActive() {
    if (!emp) return
    setSaving(true)
    const res  = await fetch(`/api/tenant/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !emp.isActive }),
    })
    const data = await res.json()
    if (res.ok) { setEmp(data.employee); setMsg(data.employee.isActive ? 'Employee activated' : 'Employee deactivated') }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function setCompliance(status: string) {
    if (!emp) return
    setSaving(true)
    const res  = await fetch(`/api/tenant/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complianceStatus: status }),
    })
    const data = await res.json()
    if (res.ok) { setEmp(data.employee); setMsg('Compliance status updated') }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
  if (!emp)    return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-5xl"></span>
      <p className="text-gray-500 dark:text-gray-400">Employee not found</p>
      <Link href="/tenant/employee-management" className="text-sm text-blue-500">← Back to Employees</Link>
    </div>
  )

  const badge    = COMPLIANCE_BADGE[emp.complianceStatus] ?? COMPLIANCE_BADGE.pending
  const fullName = `${emp.firstName} ${emp.lastName}`
  const initials = `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back */}
      <Link href="/tenant/employee-management" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
        ← All Employees
      </Link>

      {/* Profile header card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
              {emp.ndisWorker && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  NDIS Worker
                </span>
              )}
            </div>
            {emp.preferredName && (
              <p className="text-sm text-gray-400 mt-0.5">Goes by "{emp.preferredName}"</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {emp.employeeNumber}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {EMP_TYPE_LABEL[emp.employmentType] ?? emp.employmentType}
              </span>
              {emp.positionTitle && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {emp.positionTitle}
                </span>
              )}
              {emp.departmentName && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {emp.departmentName}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            {msg && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">{msg}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href={`/tenant/employee-management/${id}/edit`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white text-center"
              style={{ background: 'var(--primary)' }}
            >
              ️ Edit
            </Link>
            <button
              onClick={toggleActive}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                emp.isActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
              }`}
            >
              {emp.isActive ? '⏸ Deactivate' : '▶ Reactivate'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t
                ? 'border-current text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            style={tab === t ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">

        {tab === 'Overview' && (
          <div>
            <Row label="Full Name"     value={fullName} />
            <Row label="Email"         value={<a href={`mailto:${emp.email}`} className="text-blue-500 hover:underline">{emp.email}</a>} />
            <Row label="Phone"         value={emp.phone} />
            <Row label="Date of Birth" value={emp.dateOfBirth ? `${fmt(emp.dateOfBirth)}${age(emp.dateOfBirth)}` : '—'} />
            <Row label="Gender"        value={emp.gender} />
            <Row label="Address"       value={emp.address} />
            <Row label="Status"        value={
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${emp.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${emp.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                {emp.isActive ? 'Active' : 'Inactive'}
              </span>
            } />
            <Row label="Profile Added" value={fmt(emp.createdAt)} />
          </div>
        )}

        {tab === 'Employment' && (
          <div>
            <Row label="Employee #"       value={<span className="font-mono">{emp.employeeNumber}</span>} />
            <Row label="Entity"           value={emp.entityName} />
            <Row label="Employment Type"  value={EMP_TYPE_LABEL[emp.employmentType] ?? emp.employmentType} />
            <Row label="Department"       value={emp.departmentName} />
            <Row label="Position"         value={emp.positionTitle} />
            <Row label="Award / Class."      value={emp.awardClassification} />
            <Row label="Pay Level"           value={emp.payLevel} />
            {emp.annualSalary && <Row label="Annual Salary"  value={`$${Number(emp.annualSalary).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} />}
            {emp.ordinaryHoursPerWeek && <Row label="Hrs / Week"  value={`${emp.ordinaryHoursPerWeek} hrs`} />}
            <Row label="Start Date"          value={fmt(emp.startDate)} />
            <Row label="Probation End"    value={emp.probationEndDate ? fmt(emp.probationEndDate) : '—'} />
            {emp.endDate && <Row label="End Date" value={fmt(emp.endDate)} />}
            <Row label="NDIS Worker"      value={emp.ndisWorker ? 'Yes' : 'No'} />
          </div>
        )}

        {tab === 'Emergency Contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">People to contact in an emergency</p>
              <button
                onClick={openAddContact}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                + Add Contact
              </button>
            </div>

            {/* Add/Edit modal */}
            {showContactForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <form
                  onSubmit={saveContact}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                    </h3>
                    <button type="button" onClick={() => setShowContactForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input required value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
                      placeholder="e.g. John Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                    <input value={contactForm.relationship} onChange={e => setContactForm(f => ({ ...f, relationship: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
                      placeholder="e.g. Spouse, Parent, Sibling" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
                        placeholder="+61 4xx xxx xxx" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
                        placeholder="john@example.com" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={contactForm.isPrimary} onChange={e => setContactForm(f => ({ ...f, isPrimary: e.target.checked }))}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Primary emergency contact</span>
                  </label>

                  {contactError && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                      {contactError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={contactSaving}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      style={{ background: 'var(--primary)' }}>
                      {contactSaving ? 'Saving…' : editingContact ? 'Save Changes' : 'Add Contact'}
                    </button>
                    <button type="button" onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contact list */}
            {!contactsLoaded ? (
              <p className="text-sm text-gray-400 py-4">Loading…</p>
            ) : contacts.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-3xl mb-2"></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No emergency contacts added yet</p>
                <button onClick={openAddContact} className="mt-3 text-sm font-medium text-blue-500 hover:text-blue-700">
                  + Add first contact
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {c.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                        {c.isPrimary && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">Primary</span>
                        )}
                        {c.relationship && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{c.relationship}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {c.phone && <span>{c.phone}</span>}
                        {c.email && <span>{c.email}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditContact(c)} className="text-xs text-gray-400 hover:text-blue-500 transition px-1" title="Edit"></button>
                      <button
                        onClick={() => deleteContact(c.id)}
                        disabled={deletingContact === c.id}
                        className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition px-1"
                        title="Delete"
                      >
                        {deletingContact === c.id ? '…' : ''}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Compliance' && (
          <div className="space-y-5">
            {/* Overall status + change */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Overall Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['green','amber','red','pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setCompliance(s)}
                    disabled={saving || emp.complianceStatus === s}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      emp.complianceStatus === s ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                    } ${COMPLIANCE_BADGE[s].cls}`}
                  >
                    {COMPLIANCE_BADGE[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Screening records */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Screening Checks</p>
              {!screeningLoaded ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : screening.length === 0 ? (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
                  <p className="text-3xl mb-2"></p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No screening records yet</p>
                  <a href="/tenant/compliance" className="mt-2 inline-block text-xs text-blue-500 hover:underline">
                    Add via Compliance module →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {screening.map(sr => {
                    const statusStyle: Record<string, string> = {
                      green:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                      amber:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                      red:'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                      pending:'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                    }
                    return (
                      <div key={sr.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sr.checkType}</p>
                          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-gray-400">
                            {sr.referenceNumber && <span>Ref: {sr.referenceNumber}</span>}
                            {sr.issuedDate && <span>Issued: {fmt(sr.issuedDate)}</span>}
                            {sr.expiryDate && <span>Expires: {fmt(sr.expiryDate)}</span>}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[sr.status] ?? statusStyle.pending}`}>
                          {sr.status.charAt(0).toUpperCase() + sr.status.slice(1)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Employee Documents</p>
              <a
                href="/tenant/documents"
                className="text-xs text-blue-500 hover:underline"
              >
                Manage in Documents module →
              </a>
            </div>
            {!docsLoaded ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : docs.length === 0 ? (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-3xl mb-2"></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded for this employee</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => {
                  const statusStyle: Record<string, string> = {
                    active:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                    expired:'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                    archived:'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                    pending_review:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                  }
                  const size = doc.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : ''
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="text-2xl shrink-0">
                        {doc.mimeType?.includes('pdf') ? '' : doc.mimeType?.includes('image') ? '' : ''}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.title}</p>
                        <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                          <span>{doc.category}</span>
                          {size && <span>{size}</span>}
                          {doc.expiryDate && <span>Expires: {fmt(doc.expiryDate)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[doc.status] ?? statusStyle.active}`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                        <a
                          href={doc.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'Training' && (
          <div className="text-center py-10">
            <span className="text-4xl"></span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Training records will appear here once the Training &amp; Development module is enabled.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
