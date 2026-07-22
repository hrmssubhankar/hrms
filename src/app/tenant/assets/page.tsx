'use client'

import { useEffect, useState } from 'react'

type Asset = { id: string; name: string; category: string; serialNumber: string | null; status: string; notes: string | null; createdAt: string }
type Assignment = { id: string; assetId: string; employeeId: string; issuedAt: string; returnedAt: string | null; condition: string | null; notes: string | null; employeeFirstName: string | null; employeeLastName: string | null }
type Stats = { total: number; available: number; assigned: number; retired: number }
type Employee = { id: string; firstName: string; lastName: string }

const ASSET_CATEGORIES = ['Laptop','Phone','Uniform','PPE','Keys','Access Card','Vehicle','Tool','Other']
const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-900/50 text-green-300 border-green-800',
  assigned:  'bg-blue-900/50 text-blue-300 border-blue-800',
  retired:   'bg-gray-800 text-gray-400 border-gray-700',
  maintenance:'bg-amber-900/50 text-amber-300 border-amber-800',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function AssetsPage() {
  const [assets,      setAssets]      = useState<Asset[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats,       setStats]       = useState<Stats>({ total:0, available:0, assigned:0, retired:0 })
  const [employees,   setEmployees]   = useState<Employee[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab, setTab]                 = useState<'assets'|'assignments'>('assets')
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [assetForm, setAssetForm] = useState({ name:'', category:'Laptop', serialNumber:'', notes:'' })
  const [assignForm, setAssignForm] = useState({ employeeId:'', condition:'good', notes:'' })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/assets').then(r => r.json())
    setAssets(data.assets ?? [])
    setAssignments(data.assignments ?? [])
    setStats(data.stats ?? { total:0, available:0, assigned:0, retired:0 })
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/tenant/employees?status=active&limit=500').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function createAsset(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/assets', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(assetForm) })
    setShowAssetForm(false); setSaving(false); load()
  }

  async function assign(assetId: string) {
    setSaving(true)
    await fetch('/api/tenant/assets', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ _type:'assignment', assetId, ...assignForm }) })
    setShowAssignForm(null); setAssignForm({ employeeId:'', condition:'good', notes:'' }); setSaving(false); load()
  }

  async function returnAsset(assignmentId: string) {
    await fetch('/api/tenant/assets', { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: assignmentId, _type:'return' }) })
    load()
  }

  async function retire(id: string) {
    await fetch('/api/tenant/assets', { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, status:'retired' }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Asset Management</h1>
          <p className="text-gray-400 text-sm mt-1">Track equipment, uniforms, and PPE assigned to employees</p>
        </div>
        {tab === 'assets' && (
          <button onClick={() => setShowAssetForm(v => !v)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
            {showAssetForm ? 'Cancel' : '+ Add Asset'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total',     value:stats.total,     color:'text-white' },
          { label:'Available', value:stats.available, color:'text-green-400' },
          { label:'Assigned',  value:stats.assigned,  color:'text-blue-400' },
          { label:'Retired',   value:stats.retired,   color:'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-gray-800">
        {(['assets','assignments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize ${tab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t === 'assets' ? `Asset Register (${assets.length})` : `Assignments (${assignments.filter(a => !a.returnedAt).length} active)`}
          </button>
        ))}
      </div>

      {showAssetForm && tab === 'assets' && (
        <form onSubmit={createAsset} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input required value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category *</label>
              <select value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))} className={INPUT}>
                {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Serial Number</label>
              <input value={assetForm.serialNumber} onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Saving…' : 'Add Asset'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <>
          {tab === 'assets' && (
            assets.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
                <p className="text-gray-300 font-medium">No assets registered</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Asset','Category','Serial','Status',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {assets.map(a => (
                      <tr key={a.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-200">{a.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{a.category}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{a.serialNumber ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {a.status === 'available' && (
                              <>
                                <button onClick={() => setShowAssignForm(a.id)}
                                  className="text-xs bg-blue-900/30 border border-blue-800 text-blue-300 hover:bg-blue-900/50 px-2 py-1 rounded transition">
                                  Assign
                                </button>
                                <button onClick={() => retire(a.id)}
                                  className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 px-2 py-1 rounded transition">
                                  Retire
                                </button>
                              </>
                            )}
                          </div>
                          {showAssignForm === a.id && (
                            <div className="mt-2 bg-gray-800 rounded-lg p-3 space-y-2">
                              <select value={assignForm.employeeId} onChange={e => setAssignForm(f => ({ ...f, employeeId: e.target.value }))} className={INPUT}>
                                <option value="">— Select employee —</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                              </select>
                              <div className="flex gap-2">
                                <button onClick={() => assign(a.id)} disabled={!assignForm.employeeId || saving}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded transition">
                                  Confirm
                                </button>
                                <button onClick={() => setShowAssignForm(null)}
                                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5">Cancel</button>
                              </div>
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

          {tab === 'assignments' && (
            <div className="space-y-2">
              {assignments.filter(a => !a.returnedAt).map(a => {
                const asset = assets.find(x => x.id === a.assetId)
                return (
                  <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{asset?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{asset?.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        → {a.employeeFirstName} {a.employeeLastName} · Issued {new Date(a.issuedAt).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                    <button onClick={() => returnAsset(a.id)}
                      className="text-xs bg-amber-900/40 border border-amber-800 text-amber-300 hover:bg-amber-900/60 px-3 py-1.5 rounded transition">
                      Return
                    </button>
                  </div>
                )
              })}
              {assignments.filter(a => !a.returnedAt).length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl py-10 text-center">
                  <p className="text-gray-500 text-sm">No active assignments</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
