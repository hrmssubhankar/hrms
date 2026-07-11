'use client'

import { useEffect, useState } from 'react'

type Benefit = {
  id: string; employeeId: string; type: string; description: string | null
  startDate: string | null; endDate: string | null; notes: string | null; createdAt: string
  employeeFirstName: string | null; employeeLastName: string | null
}
type Employee = { id: string; firstName: string; lastName: string }

const BENEFIT_TYPES = [
  { value: 'eap',            label: '🧠 Employee Assistance Program' },
  { value: 'study_support',  label: '📚 Study Support' },
  { value: 'discount',       label: '🏷 Employee Discount' },
  { value: 'wellbeing',      label: '💚 Wellbeing Allowance' },
  { value: 'salary_packaging', label: '💼 Salary Packaging' },
  { value: 'extra_leave',    label: '🏖 Extra Leave' },
  { value: 'flexible_work',  label: '🏠 Flexible Work' },
  { value: 'other',          label: '✨ Other' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function BenefitsPage() {
  const [benefits,  setBenefits]  = useState<Benefit[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [filterEmp, setFilterEmp] = useState('')
  const [form, setForm] = useState({ employeeId:'', type:'eap', description:'', startDate:'', endDate:'', notes:'' })

  const load = async (empId = filterEmp) => {
    setLoading(true)
    const p = empId ? `?employeeId=${empId}` : ''
    const data = await fetch(`/api/tenant/benefits${p}`).then(r => r.json())
    setBenefits(data.benefits ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/benefits', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false); setSaving(false); load()
  }

  async function remove(id: string) {
    await fetch('/api/tenant/benefits', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Benefits</h1>
          <p className="text-gray-400 text-sm mt-1">Track benefits, entitlements, and support programs assigned to employees</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Assign Benefit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Benefit Type *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                {BENEFIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Details of the benefit…" className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Assign Benefit'}
          </button>
        </form>
      )}

      <select value={filterEmp} onChange={e => { setFilterEmp(e.target.value); load(e.target.value) }}
        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
        <option value="">All employees</option>
        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </select>

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : benefits.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-gray-300 font-medium">No benefits assigned</p>
        </div>
      ) : (
        <div className="space-y-2">
          {benefits.map(b => (
            <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-medium text-sm">{b.employeeFirstName} {b.employeeLastName}</span>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                    {BENEFIT_TYPES.find(t => t.value === b.type)?.label ?? b.type}
                  </span>
                </div>
                {b.description && <p className="text-xs text-gray-400">{b.description}</p>}
                {(b.startDate || b.endDate) && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {b.startDate && new Date(b.startDate + 'T00:00:00').toLocaleDateString('en-AU')}
                    {b.endDate && ` → ${new Date(b.endDate + 'T00:00:00').toLocaleDateString('en-AU')}`}
                  </p>
                )}
              </div>
              <button onClick={() => remove(b.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1 rounded border border-transparent hover:border-red-800">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
