'use client'

import { useEffect, useState } from 'react'

type Shift = { id: string; employeeId: string; startTime: string; endTime: string; location: string | null; clientSite: string | null; status: string; notes: string | null; employeeFirstName: string | null; employeeLastName: string | null }
type Timesheet = { id: string; employeeId: string; shiftId: string | null; clockIn: string; clockOut: string | null; hoursWorked: string | null; status: string; employeeFirstName: string | null; employeeLastName: string | null }
type Stats = { totalShifts: number; pendingShifts: number; confirmedShifts: number; completedShifts: number }
type Employee = { id: string; firstName: string; lastName: string }

const SHIFT_STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-900/50 text-amber-300 border-amber-800',
  confirmed: 'bg-blue-900/50 text-blue-300 border-blue-800',
  completed: 'bg-green-900/50 text-green-300 border-green-800',
  cancelled: 'bg-gray-800 text-gray-500 border-gray-700',
}
const TS_STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-900/50 text-amber-300 border-amber-800',
  approved: 'bg-green-900/50 text-green-300 border-green-800',
  rejected: 'bg-red-900/50 text-red-300 border-red-800',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function RosteringPage() {
  const [shifts,     setShifts]     = useState<Shift[]>([])
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [stats,      setStats]      = useState<Stats>({ totalShifts:0, pendingShifts:0, confirmedShifts:0, completedShifts:0 })
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [loading,    setLoading]    = useState(true)
  const [tab, setTab]               = useState<'shifts'|'timesheets'>('shifts')
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [showTsForm,    setShowTsForm]    = useState(false)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [shiftForm, setShiftForm] = useState({ employeeId:'', startTime:'', endTime:'', location:'', clientSite:'', notes:'' })
  const [tsForm,    setTsForm]    = useState({ employeeId:'', clockIn:'', clockOut:'', notes:'' })

  const load = async () => {
    setLoading(true)
    const [main, ts] = await Promise.all([
      fetch('/api/tenant/rostering').then(r => r.json()),
      fetch('/api/tenant/rostering?view=timesheets').then(r => r.json()),
    ])
    setShifts(main.shifts ?? [])
    setStats(main.stats ?? { totalShifts:0, pendingShifts:0, confirmedShifts:0, completedShifts:0 })
    setTimesheets(ts.timesheets ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function createShift(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/rostering', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(shiftForm) })
    setShowShiftForm(false); setSaving(false); load()
  }

  async function createTimesheet(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/rostering', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _type:'timesheet', ...tsForm }) })
    setShowTsForm(false); setSaving(false); load()
  }

  async function patchShift(id: string, status: string) {
    await fetch('/api/tenant/rostering', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status }) })
    load()
  }

  async function patchTs(id: string, status: string) {
    await fetch('/api/tenant/rostering', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status }) })
    load()
  }

  const fmtDateTime = (s: string) => new Date(s).toLocaleString('en-AU', { dateStyle:'short', timeStyle:'short' })
  const fmtDate     = (s: string) => new Date(s).toLocaleDateString('en-AU')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rostering & Timesheets</h1>
          <p className="text-gray-400 text-sm mt-1">Schedule shifts and manage employee timesheets</p>
        </div>
        <div className="flex gap-2">
          {tab === 'shifts' && (
            <button onClick={() => { setShowShiftForm(v => !v); setShowTsForm(false) }}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
              {showShiftForm ? 'Cancel' : '+ Add Shift'}
            </button>
          )}
          {tab === 'timesheets' && (
            <button onClick={() => { setShowTsForm(v => !v); setShowShiftForm(false) }}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
              {showTsForm ? 'Cancel' : '+ Log Timesheet'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total Shifts',     value:stats.totalShifts,     color:'text-white' },
          { label:'Pending',          value:stats.pendingShifts,   color:'text-amber-400' },
          { label:'Confirmed',        value:stats.confirmedShifts, color:'text-blue-400' },
          { label:'Completed',        value:stats.completedShifts, color:'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-gray-800">
        {(['shifts','timesheets'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize ${tab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t === 'shifts' ? `📅 Shifts (${shifts.length})` : `⏱ Timesheets (${timesheets.length})`}
          </button>
        ))}
      </div>

      {showShiftForm && (
        <form onSubmit={createShift} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={shiftForm.employeeId} onChange={e => setShiftForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Location</label>
              <input value={shiftForm.location} onChange={e => setShiftForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Head Office" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start *</label>
              <input required type="datetime-local" value={shiftForm.startTime} onChange={e => setShiftForm(f => ({ ...f, startTime: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End *</label>
              <input required type="datetime-local" value={shiftForm.endTime} onChange={e => setShiftForm(f => ({ ...f, endTime: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Client Site</label>
              <input value={shiftForm.clientSite} onChange={e => setShiftForm(f => ({ ...f, clientSite: e.target.value }))} placeholder="NDIS participant / property" className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Create Shift'}
          </button>
        </form>
      )}

      {showTsForm && (
        <form onSubmit={createTimesheet} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={tsForm.employeeId} onChange={e => setTsForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Clock In *</label>
              <input required type="datetime-local" value={tsForm.clockIn} onChange={e => setTsForm(f => ({ ...f, clockIn: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Clock Out</label>
              <input type="datetime-local" value={tsForm.clockOut} onChange={e => setTsForm(f => ({ ...f, clockOut: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Log Timesheet'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <>
          {tab === 'shifts' && (
            shifts.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-gray-300 font-medium">No shifts scheduled</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Employee','Start','End','Location / Site','Status',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {shifts.map(s => (
                      <tr key={s.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-200">{s.employeeFirstName} {s.employeeLastName}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmtDateTime(s.startTime)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmtDateTime(s.endTime)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {[s.location, s.clientSite].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${SHIFT_STATUS_STYLE[s.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {s.status === 'pending' && (
                              <button onClick={() => patchShift(s.id, 'confirmed')}
                                className="text-xs bg-blue-900/30 border border-blue-800 text-blue-300 hover:bg-blue-900/50 px-2 py-1 rounded transition">
                                Confirm
                              </button>
                            )}
                            {s.status === 'confirmed' && (
                              <button onClick={() => patchShift(s.id, 'completed')}
                                className="text-xs bg-green-900/30 border border-green-800 text-green-300 hover:bg-green-900/50 px-2 py-1 rounded transition">
                                Complete
                              </button>
                            )}
                            {(s.status === 'pending' || s.status === 'confirmed') && (
                              <button onClick={() => patchShift(s.id, 'cancelled')}
                                className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 px-2 py-1 rounded transition">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'timesheets' && (
            timesheets.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
                <p className="text-4xl mb-3">⏱</p>
                <p className="text-gray-300 font-medium">No timesheets logged</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Employee','Clock In','Clock Out','Hours','Status',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {timesheets.map(t => (
                      <tr key={t.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-200">{t.employeeFirstName} {t.employeeLastName}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmtDateTime(t.clockIn)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{t.clockOut ? fmtDateTime(t.clockOut) : <span className="text-amber-400">In progress</span>}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">{t.hoursWorked ? `${Number(t.hoursWorked).toFixed(1)}h` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${TS_STATUS_STYLE[t.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => patchTs(t.id, 'approved')}
                                className="text-xs bg-green-900/30 border border-green-800 text-green-300 hover:bg-green-900/50 px-2 py-1 rounded transition">
                                Approve
                              </button>
                              <button onClick={() => patchTs(t.id, 'rejected')}
                                className="text-xs bg-red-900/30 border border-red-800 text-red-300 hover:bg-red-900/50 px-2 py-1 rounded transition">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
