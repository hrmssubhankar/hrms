'use client'

import { useState, useEffect, useCallback } from 'react'
import PermissionGate from '@/components/auth/PermissionGate'

// ── Types ──────────────────────────────────────────────────────────────────────

type Shift = {
  id: string
  employeeId: string
  participantId: string | null
  startTime: string
  endTime: string
  shiftType: string | null
  location: string | null
  clientSite: string | null
  status: string
  publishedAt: string | null
  notes: string | null
  empFirst: string | null
  empLast: string | null
  empEmail: string | null
  partFirst: string | null
  partLast: string | null
  partNdis: string | null
}

type Employee = {
  id: string
  firstName: string
  lastName: string
  employmentType: string
}

type Participant = {
  id: string
  firstName: string
  lastName: string
  ndisNumber: string | null
}

type ShiftFormData = {
  employeeId: string
  participantId: string
  date: string
  startHour: string
  startMin: string
  endHour: string
  endMin: string
  shiftType: string
  location: string
  clientSite: string
  notes: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHIFT_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  standard:     { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-800 dark:text-blue-200',    border: 'border-blue-300 dark:border-blue-600' },
  sleepover:    { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-600' },
  active_night: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-600' },
  on_call:      { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-800 dark:text-amber-200',   border: 'border-amber-300 dark:border-amber-600' },
}

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  completed: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function shiftDuration(start: string, end: string) {
  const hrs = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000
  return `${hrs.toFixed(1)}h`
}

// ── Shift modal ────────────────────────────────────────────────────────────────

function ShiftModal({
  mode, initialData, employees, participants, onSave, onDelete, onClose,
}: {
  mode: 'create' | 'edit'
  initialData: Partial<ShiftFormData> & { id?: string }
  employees: Employee[]
  participants: Participant[]
  onSave: (data: ShiftFormData & { id?: string }) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ShiftFormData>({
    employeeId:    initialData.employeeId    ?? '',
    participantId: initialData.participantId ?? '',
    date:          initialData.date          ?? isoDate(new Date()),
    startHour:     initialData.startHour     ?? '09',
    startMin:      initialData.startMin      ?? '00',
    endHour:       initialData.endHour       ?? '17',
    endMin:        initialData.endMin        ?? '00',
    shiftType:     initialData.shiftType     ?? 'standard',
    location:      initialData.location      ?? '',
    clientSite:    initialData.clientSite    ?? '',
    notes:         initialData.notes         ?? '',
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  const f = (k: keyof ShiftFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.employeeId) { setError('Please select an employee'); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...form, id: initialData.id })
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete || !confirm('Delete this shift?')) return
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const mins  = ['00', '15', '30', '45']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Add Shift' : 'Edit Shift'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Employee *</label>
            <select value={form.employeeId} onChange={f('employeeId')} required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">NDIS Participant</label>
            <select value={form.participantId} onChange={f('participantId')}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
              <option value="">No participant linked</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}{p.ndisNumber ? ` (${p.ndisNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Date *</label>
              <input type="date" value={form.date} onChange={f('date')} required
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Shift Type</label>
              <select value={form.shiftType} onChange={f('shiftType')}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
                <option value="standard">Standard</option>
                <option value="sleepover">Sleepover</option>
                <option value="active_night">Active Night</option>
                <option value="on_call">On-Call</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Start</label>
              <div className="flex gap-1">
                <select value={form.startHour} onChange={f('startHour')}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
                  {hours.map(h => <option key={h}>{h}</option>)}
                </select>
                <span className="self-center text-gray-400 text-sm">:</span>
                <select value={form.startMin} onChange={f('startMin')}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
                  {mins.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">End</label>
              <div className="flex gap-1">
                <select value={form.endHour} onChange={f('endHour')}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
                  {hours.map(h => <option key={h}>{h}</option>)}
                </select>
                <span className="self-center text-gray-400 text-sm">:</span>
                <select value={form.endMin} onChange={f('endMin')}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none">
                  {mins.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Location</label>
              <input type="text" value={form.location} onChange={f('location')} placeholder="Site / address"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Client Site</label>
              <input type="text" value={form.clientSite} onChange={f('clientSite')} placeholder="Property name"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide dark:text-gray-400">Notes</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Care instructions, special notes…"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            {mode === 'edit' && onDelete && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add Shift' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RosteringPage() {
  const [weekStart,    setWeekStart]    = useState<Date>(getMondayOf(new Date()))
  const [shifts,       setShifts]       = useState<Shift[]>([])
  const [employees,    setEmployees]    = useState<Employee[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading,      setLoading]      = useState(true)
  const [publishing,   setPublishing]   = useState(false)
  const [modal, setModal] = useState<{
    mode: 'create' | 'edit'
    data: Partial<ShiftFormData> & { id?: string }
  } | null>(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const empMap = new Map<string, Employee>()
  employees.forEach(e => empMap.set(e.id, e))

  const empIdsInWeek = [...new Set(shifts.map(s => s.employeeId))]
  const visibleEmployees = empIdsInWeek
    .map(id => {
      const fromApi = empMap.get(id)
      if (fromApi) return fromApi
      const s = shifts.find(x => x.employeeId === id)
      return { id, firstName: s?.empFirst ?? '?', lastName: s?.empLast ?? '', employmentType: '' }
    })
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sd, ed, pd] = await Promise.all([
        fetch(`/api/tenant/roster/shifts?weekStart=${isoDate(weekStart)}`).then(r => r.json()),
        fetch('/api/tenant/employees?limit=200&status=active').then(r => r.json()),
        fetch('/api/tenant/participants').then(r => r.json()),
      ])
      setShifts(sd.shifts ?? [])
      setEmployees(ed.employees ?? [])
      setParticipants(pd.participants ?? [])
    } catch {
      setShifts([])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { fetchData() }, [fetchData])

  const draftCount  = shifts.filter(s => s.status === 'draft').length
  const totalHours  = shifts.reduce((sum, s) =>
    sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3_600_000, 0)

  async function publishAll() {
    if (!confirm(`Publish ${draftCount} draft shift${draftCount !== 1 ? 's' : ''}? Employees will be notified.`)) return
    setPublishing(true)
    try {
      const drafts = shifts.filter(s => s.status === 'draft')
      await Promise.all(drafts.map(s =>
        fetch(`/api/tenant/roster/shifts/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publish: true }),
        })
      ))
      await fetchData()
    } finally { setPublishing(false) }
  }

  function openCreate(date: Date, employeeId?: string) {
    setModal({ mode: 'create', data: {
      date: isoDate(date), startHour: '09', startMin: '00',
      endHour: '17', endMin: '00', employeeId: employeeId ?? '', shiftType: 'standard',
    }})
  }

  function openEdit(shift: Shift) {
    const s = new Date(shift.startTime)
    const e = new Date(shift.endTime)
    setModal({ mode: 'edit', data: {
      id: shift.id,
      employeeId: shift.employeeId, participantId: shift.participantId ?? '',
      date: isoDate(s),
      startHour: String(s.getHours()).padStart(2,'0'), startMin: String(s.getMinutes()).padStart(2,'0'),
      endHour:   String(e.getHours()).padStart(2,'0'), endMin:   String(e.getMinutes()).padStart(2,'0'),
      shiftType: shift.shiftType ?? 'standard',
      location: shift.location ?? '', clientSite: shift.clientSite ?? '', notes: shift.notes ?? '',
    }})
  }

  async function handleSave(data: ShiftFormData & { id?: string }) {
    const startTime = `${data.date}T${data.startHour}:${data.startMin}:00`
    const endTime   = `${data.date}T${data.endHour}:${data.endMin}:00`
    const payload   = {
      employeeId: data.employeeId, participantId: data.participantId || null,
      startTime, endTime,
      shiftType: data.shiftType, location: data.location || null,
      clientSite: data.clientSite || null, notes: data.notes || null,
    }
    if (data.id) {
      await fetch(`/api/tenant/roster/shifts/${data.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/tenant/roster/shifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    }
    setModal(null)
    await fetchData()
  }

  async function handleDelete() {
    if (!modal?.data.id) return
    await fetch(`/api/tenant/roster/shifts/${modal.data.id}`, { method: 'DELETE' })
    setModal(null)
    await fetchData()
  }

  function getShiftsFor(empId: string, day: Date) {
    const d = isoDate(day)
    return shifts.filter(s => s.employeeId === empId && s.startTime.startsWith(d))
  }

  return (
    <div className="space-y-5">
      {modal && (
        <ShiftModal
          mode={modal.mode} initialData={modal.data}
          employees={employees} participants={participants}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roster</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {fmtDate(weekStart)} — {fmtDate(addDays(weekStart, 6))}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setWeekStart(w => addDays(w, -7))}
              className="px-3 py-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm dark:text-gray-400">←</button>
            <button onClick={() => setWeekStart(getMondayOf(new Date()))}
              className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-x border-gray-200 dark:border-gray-700 transition">
              Today
            </button>
            <button onClick={() => setWeekStart(w => addDays(w, 7))}
              className="px-3 py-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm dark:text-gray-400">→</button>
          </div>
          <PermissionGate permission="rostering:write">
            <>
              {draftCount > 0 && (
                <button onClick={publishAll} disabled={publishing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition">
                  {publishing ? 'Publishing…' : `Publish ${draftCount} draft${draftCount !== 1 ? 's' : ''}`}
                </button>
              )}
              <button onClick={() => openCreate(weekStart)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)' }}>
                + Add Shift
              </button>
            </>
          </PermissionGate>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Shifts',      value: shifts.length,                                        color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Total hours', value: `${totalHours.toFixed(1)}h`,                          color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Draft',       value: draftCount,                                           color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Published',   value: shifts.filter(s => s.status === 'published').length,  color: 'text-green-600 dark:text-green-400' },
          { label: 'Staff',       value: new Set(shifts.map(s => s.employeeId)).size,          color: 'text-gray-700 dark:text-gray-300' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className={`text-lg font-bold ${c.color}`}>{c.value}</span>
            <span className="text-xs text-gray-400">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading roster…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[860px]">
              <thead>
                <tr>
                  <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-100 dark:border-gray-700">
                    Employee
                  </th>
                  {weekDays.map((day, i) => {
                    const isToday = isoDate(day) === isoDate(new Date())
                    return (
                      <th key={i} className={`px-2 py-3 text-center bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 ${i < 6 ? 'border-r border-gray-100 dark:border-gray-700' : ''}`}>
                        <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {DAYS[i]}
                        </div>
                        <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {day.getDate()}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visibleEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">
                      No shifts this week.{' '}
                      <PermissionGate permission="rostering:write">
                        <button onClick={() => openCreate(weekStart)} className="text-blue-500 hover:underline">
                          Add the first shift →
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ) : visibleEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition">
                    <td className="px-4 py-2 border-r border-gray-100 dark:border-gray-700 w-36">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{emp.firstName}</p>
                          <p className="text-xs text-gray-400 truncate">{emp.lastName}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day, di) => {
                      const dayShifts = getShiftsFor(emp.id, day)
                      return (
                        <td key={di} className={`px-1 py-1 align-top min-w-[110px] ${di < 6 ? 'border-r border-gray-100 dark:border-gray-700' : ''}`}>
                          <div className="space-y-1 min-h-14">
                            {dayShifts.map(shift => {
                              const c = SHIFT_COLOURS[shift.shiftType ?? 'standard'] ?? SHIFT_COLOURS.standard
                              return (
                                <button key={shift.id} onClick={() => openEdit(shift)}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs transition hover:opacity-80 ${c.bg} ${c.text} ${c.border}`}>
                                  <div className="font-semibold">{fmtTime(shift.startTime)}–{fmtTime(shift.endTime)}</div>
                                  <div className="opacity-70">
                                    {shiftDuration(shift.startTime, shift.endTime)}
                                    {shift.shiftType && shift.shiftType !== 'standard' && ` · ${shift.shiftType.replace(/_/g,' ')}`}
                                  </div>
                                  {shift.partFirst && <div className="opacity-70 truncate">{shift.partFirst} {shift.partLast}</div>}
                                  <span className={`inline-block mt-0.5 px-1.5 py-px rounded text-[10px] font-medium ${STATUS_BADGE[shift.status] ?? STATUS_BADGE.draft}`}>
                                    {shift.status}
                                  </span>
                                </button>
                              )
                            })}
                            <PermissionGate permission="rostering:write">
                              <button onClick={() => openCreate(day, emp.id)}
                                className="w-full py-1 text-[11px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                + add
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(SHIFT_COLOURS).map(([type, c]) => (
          <span key={type} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
            {type.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}
