'use client'

import { useEffect, useState } from 'react'

type PayrollRecord = {
  id: string; employeeId: string; periodStart: string; periodEnd: string
  grossPay: string; netPay: string | null; tax: string | null; superContribution: string | null
  status: string; paymentDate: string | null; exportedToXero: boolean; exportedAt: string | null
  createdAt: string; employeeFirstName: string | null; employeeLastName: string | null
}
type Stats = { total: number; pending: number; approved: number; paid: number; totalGross: string }
type Employee = { id: string; firstName: string; lastName: string }

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-900/50 text-amber-300 border-amber-800',
  approved: 'bg-blue-900/50 text-blue-300 border-blue-800',
  paid:     'bg-green-900/50 text-green-300 border-green-800',
  cancelled:'bg-gray-800 text-gray-500 border-gray-700',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function PayrollPage() {
  const [records,   setRecords]   = useState<PayrollRecord[]>([])
  const [stats,     setStats]     = useState<Stats>({ total:0, pending:0, approved:0, paid:0, totalGross:'0.00' })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [form, setForm] = useState({
    employeeId:'', periodStart:'', periodEnd:'', grossPay:'', netPay:'', tax:'', superContribution:''
  })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/payroll').then(r => r.json())
    setRecords(data.records ?? [])
    setStats(data.stats ?? { total:0, pending:0, approved:0, paid:0, totalGross:'0.00' })
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/payroll', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch('/api/tenant/payroll', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, ...body }) })
    load()
  }

  const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-AU')
  const fmtMoney = (n: string | null) => n ? `$${Number(n).toLocaleString('en-AU', { minimumFractionDigits:2, maximumFractionDigits:2 })}` : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-gray-400 text-sm mt-1">Manage pay periods, approve payroll, and export to Xero</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ New Record'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label:'Total Records', value: stats.total.toString(), color:'text-white' },
          { label:'Pending',       value: stats.pending.toString(), color:'text-amber-400' },
          { label:'Approved',      value: stats.approved.toString(), color:'text-blue-400' },
          { label:'Paid',          value: stats.paid.toString(), color:'text-green-400' },
          { label:'Total Gross',   value: `$${Number(stats.totalGross).toLocaleString('en-AU', { minimumFractionDigits:2 })}`, color:'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Period Start *</label>
              <input required type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Period End *</label>
              <input required type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Gross Pay ($) *</label>
              <input required type="number" step="0.01" min="0" value={form.grossPay} onChange={e => setForm(f => ({ ...f, grossPay: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Net Pay ($)</label>
              <input type="number" step="0.01" min="0" value={form.netPay} onChange={e => setForm(f => ({ ...f, netPay: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tax Withheld ($)</label>
              <input type="number" step="0.01" min="0" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Super Contribution ($)</label>
              <input type="number" step="0.01" min="0" value={form.superContribution} onChange={e => setForm(f => ({ ...f, superContribution: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Create Record'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : records.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-gray-300 font-medium">No payroll records yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const open = expanded === r.id
            return (
              <div key={r.id} className={`bg-gray-900 border rounded-xl overflow-hidden transition ${open ? 'border-purple-700' : 'border-gray-800'}`}>
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(open ? null : r.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-medium text-sm">{r.employeeFirstName} {r.employeeLastName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>{r.status}</span>
                      {r.exportedToXero && <span className="text-xs text-blue-400 bg-blue-900/30 border border-blue-800 px-2 py-0.5 rounded-full">Xero ✓</span>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                      <span className="ml-3 text-gray-300 font-medium">{fmtMoney(r.grossPay)} gross</span>
                    </p>
                  </div>
                  <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
                </div>

                {open && (
                  <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-xs text-gray-500 mb-0.5">Gross</p><p className="text-white font-medium">{fmtMoney(r.grossPay)}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Net</p><p className="text-white font-medium">{fmtMoney(r.netPay)}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Tax</p><p className="text-white font-medium">{fmtMoney(r.tax)}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Super</p><p className="text-white font-medium">{fmtMoney(r.superContribution)}</p></div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {r.status === 'pending' && (
                        <button onClick={() => patch(r.id, { status:'approved' })}
                          className="text-xs bg-blue-900/40 border border-blue-800 text-blue-300 hover:bg-blue-900/60 px-3 py-1.5 rounded transition">
                          Approve
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => patch(r.id, { status:'paid', paymentDate: new Date().toISOString().split('T')[0] })}
                          className="text-xs bg-green-900/40 border border-green-800 text-green-300 hover:bg-green-900/60 px-3 py-1.5 rounded transition">
                          Mark Paid
                        </button>
                      )}
                      {r.status === 'paid' && !r.exportedToXero && (
                        <button onClick={() => patch(r.id, { exportedToXero: true })}
                          className="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 hover:bg-blue-600/50 px-3 py-1.5 rounded transition">
                          Export to Xero
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button onClick={() => patch(r.id, { status:'cancelled' })}
                          className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 px-3 py-1.5 rounded transition">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
