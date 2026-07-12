'use client'

import { useEffect, useState } from 'react'

type Payslip = {
  id:                string
  periodStart:       string
  periodEnd:         string
  grossPay:          string | null
  paygWithholding:   string | null
  medicareLevy:      string | null
  superContribution: string | null
  netPay:            string | null
  status:            string
  exportedToXero:    boolean
  createdAt:         string
}

type Employee = {
  id:        string
  firstName: string
  lastName:  string
  email:     string
}

const fmt = (n: number | string | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  approved: 'bg-blue-900/40 text-blue-300 border-blue-800',
  paid:     'bg-green-900/40 text-green-300 border-green-800',
}

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [linked,   setLinked]   = useState(true)
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tenant/my-payslips')
      .then(r => r.json())
      .then(d => {
        setLinked(d.employeeLinked)
        setPayslips(d.payslips ?? [])
        setEmployee(d.employee ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  function fmtDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">💵</div>
          <p className="text-sm">Loading your payslips…</p>
        </div>
      </div>
    )
  }

  if (!linked) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-5xl mb-4">🔗</p>
          <h2 className="text-lg font-semibold text-white mb-2">Profile Not Linked</h2>
          <p className="text-gray-400 text-sm">
            Your user account is not yet linked to an employee record.
            Contact your HR administrator to set this up before you can view payslips.
          </p>
        </div>
      </div>
    )
  }

  const totalPaid   = payslips.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.netPay ?? 0), 0)
  const totalGross  = payslips.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.grossPay ?? 0), 0)
  const totalSuper  = payslips.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.superContribution ?? 0), 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">💵 My Payslips</h1>
        {employee && (
          <p className="text-sm text-gray-400 mt-0.5">
            {employee.firstName} {employee.lastName} · {employee.email}
          </p>
        )}
      </div>

      {/* Summary stats */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Pay Runs</p>
            <p className="text-xl font-bold text-white mt-0.5">{payslips.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">Net Received (Paid)</p>
            <p className="text-xl font-bold text-green-400 mt-0.5">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">Super Accumulated</p>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{fmt(totalSuper)}</p>
          </div>
        </div>
      )}

      {/* Payslip list */}
      {payslips.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-400 font-medium">No payslips yet</p>
          <p className="text-sm text-gray-600 mt-1">Your pay runs will appear here once they are processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map(p => {
            const isOpen = expanded === p.id
            return (
              <div
                key={p.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
              >
                {/* Summary row — click to expand */}
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/40 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Created {fmtDate(p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{fmt(p.netPay)}</p>
                      <p className="text-xs text-gray-500">net pay</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {p.status}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded payslip breakdown */}
                {isOpen && (
                  <div className="border-t border-gray-800 px-5 py-4 space-y-2">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross Pay</span>
                        <span className="text-white font-mono">{fmt(p.grossPay)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PAYG Withholding</span>
                        <span className="text-red-400 font-mono">-{fmt(p.paygWithholding)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Medicare Levy</span>
                        <span className="text-orange-400 font-mono">-{fmt(p.medicareLevy)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Superannuation</span>
                        <span className="text-purple-400 font-mono">{fmt(p.superContribution)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-800 pt-2 flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Net Pay</span>
                      <span className="text-green-400 font-bold font-mono text-base">{fmt(p.netPay)}</span>
                    </div>
                    {p.exportedToXero && (
                      <p className="text-xs text-[#13B5EA] mt-1">✓ Exported to Xero</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {payslips.length > 0 && (
        <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-400 mb-1">Year-to-Date Summary (Paid runs)</p>
          <div className="flex gap-6">
            <span>Gross: <span className="text-white">{fmt(totalGross)}</span></span>
            <span>Net: <span className="text-green-400">{fmt(totalPaid)}</span></span>
            <span>Super: <span className="text-purple-400">{fmt(totalSuper)}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}
