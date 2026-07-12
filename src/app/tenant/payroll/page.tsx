'use client'

import { useEffect, useState, useCallback } from 'react'

type Employee = { id: string; firstName: string; lastName: string; email: string }

type PayrollRecord = {
  id: string
  employeeId: string
  employeeFirstName: string | null
  employeeLastName: string | null
  employeeEmail: string | null
  periodStart: string
  periodEnd: string
  hoursWorked: string | null
  hourlyRate: string | null
  grossPay: string | null
  paygWithholding: string | null
  medicareLevy: string | null
  superContribution: string | null
  netPay: string | null
  status: string
  exportedToXero: boolean
  exportedAt: string | null
  createdAt: string
}

type XeroStatus  = { connected: boolean; orgName?: string; tokenExpired?: boolean }
type MyobStatus  = { connected: boolean; companyFileName?: string; tokenExpired?: boolean }

type Breakdown = {
  grossPay: number
  paygWithholding: number
  medicareLevy: number
  totalTax: number
  superContribution: number
  netPay: number
  effectiveTaxRate: number
  annualisedGross: number
}

type Stats = {
  total: number; pending: number; approved: number; paid: number
  totalGross: string; totalNet: string; totalSuper: string
}

const fmt = (n: number | string | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  approved: 'bg-blue-900/40 text-blue-300 border-blue-800',
  paid:     'bg-green-900/40 text-green-300 border-green-800',
}

export default function PayrollPage() {
  const [records, setRecords]     = useState<PayrollRecord[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected]   = useState<PayrollRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [xeroStatus,   setXeroStatus]  = useState<XeroStatus | null>(null)
  const [myobStatus,   setMyobStatus]  = useState<MyobStatus | null>(null)
  const [exporting,    setExporting]   = useState<Set<string>>(new Set())
  const [myobExporting, setMyobExporting] = useState<Set<string>>(new Set())
  const [exportMsg,    setExportMsg]   = useState('')

  const [form, setForm] = useState({
    employeeId: '', periodStart: '', periodEnd: '',
    payType: 'hourly' as 'hourly' | 'salary',
    hoursWorked: '', hourlyRate: '', annualSalary: '',
    frequency: 'fortnightly' as 'weekly' | 'fortnightly' | 'monthly',
    allowances: '0', deductions: '0',
  })
  const [preview, setPreview]       = useState<Breakdown | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/tenant/payroll?${params}`)
    if (res.ok) {
      const d = await res.json()
      setRecords(d.records ?? [])
      setStats(d.stats ?? null)
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/tenant/employees?limit=200&status=active')
      .then(r => r.json())
      .then(d => setEmployees(d.employees ?? []))
  }, [])

  useEffect(() => {
    fetch('/api/tenant/xero/status')
      .then(r => r.json())
      .then(d => setXeroStatus(d))
      .catch(() => {})
    fetch('/api/tenant/myob/status')
      .then(r => r.json())
      .then(d => setMyobStatus(d))
      .catch(() => {})
  }, [])

  async function exportToXero(ids: string[]) {
    if (!xeroStatus?.connected) {
      setExportMsg('Xero is not connected. Go to Settings → Integrations to connect.')
      return
    }
    setExporting(new Set(ids))
    setExportMsg('')
    try {
      const res = await fetch('/api/tenant/xero/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const d = await res.json()
      if (!res.ok) { setExportMsg(d.error ?? 'Export failed'); return }
      const { exported, skipped, errors } = d.summary
      setExportMsg(`✓ Exported ${exported} record(s) to Xero${skipped > 0 ? ` · ${skipped} skipped` : ''}${errors > 0 ? ` · ${errors} error(s)` : ''}.`)
      load()
    } catch { setExportMsg('Export failed — check connection.') }
    finally { setExporting(new Set()) }
  }

  async function exportToMyob(ids: string[]) {
    if (!myobStatus?.connected) {
      setExportMsg('MYOB is not connected. Go to Settings → Integrations to connect.')
      return
    }
    setMyobExporting(new Set(ids))
    setExportMsg('')
    try {
      const res = await fetch('/api/tenant/myob/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const d = await res.json()
      if (!res.ok) { setExportMsg(d.error ?? 'MYOB export failed'); return }
      const { exported, skipped, errors } = d.summary
      setExportMsg(`✓ Exported ${exported} record(s) to MYOB${skipped > 0 ? ` · ${skipped} skipped` : ''}${errors > 0 ? ` · ${errors} error(s)` : ''}.`)
      load()
    } catch { setExportMsg('MYOB export failed — check connection.') }
    finally { setMyobExporting(new Set()) }
  }

  async function handlePreview() {
    setPreviewing(true); setError(''); setPreview(null)
    try {
      const body: Record<string, unknown> = {
        frequency: form.frequency,
        allowances: Number(form.allowances),
        deductions: Number(form.deductions),
      }
      if (form.payType === 'hourly') {
        body.hoursWorked = Number(form.hoursWorked)
        body.hourlyRate  = Number(form.hourlyRate)
      } else {
        body.annualSalary = Number(form.annualSalary)
      }
      const res = await fetch('/api/tenant/payroll/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); return }
      setPreview(d.breakdown)
    } catch { setError('Calculation failed') }
    finally { setPreviewing(false) }
  }

  async function handleCreatePayRun() {
    if (!preview) return
    setSaving(true); setError('')
    try {
      const body: Record<string, unknown> = {
        employeeId: form.employeeId, periodStart: form.periodStart, periodEnd: form.periodEnd,
        frequency: form.frequency, allowances: Number(form.allowances), deductions: Number(form.deductions),
      }
      if (form.payType === 'hourly') {
        body.hoursWorked = Number(form.hoursWorked); body.hourlyRate = Number(form.hourlyRate)
      } else {
        body.annualSalary = Number(form.annualSalary)
      }
      const res = await fetch('/api/tenant/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); return }
      setShowModal(false); setPreview(null)
      setForm({ employeeId: '', periodStart: '', periodEnd: '', payType: 'hourly', hoursWorked: '', hourlyRate: '', annualSalary: '', frequency: 'fortnightly', allowances: '0', deductions: '0' })
      load()
    } catch { setError('Failed to save pay run') }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tenant/payroll', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Payroll</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Australian PAYG · Super 11.5% · Medicare 2%</p>
        </div>
        <div className="flex items-center gap-3">
          {xeroStatus && (
            xeroStatus.connected ? (
              <button
                onClick={() => {
                  const unexported = records.filter(r => (r.status === 'approved' || r.status === 'paid') && !r.exportedToXero).map(r => r.id)
                  if (unexported.length === 0) { setExportMsg('No approved/paid records to export.'); return }
                  exportToXero(unexported)
                }}
                disabled={exporting.size > 0}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#13B5EA] text-[#13B5EA] hover:bg-[#13B5EA]/10 transition disabled:opacity-60">
                {exporting.size > 0 ? 'Exporting…' : '⬆ Export All to Xero'}
              </button>
            ) : (
              <a href="/tenant/settings?tab=integrations"
                className="px-3 py-2 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white transition">
                Connect Xero
              </a>
            )
          )}
          {myobStatus && (
            myobStatus.connected ? (
              <button
                onClick={() => {
                  const unexported = records.filter(r => (r.status === 'approved' || r.status === 'paid')).map(r => r.id)
                  if (unexported.length === 0) { setExportMsg('No approved/paid records to export.'); return }
                  exportToMyob(unexported)
                }}
                disabled={myobExporting.size > 0}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#7B2D8B] text-[#c084e8] hover:bg-[#7B2D8B]/10 transition disabled:opacity-60">
                {myobExporting.size > 0 ? 'Exporting…' : '⬆ Export All to MYOB'}
              </button>
            ) : (
              <a href="/tenant/settings?tab=integrations"
                className="px-3 py-2 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white transition">
                Connect MYOB
              </a>
            )
          )}
          <button onClick={() => { setShowModal(true); setPreview(null); setError('') }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
            style={{ background: 'var(--primary)' }}>
            + New Pay Run
          </button>
        </div>
      </div>

      {exportMsg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm border ${exportMsg.startsWith('✓') ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-amber-900/40 border-amber-700 text-amber-300'}`}>
          {exportMsg}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Runs',  value: stats.total,    color: 'text-gray-900 dark:text-white' },
            { label: 'Pending',     value: stats.pending,  color: 'text-yellow-500' },
            { label: 'Approved',    value: stats.approved, color: 'text-blue-400' },
            { label: 'Paid',        value: stats.paid,     color: 'text-green-400' },
            { label: 'Total Gross', value: `$${Number(stats.totalGross).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, color: 'text-gray-900 dark:text-white' },
            { label: 'Total Super', value: `$${Number(stats.totalSuper ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${statusFilter === s ? 'border-transparent text-white' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'}`}
            style={statusFilter === s ? { background: 'var(--primary)' } : {}}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {['Employee', 'Period', 'Gross', 'PAYG Tax', 'Medicare', 'Super', 'Net Pay', 'Status', ''].map(h => (
                  <th key={h} className={`px-4 py-3 font-medium text-gray-500 dark:text-gray-400 ${h && h !== 'Employee' && h !== 'Period' && h !== 'Status' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-4xl mb-3">💰</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No pay runs yet — create your first one.</p>
                </td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{r.employeeFirstName} {r.employeeLastName}</p>
                    <p className="text-xs text-gray-400">{r.employeeEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">{r.periodStart} → {r.periodEnd}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">{fmt(r.grossPay)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-400">{fmt(r.paygWithholding)}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-400">{fmt(r.medicareLevy)}</td>
                  <td className="px-4 py-3 text-right font-mono text-purple-400">{fmt(r.superContribution)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-green-400">{fmt(r.netPay)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 justify-end items-center">
                      {r.exportedToXero ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#13B5EA]/20 border border-[#13B5EA]/40 text-[#13B5EA]" title={r.exportedAt ? `Exported ${new Date(r.exportedAt).toLocaleDateString('en-AU')}` : 'Exported'}>
                          ✓ Xero
                        </span>
                      ) : (
                        (r.status === 'approved' || r.status === 'paid') && xeroStatus?.connected && (
                          <button
                            onClick={() => exportToXero([r.id])}
                            disabled={exporting.has(r.id)}
                            className="text-xs px-2 py-1 rounded border border-[#13B5EA]/60 text-[#13B5EA] hover:bg-[#13B5EA]/10 transition disabled:opacity-50">
                            {exporting.has(r.id) ? '…' : '⬆ Xero'}
                          </button>
                        )
                      )}
                      {(r.status === 'approved' || r.status === 'paid') && myobStatus?.connected && (
                        <button
                          onClick={() => exportToMyob([r.id])}
                          disabled={myobExporting.has(r.id)}
                          className="text-xs px-2 py-1 rounded border border-[#7B2D8B]/60 text-[#c084e8] hover:bg-[#7B2D8B]/10 transition disabled:opacity-50">
                          {myobExporting.has(r.id) ? '…' : '⬆ MYOB'}
                        </button>
                      )}
                      <button onClick={() => setSelected(r)} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">View</button>
                      {r.status === 'pending'  && <button onClick={() => updateStatus(r.id, 'approved')} className="text-xs px-2 py-1 rounded border border-blue-700 text-blue-400 hover:bg-blue-900/20 transition">Approve</button>}
                      {r.status === 'approved' && <button onClick={() => updateStatus(r.id, 'paid')}     className="text-xs px-2 py-1 rounded border border-green-700 text-green-400 hover:bg-green-900/20 transition">Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Pay Run Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">New Pay Run</h2>
              <button onClick={() => { setShowModal(false); setPreview(null) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee *</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white">
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.email}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start *</label>
                  <input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End *</label>
                  <input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pay Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white">
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pay Basis</label>
                <div className="flex gap-2">
                  {(['hourly', 'salary'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, payType: t }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${form.payType === t ? 'text-white border-transparent' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                      style={form.payType === t ? { background: 'var(--primary)' } : {}}>
                      {t === 'hourly' ? '⏱ Hourly' : '💼 Annual Salary'}
                    </button>
                  ))}
                </div>
              </div>

              {form.payType === 'hourly' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours Worked *</label>
                    <input type="number" min="0" step="0.5" placeholder="76" value={form.hoursWorked}
                      onChange={e => setForm(f => ({ ...f, hoursWorked: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (AUD) *</label>
                    <input type="number" min="0" step="0.01" placeholder="32.50" value={form.hourlyRate}
                      onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Salary (AUD) *</label>
                  <input type="number" min="0" step="100" placeholder="75000" value={form.annualSalary}
                    onChange={e => setForm(f => ({ ...f, annualSalary: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taxable Allowances</label>
                  <input type="number" min="0" step="0.01" value={form.allowances}
                    onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pre-tax Deductions</label>
                  <input type="number" min="0" step="0.01" value={form.deductions}
                    onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <button onClick={handlePreview} disabled={previewing}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 hover:opacity-90"
                style={{ background: 'var(--accent, #7c3aed)' }}>
                {previewing ? 'Calculating…' : '🧮 Calculate Pay'}
              </button>

              {preview && (
                <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pay Breakdown</h3>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { label: 'Gross Pay',          value: preview.grossPay,         color: 'text-gray-900 dark:text-white', bold: true },
                      { label: 'PAYG Withholding',   value: preview.paygWithholding,  color: 'text-red-500', neg: true },
                      { label: 'Medicare Levy (2%)', value: preview.medicareLevy,     color: 'text-orange-400', neg: true },
                      { label: 'Net Pay',            value: preview.netPay,           color: 'text-green-500', bold: true },
                    ].map(row => (
                      <div key={row.label} className={`flex justify-between ${row.bold ? 'border-t border-gray-200 dark:border-gray-700 pt-1.5 font-semibold' : ''}`}>
                        <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                        <span className={row.color}>{row.neg ? '−' : ''}{fmt(row.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-400">Employer Super (11.5%)</span>
                      <span className="text-purple-300 font-medium">{fmt(preview.superContribution)} <span className="text-xs text-gray-500">(on top)</span></span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Annualised gross / Effective tax rate</span>
                      <span>{fmt(preview.annualisedGross)} / {preview.effectiveTaxRate}%</span>
                    </div>
                  </div>
                  <button onClick={handleCreatePayRun} disabled={saving || !form.employeeId || !form.periodStart || !form.periodEnd}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 hover:opacity-90 mt-1"
                    style={{ background: 'var(--primary)' }}>
                    {saving ? 'Saving…' : '✓ Confirm & Save Pay Run'}
                  </button>
                  {(!form.employeeId || !form.periodStart || !form.periodEnd) && (
                    <p className="text-xs text-center text-yellow-500">Fill employee and pay period to save.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payslip Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Payslip</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Employee</span><span className="font-medium text-gray-900 dark:text-white">{selected.employeeFirstName} {selected.employeeLastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Period</span><span className="text-gray-900 dark:text-white">{selected.periodStart} → {selected.periodEnd}</span></div>
              {selected.hoursWorked && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Hours @ Rate</span><span className="text-gray-900 dark:text-white">{selected.hoursWorked}h @ {fmt(selected.hourlyRate)}/hr</span></div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                {[
                  { label: 'Gross Pay',        value: selected.grossPay,        color: 'text-gray-900 dark:text-white font-semibold' },
                  { label: 'PAYG Withholding', value: selected.paygWithholding, color: 'text-red-400' },
                  { label: 'Medicare Levy',    value: selected.medicareLevy,    color: 'text-orange-400' },
                  { label: 'Net Pay',          value: selected.netPay,          color: 'text-green-400 font-bold text-base' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className={row.color}>{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="text-purple-400">Employer Super (11.5%)</span>
                <span className="text-purple-300 font-medium">{fmt(selected.superContribution)}</span>
              </div>
              <div className="pt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[selected.status] ?? ''}`}>{selected.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
