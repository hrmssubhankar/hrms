'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PermissionGate from '@/components/auth/PermissionGate'

// ── CSV Import Modal ─────────────────────────────────────────────────────────

type ImportResult = {
  imported: number; skipped: number; total: number
  errors: string[]
}

function CsvImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file,   setFile]   = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errMsg, setErrMsg] = useState('')

  async function upload() {
    if (!file) return
    setStatus('uploading')
    setErrMsg('')
    const form = new FormData()
    form.append('file', file)
    try {
      const res  = await fetch('/api/tenant/employees/import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setErrMsg(data.error ?? 'Upload failed'); setStatus('error'); return }
      setResult(data)
      setStatus('done')
      if (data.imported > 0) onDone() // refresh table
    } catch {
      setErrMsg('Network error — please try again')
      setStatus('error')
    }
  }

  const TEMPLATE = `employee_number,first_name,last_name,email,employment_type,start_date,preferred_name,phone,entity_name,award_classification,hourly_rate,ndis_worker
EMP001,Jane,Smith,jane.smith@example.com,full_time,2026-01-15,,+61400000001,Yahweh Care,,35.50,true`

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'employee_import_template.csv' })
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import Employees</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload a CSV to bulk-add employees</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {status === 'done' && result ? (
            <>
              <div className="text-center py-4">
                <div className="text-5xl mb-3">{result.imported > 0 ? '✅' : '⚠️'}</div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Import complete</p>
                <div className="flex justify-center gap-6 mt-3 text-sm">
                  <span className="text-green-600 font-semibold">{result.imported} imported</span>
                  {result.skipped > 0 && <span className="text-amber-600 font-semibold">{result.skipped} skipped</span>}
                  <span className="text-gray-400">{result.total} total rows</span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Skipped rows:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{e}</p>
                  ))}
                </div>
              )}
              <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--primary)' }}>
                Close
              </button>
            </>
          ) : (
            <>
              {/* Template download */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Need a template?</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                  Required columns: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">employee_number, first_name, last_name, email, employment_type, start_date</code>
                </p>
                <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium underline">
                  Download sample CSV →
                </button>
              </div>

              {/* File picker */}
              <div
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition"
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl mb-2">📁</p>
                    <p className="text-sm text-gray-500">Click to select a CSV file</p>
                    <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
                  </>
                )}
              </div>

              {(errMsg || status === 'error') && (
                <p className="text-sm text-red-600 dark:text-red-400">{errMsg || 'Upload failed.'}</p>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button
                  onClick={upload}
                  disabled={!file || status === 'uploading'}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
                  style={{ background: 'var(--primary)' }}
                >
                  {status === 'uploading' ? 'Uploading…' : 'Import'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type Employee = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  preferredName: string | null
  email: string
  phone: string | null
  employmentType: string
  entityName: string | null
  departmentName: string | null
  positionTitle: string | null
  startDate: string
  isActive: boolean
  complianceStatus: 'green' | 'amber' | 'red' | 'pending'
  ndisWorker: boolean
}

const COMPLIANCE_BADGE: Record<string, { label: string; cls: string }> = {
  green:   { label: 'Compliant',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  amber:   { label: 'Review',       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  red:     { label: 'Non-Compliant',cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  pending: { label: 'Pending',      cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  casual:     'Casual',
  contractor: 'Contractor',
  volunteer:  'Volunteer',
}

export default function EmployeeManagementPage() {
  const router = useRouter()
  const [employees, setEmployees]   = useState<Employee[]>([])
  const [loading,   setLoading]     = useState(true)
  const [search,    setSearch]      = useState('')
  const [status,    setStatus]      = useState('')
  const [empType,   setEmpType]     = useState('')
  const [showImport, setShowImport] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (status)          params.set('status', status)
      if (empType)         params.set('type', empType)
      params.set('limit', '50')
      const res  = await fetch(`/api/tenant/employees?${params}`)
      const data = await res.json()
      setEmployees(data.employees ?? [])
    } catch {
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, empType])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const activeCount   = employees.filter(e => e.isActive).length
  const inactiveCount = employees.length - activeCount
  const ndisCount     = employees.filter(e => e.ndisWorker).length

  return (
    <div className="space-y-6">
      {showImport && (
        <CsvImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); fetchEmployees() }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your workforce
          </p>
        </div>
        <PermissionGate permission="employees:write">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              ↑ Import CSV
            </button>
            <Link
              href="/tenant/employee-management/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              + Add Employee
            </Link>
          </div>
        </PermissionGate>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: employees.length, icon: '👥', cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active',   value: activeCount,       icon: '✅', cls: 'text-green-600 dark:text-green-400' },
          { label: 'Inactive', value: inactiveCount,     icon: '⏸', cls: 'text-gray-500' },
          { label: 'NDIS',     value: ndisCount,         icon: '🛡', cls: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, email, emp #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={empType}
          onChange={e => setEmpType(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="">All Types</option>
          {Object.entries(EMP_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(search || status || empType) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setEmpType('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">👥</span>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {search || status || empType ? 'No employees match your filters' : 'No employees yet'}
            </p>
            {!search && !status && !empType && (
              <PermissionGate permission="employees:write">
                <Link
                  href="/tenant/employee-management/new"
                  className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  Add your first employee
                </Link>
              </PermissionGate>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Emp #', 'Name', 'Role / Dept', 'Type', 'Entity', 'Start Date', 'Compliance', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {employees.map(emp => {
                  const badge = COMPLIANCE_BADGE[emp.complianceStatus] ?? COMPLIANCE_BADGE.pending
                  const fullName = [emp.firstName, emp.lastName].join(' ')
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => router.push(`/tenant/employee-management/${emp.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: 'var(--primary)' }}
                          >
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {fullName}
                              {emp.ndisWorker && <span className="ml-1.5 text-xs text-purple-500">🛡 NDIS</span>}
                            </p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 dark:text-gray-300">{emp.positionTitle ?? '—'}</p>
                        <p className="text-xs text-gray-400">{emp.departmentName ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {EMP_TYPE_LABEL[emp.employmentType] ?? emp.employmentType}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{emp.entityName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {emp.startDate ? new Date(emp.startDate).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex w-2 h-2 rounded-full ${emp.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="ml-1.5 text-xs text-gray-500">{emp.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tenant/employee-management/${emp.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-xs font-medium text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-400">
              {employees.length} employee{employees.length !== 1 ? 's' : ''} shown
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
