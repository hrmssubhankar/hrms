'use client'

import { useState, useEffect, useCallback } from 'react'

type Contract = {
  id:string; employeeId:string; type:string; status:string
  sentAt:string|null; signedAt:string|null; tfnProvided:boolean; superFund:string|null; createdAt:string
  firstName:string|null; lastName:string|null; email:string|null; employmentType:string|null
}
type Stats = { total:number; draft:number; sent:number; signed:number; expired:number }
type Employee = { id:string; firstName:string; lastName:string }

const STATUS_COLORS: Record<string,string> = {
  draft:'bg-gray-100 text-gray-600', sent:'bg-blue-100 text-blue-700',
  signed:'bg-green-100 text-green-700', expired:'bg-red-100 text-red-700',
}

const CONTRACT_TYPES = ['employment','casual','contractor','volunteer','fixed_term']

export default function ContractingPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [stats, setStats]         = useState<Stats>({ total:0,draft:0,sent:0,signed:0,expired:0 })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected]   = useState<Contract|null>(null)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [search, setSearch]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ employeeId:'', type:'employment' })

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (search)       p.set('search', search)
    const res = await fetch(`/api/tenant/contracting?${p}`)
    if (res.ok) { const d = await res.json(); setContracts(d.contracts ?? []); setStats(d.stats ?? {}) }
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/tenant/employees?limit=200').then(r => r.json()).then(d => setEmployees(d.employees ?? []))
  }, [])

  async function create() {
    setSaving(true)
    await fetch('/api/tenant/contracting', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowCreate(false); setSaving(false); load()
  }

  async function patch(id:string, updates:Record<string,unknown>) {
    await fetch('/api/tenant/contracting', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,...updates}) })
    load(); if(selected?.id===id) setSelected(s=>s?{...s,...updates as any}:s)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contracting</h1>
          <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">Employment contracts — draft, send, track signatures</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">+ New Contract</button>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 dark:bg-gray-800 dark:border-gray-800">
        {[{label:'Total',value:stats.total,cls:'text-gray-900'},{label:'Draft',value:stats.draft,cls:'text-gray-500'},{label:'Sent',value:stats.sent,cls:'text-blue-600'},{label:'Signed',value:stats.signed,cls:'text-green-600'},{label:'Expired',value:stats.expired,cls:'text-red-600'}].map(s=>(
          <div key={s.label} className="text-center"><p className={`text-xl font-bold ${s.cls}`}>{s.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p></div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white dark:bg-gray-900 dark:border-gray-700">
          <div className="p-3 border-b border-gray-100 space-y-2 dark:border-gray-800">
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm dark:border-gray-700" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs dark:border-gray-700" value={statusFilter} onChange={e=>setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['draft','sent','signed','expired'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-gray-600 dark:text-gray-400">Loading…</p> : contracts.length===0 ? <p className="p-6 text-sm text-gray-600 dark:text-gray-400 text-center">No contracts</p> : contracts.map(c=>(
              <button key={c.id} onClick={()=>setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition  dark:border-gray-800${selected?.id===c.id?'bg-brand-50 border-l-2 border-l-brand-500':''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{c.type.replace(/_/g,' ')}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[c.status]??''}`}>{c.status}</span>
                </div>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="flex-1 p-6 overflow-y-auto bg-white space-y-5 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selected.firstName} {selected.lastName}</h2>
                <p className="text-sm text-gray-500 capitalize dark:text-gray-400">{selected.type.replace(/_/g,' ')} contract</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]??''}`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={selected.status}
                  onChange={e=>{patch(selected.id,{status:e.target.value});setSelected({...selected,status:e.target.value})}}>
                  {['draft','sent','signed','expired'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Super Fund</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" defaultValue={selected.superFund??''} onBlur={e=>patch(selected.id,{superFund:e.target.value||null})}/>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer dark:text-gray-300">
                <input type="checkbox" checked={selected.tfnProvided} onChange={e=>{patch(selected.id,{tfnProvided:e.target.checked});setSelected({...selected,tfnProvided:e.target.checked})}}/>
                TFN Provided
              </label>
            </div>

            {selected.sentAt && <p className="text-xs text-gray-600 dark:text-gray-400">Sent: {new Date(selected.sentAt).toLocaleString()}</p>}
            {selected.signedAt && <p className="text-xs text-green-600 font-medium">Signed: {new Date(selected.signedAt).toLocaleString()}</p>}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">PDF upload and e-signature is available — contact support to enable DocuSign / Adobe Sign integration.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">Select a contract to view details</div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">New Contract</h3>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}>
                <option value="">Select employee *</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {CONTRACT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 dark:text-gray-400 dark:border-gray-700">Cancel</button>
              <button onClick={create} disabled={saving||!form.employeeId} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving?'Creating…':'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
