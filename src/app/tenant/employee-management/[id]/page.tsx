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

const TABS = ['Overview', 'Employment', 'Compliance', 'Documents', 'Training'] as const
type Tab = typeof TABS[number]

export default function EmployeeProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [emp,     setEmp]    = useState<Employee | null>(null)
  const [loading, setLoading]= useState(true)
  const [tab,     setTab]    = useState<Tab>('Overview')
  const [saving,  setSaving] = useState(false)
  const [msg,     setMsg]    = useState('')

  useEffect(() => {
    fetch(`/api/tenant/employees/${id}`)
      .then(r => r.json())
      .then(d => { setEmp(d.employee ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

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
      <span className="text-5xl">🔍</span>
      <p className="text-gray-500">Employee not found</p>
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
                  🛡 NDIS Worker
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
              ✏️ Edit
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
            <Row label="Award / Class."   value={emp.awardClassification} />
            <Row label="Pay Level"        value={emp.payLevel} />
            <Row label="Start Date"       value={fmt(emp.startDate)} />
            <Row label="Probation End"    value={emp.probationEndDate ? fmt(emp.probationEndDate) : '—'} />
            {emp.endDate && <Row label="End Date" value={fmt(emp.endDate)} />}
            <Row label="NDIS Worker"      value={emp.ndisWorker ? '✅ Yes' : 'No'} />
          </div>
        )}

        {tab === 'Compliance' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Compliance Status</p>
                <span className={`inline-flex mt-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex gap-2">
                {(['green','amber','red','pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setCompliance(s)}
                    disabled={saving || emp.complianceStatus === s}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      emp.complianceStatus === s ? 'ring-2 ring-offset-1 opacity-100' : 'opacity-60 hover:opacity-100'
                    } ${COMPLIANCE_BADGE[s].cls}`}
                  >
                    {COMPLIANCE_BADGE[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
              Detailed compliance checks (police checks, WWCC, NDIS screening, visa) will appear here once the Compliance module is enabled.
            </div>
          </div>
        )}

        {tab === 'Documents' && (
          <div className="text-center py-10">
            <span className="text-4xl">📄</span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Employee documents will appear here once the Document Management module is enabled.
            </p>
          </div>
        )}

        {tab === 'Training' && (
          <div className="text-center py-10">
            <span className="text-4xl">📚</span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Training records will appear here once the Training &amp; Development module is enabled.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
