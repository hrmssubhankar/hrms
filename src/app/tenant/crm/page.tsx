'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

// ─── Types ───────────────────────────────────────────────────────────────────

type Lead = {
  id: string; firstName: string; lastName: string | null; email: string | null
  phone: string | null; company: string | null; jobTitle: string | null
  source: string | null; status: string; stage: string; score: number | null
  assignedTo: string | null; notes: string | null; createdAt: string
}

type Contact = {
  id: string; firstName: string; lastName: string | null; email: string | null
  phone: string | null; jobTitle: string | null; accountId: string | null
  assignedTo: string | null; createdAt: string
}

type Account = {
  id: string; name: string; industry: string | null; website: string | null
  phone: string | null; email: string | null; city: string | null
  country: string | null; type: string | null; status: string | null
  assignedTo: string | null; createdAt: string
}

type Deal = {
  id: string; title: string; value: string | null; currency: string | null
  stage: string; probability: number | null; closeDate: string | null
  accountId: string | null; accountName: string | null; assignedTo: string | null
  createdAt: string
}

type Activity = {
  id: string; type: string; subject: string; notes: string | null
  dueDate: string | null; isDone: boolean; relatedType: string | null
  relatedId: string | null; assignedTo: string | null; createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEAD_STAGES = [
  { key: 'new',        label: 'New',         color: '#6366f1' },
  { key: 'contacted',  label: 'Contacted',   color: '#f59e0b' },
  { key: 'qualified',  label: 'Qualified',   color: '#3b82f6' },
  { key: 'converted',  label: 'Converted',   color: '#10b981' },
  { key: 'lost',       label: 'Lost',        color: '#ef4444' },
]

const DEAL_STAGES = [
  { key: 'prospecting',   label: 'Prospecting',   prob: 10  },
  { key: 'qualification', label: 'Qualification', prob: 25  },
  { key: 'proposal',      label: 'Proposal',      prob: 50  },
  { key: 'negotiation',   label: 'Negotiation',   prob: 75  },
  { key: 'closed_won',    label: 'Closed Won',    prob: 100 },
  { key: 'closed_lost',   label: 'Closed Lost',   prob: 0   },
]

const ACTIVITY_TYPES = ['call','email','meeting','note','task']
const ACTIVITY_ICONS: Record<string,string> = { call:'📞', email:'📧', meeting:'🤝', note:'📝', task:'✅' }

const stageColor = (s: string) => {
  const map: Record<string,string> = {
    new:'#6366f1', contacted:'#f59e0b', qualified:'#3b82f6', converted:'#10b981', lost:'#ef4444',
    prospecting:'#8b5cf6', qualification:'#f59e0b', proposal:'#3b82f6',
    negotiation:'#f97316', closed_won:'#10b981', closed_lost:'#ef4444',
  }
  return map[s] ?? '#6b7280'
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {label.replace(/_/g,' ')}
    </span>
  )
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  const colors = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#14b8a6','#f97316']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function fmt(v: string | null | undefined) {
  if (!v) return '—'
  const n = Number(v)
  if (isNaN(n)) return v
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6' }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af' }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = { width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:14, outline:'none', boxSizing:'border-box' }
const sel: React.CSSProperties = { ...inp, background:'#fff' }

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key:'leads',     label:'🎯 Leads',      desc:'Pipeline & scoring' },
  { key:'contacts',  label:'👤 Contacts',   desc:'People' },
  { key:'accounts',  label:'🏢 Accounts',   desc:'Companies' },
  { key:'deals',     label:'💰 Deals',      desc:'Revenue pipeline' },
  { key:'activities',label:'📋 Activities', desc:'Tasks & calls' },
]

// ─── Leads Kanban ────────────────────────────────────────────────────────────

function LeadsTab() {
  const [leads, setLeads]       = useState<Lead[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [form, setForm]         = useState({ firstName:'', lastName:'', email:'', phone:'', company:'', jobTitle:'', source:'', stage:'new', notes:'' })
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchWithAuth(`/api/tenant/crm/leads${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      const d = await r.json()
      setLeads(d.leads ?? [])
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.firstName.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/crm/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      setModal(false); setForm({ firstName:'', lastName:'', email:'', phone:'', company:'', jobTitle:'', source:'', stage:'new', notes:'' }); load()
    } finally { setSaving(false) }
  }

  const moveStage = async (id: string, stage: string) => {
    await fetchWithAuth(`/api/tenant/crm/leads/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage }) })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
  }

  const stageLeads = (s: string) => leads.filter(l => l.stage === s)

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, maxWidth:280 }} />
        <button onClick={() => setModal(true)} style={{ marginLeft:'auto', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:600, cursor:'pointer', fontSize:14 }}>
          + New Lead
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, overflowX:'auto', minWidth:900 }}>
          {LEAD_STAGES.map(stage => (
            <div key={stage.key}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragging) { moveStage(dragging, stage.key); setDragging(null) } }}
              style={{ background:'#f9fafb', borderRadius:12, padding:12, minHeight:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:stage.color }} />
                <span style={{ fontWeight:600, fontSize:13, color:'#374151' }}>{stage.label}</span>
                <span style={{ marginLeft:'auto', background:'#e5e7eb', borderRadius:99, padding:'1px 8px', fontSize:11, color:'#6b7280' }}>{stageLeads(stage.key).length}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {stageLeads(stage.key).map(lead => (
                  <div key={lead.id} draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{ background:'#fff', borderRadius:10, padding:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', cursor:'grab', border:`2px solid ${dragging===lead.id ? stage.color : 'transparent'}` }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'#111827', marginBottom:2 }}>
                      {lead.firstName} {lead.lastName}
                    </div>
                    {lead.company && <div style={{ fontSize:11, color:'#6b7280' }}>{lead.company}</div>}
                    {lead.email && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{lead.email}</div>}
                    {lead.source && (
                      <div style={{ marginTop:6 }}>
                        <Badge label={lead.source} color="#6b7280" />
                      </div>
                    )}
                    {(lead.score ?? 0) > 0 && (
                      <div style={{ marginTop:6, fontSize:11, color:'#f59e0b', fontWeight:600 }}>
                        ⭐ Score: {lead.score}
                      </div>
                    )}
                  </div>
                ))}
                {stageLeads(stage.key).length === 0 && (
                  <div style={{ textAlign:'center', color:'#d1d5db', fontSize:12, padding:'12px 0' }}>Drop here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Lead" onClose={() => setModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="First Name *">
              <input style={inp} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" />
            </Field>
            <Field label="Last Name">
              <input style={inp} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Smith" />
            </Field>
            <Field label="Email">
              <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" />
            </Field>
            <Field label="Phone">
              <input style={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+61 400 000 000" />
            </Field>
            <Field label="Company">
              <input style={inp} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" />
            </Field>
            <Field label="Job Title">
              <input style={inp} value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="HR Manager" />
            </Field>
            <Field label="Source">
              <select style={sel} value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                <option value="">— Select —</option>
                {['website','referral','linkedin','cold_call','email_campaign','event','other'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <select style={sel} value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                {LEAD_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Add any notes…" />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>Cancel</button>
            <button onClick={create} disabled={saving || !form.firstName.trim()} style={{ padding:'8px 18px', borderRadius:8, background:'#6366f1', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity: saving || !form.firstName.trim() ? 0.5 : 1 }}>
              {saving ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ firstName:'', lastName:'', email:'', phone:'', mobile:'', jobTitle:'', department:'', notes:'' })
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchWithAuth(`/api/tenant/crm/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      const d = await r.json()
      setContacts(d.contacts ?? [])
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.firstName.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/crm/contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      setModal(false); setForm({ firstName:'', lastName:'', email:'', phone:'', mobile:'', jobTitle:'', department:'', notes:'' }); load()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth:280 }} />
        <button onClick={() => setModal(true)} style={{ marginLeft:'auto', background:'#10b981', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:600, cursor:'pointer', fontSize:14 }}>
          + New Contact
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f3f4f6', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                {['Name','Email','Phone','Job Title','Created'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={`${c.firstName} ${c.lastName ?? ''}`} size={32} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{c.firstName} {c.lastName}</div>
                        {c.accountId && <div style={{ fontSize:11, color:'#9ca3af' }}>Has account</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#374151' }}>{c.email ?? '—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#374151' }}>{c.phone ?? '—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#374151' }}>{c.jobTitle ?? '—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:'#9ca3af' }}>{new Date(c.createdAt).toLocaleDateString('en-AU')}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>No contacts yet. Create your first contact.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="New Contact" onClose={() => setModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="First Name *">
              <input style={inp} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
            </Field>
            <Field label="Last Name">
              <input style={inp} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input style={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Job Title">
              <input style={inp} value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} />
            </Field>
            <Field label="Department">
              <input style={inp} value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>Cancel</button>
            <button onClick={create} disabled={saving || !form.firstName.trim()} style={{ padding:'8px 18px', borderRadius:8, background:'#10b981', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Creating…' : 'Create Contact'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────

function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ name:'', industry:'', website:'', phone:'', email:'', address:'', city:'', state:'', abn:'', type:'prospect', notes:'' })
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchWithAuth(`/api/tenant/crm/accounts${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      const d = await r.json()
      setAccounts(d.accounts ?? [])
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/crm/accounts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      setModal(false); setForm({ name:'', industry:'', website:'', phone:'', email:'', address:'', city:'', state:'', abn:'', type:'prospect', notes:'' }); load()
    } finally { setSaving(false) }
  }

  const ACCOUNT_TYPES = ['prospect','customer','partner','vendor']
  const TYPE_COLORS: Record<string,string> = { prospect:'#6366f1', customer:'#10b981', partner:'#f59e0b', vendor:'#6b7280' }

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth:280 }} />
        <button onClick={() => setModal(true)} style={{ marginLeft:'auto', background:'#3b82f6', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:600, cursor:'pointer', fontSize:14 }}>
          + New Account
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
          {accounts.map(a => (
            <div key={a.id} style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #f3f4f6', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🏢</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                  {a.industry && <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>{a.industry}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                {a.type && <Badge label={a.type} color={TYPE_COLORS[a.type] ?? '#6b7280'} />}
              </div>
              {a.email && <div style={{ fontSize:12, color:'#6b7280', marginBottom:2 }}>📧 {a.email}</div>}
              {a.phone && <div style={{ fontSize:12, color:'#6b7280', marginBottom:2 }}>📞 {a.phone}</div>}
              {a.city  && <div style={{ fontSize:12, color:'#9ca3af' }}>📍 {a.city}{a.country ? `, ${a.country}` : ''}</div>}
            </div>
          ))}
          {accounts.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#9ca3af' }}>No accounts yet.</div>
          )}
        </div>
      )}

      {modal && (
        <Modal title="New Account" onClose={() => setModal(false)}>
          <Field label="Account Name *">
            <input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Corp" />
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Industry">
              <input style={inp} value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Healthcare" />
            </Field>
            <Field label="Type">
              <select style={sel} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Email">
              <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input style={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Website">
              <input style={inp} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" />
            </Field>
            <Field label="ABN">
              <input style={inp} value={form.abn} onChange={e => setForm(p => ({ ...p, abn: e.target.value }))} placeholder="00 000 000 000" />
            </Field>
            <Field label="City">
              <input style={inp} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </Field>
            <Field label="State">
              <input style={inp} value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>Cancel</button>
            <button onClick={create} disabled={saving || !form.name.trim()} style={{ padding:'8px 18px', borderRadius:8, background:'#3b82f6', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Deals Tab ────────────────────────────────────────────────────────────────

function DealsTab() {
  const [deals, setDeals]     = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [form, setForm]       = useState({ title:'', value:'', stage:'prospecting', probability:10, closeDate:'', notes:'' })
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchWithAuth('/api/tenant/crm/deals')
      const d = await r.json()
      setDeals(d.deals ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/crm/deals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, value: form.value || null }) })
      setModal(false); setForm({ title:'', value:'', stage:'prospecting', probability:10, closeDate:'', notes:'' }); load()
    } finally { setSaving(false) }
  }

  const moveStage = async (id: string, stage: string) => {
    const ds = DEAL_STAGES.find(s => s.key === stage)
    await fetchWithAuth(`/api/tenant/crm/deals/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage, probability: ds?.prob }) })
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage, probability: ds?.prob ?? d.probability } : d))
  }

  const stageDeals = (s: string) => deals.filter(d => d.stage === s)
  const stageValue = (s: string) => stageDeals(s).reduce((sum, d) => sum + Number(d.value ?? 0), 0)

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div style={{ display:'flex', gap:10 }}>
          {['closed_won','prospecting','proposal'].map(s => {
            const total = deals.filter(d => d.stage === s).reduce((sum, d) => sum + Number(d.value ?? 0), 0)
            const label = s === 'closed_won' ? '✅ Won' : s === 'prospecting' ? '🔍 Pipeline' : '📄 In Proposal'
            return total > 0 ? (
              <div key={s} style={{ background:'#f9fafb', borderRadius:10, padding:'8px 14px', fontSize:13 }}>
                <span style={{ color:'#6b7280' }}>{label}: </span>
                <span style={{ fontWeight:700, color: s==='closed_won' ? '#10b981' : '#111827' }}>{fmt(String(total))}</span>
              </div>
            ) : null
          })}
        </div>
        <button onClick={() => setModal(true)} style={{ marginLeft:'auto', background:'#10b981', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:600, cursor:'pointer', fontSize:14 }}>
          + New Deal
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, overflowX:'auto', minWidth:1000 }}>
          {DEAL_STAGES.map(stage => (
            <div key={stage.key}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragging) { moveStage(dragging, stage.key); setDragging(null) } }}
              style={{ background:'#f9fafb', borderRadius:12, padding:10, minHeight:200 }}>
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:stageColor(stage.key) }} />
                  <span style={{ fontWeight:600, fontSize:12, color:'#374151' }}>{stage.label}</span>
                  <span style={{ marginLeft:'auto', background:'#e5e7eb', borderRadius:99, padding:'0px 6px', fontSize:10, color:'#6b7280' }}>{stageDeals(stage.key).length}</span>
                </div>
                {stageValue(stage.key) > 0 && (
                  <div style={{ fontSize:11, color:'#6b7280', paddingLeft:14, fontWeight:600 }}>{fmt(String(stageValue(stage.key)))}</div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {stageDeals(stage.key).map(deal => (
                  <div key={deal.id} draggable
                    onDragStart={() => setDragging(deal.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{ background:'#fff', borderRadius:8, padding:10, boxShadow:'0 1px 3px rgba(0,0,0,0.07)', cursor:'grab', border:`2px solid ${dragging===deal.id ? stageColor(stage.key) : 'transparent'}` }}>
                    <div style={{ fontWeight:600, fontSize:12, color:'#111827', marginBottom:2 }}>{deal.title}</div>
                    {deal.accountName && <div style={{ fontSize:11, color:'#6b7280' }}>{deal.accountName}</div>}
                    {deal.value && <div style={{ fontSize:12, color:'#10b981', fontWeight:700, marginTop:4 }}>{fmt(deal.value)}</div>}
                    {deal.closeDate && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>Close: {deal.closeDate}</div>}
                    <div style={{ marginTop:4, height:3, background:'#f3f4f6', borderRadius:99 }}>
                      <div style={{ height:'100%', width: `${deal.probability ?? 0}%`, background: stageColor(stage.key), borderRadius:99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Deal" onClose={() => setModal(false)}>
          <Field label="Deal Title *">
            <input style={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enterprise HRMS — Acme Corp" />
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Value (AUD)">
              <input style={inp} type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="50000" />
            </Field>
            <Field label="Stage">
              <select style={sel} value={form.stage} onChange={e => {
                const ds = DEAL_STAGES.find(s => s.key === e.target.value)
                setForm(p => ({ ...p, stage: e.target.value, probability: ds?.prob ?? p.probability }))
              }}>
                {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Probability (%)">
              <input style={inp} type="number" min={0} max={100} value={form.probability} onChange={e => setForm(p => ({ ...p, probability: Number(e.target.value) }))} />
            </Field>
            <Field label="Close Date">
              <input style={inp} type="date" value={form.closeDate} onChange={e => setForm(p => ({ ...p, closeDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>Cancel</button>
            <button onClick={create} disabled={saving || !form.title.trim()} style={{ padding:'8px 18px', borderRadius:8, background:'#10b981', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Creating…' : 'Create Deal'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Activities Tab ───────────────────────────────────────────────────────────

function ActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [filter, setFilter]         = useState<'all'|'pending'|'done'>('all')
  const [form, setForm]             = useState({ type:'call', subject:'', notes:'', dueDate:'', assignedTo:'' })
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'pending' ? '?isDone=false' : filter === 'done' ? '?isDone=true' : ''
      const r = await fetchWithAuth(`/api/tenant/crm/activities${params}`)
      const d = await r.json()
      setActivities(d.activities ?? [])
    } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.subject.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/tenant/crm/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      setModal(false); setForm({ type:'call', subject:'', notes:'', dueDate:'', assignedTo:'' }); load()
    } finally { setSaving(false) }
  }

  const markDone = async (id: string) => {
    await fetchWithAuth('/api/tenant/crm/activities', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, isDone: true }) })
    setActivities(prev => prev.map(a => a.id === id ? { ...a, isDone: true } : a))
  }

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:0, background:'#f3f4f6', borderRadius:8, padding:3 }}>
          {(['all','pending','done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 14px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background: filter===f ? '#fff' : 'transparent', color: filter===f ? '#111827' : '#6b7280', boxShadow: filter===f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} style={{ marginLeft:'auto', background:'#f59e0b', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:600, cursor:'pointer', fontSize:14 }}>
          + Log Activity
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {activities.map(a => (
            <div key={a.id} style={{ background:'#fff', borderRadius:10, padding:'12px 16px', border:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:14, opacity: a.isDone ? 0.6 : 1 }}>
              <div style={{ fontSize:20 }}>{ACTIVITY_ICONS[a.type] ?? '📋'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14, color: a.isDone ? '#9ca3af' : '#111827', textDecoration: a.isDone ? 'line-through' : 'none' }}>{a.subject}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>
                  {a.type} {a.dueDate ? `· Due: ${new Date(a.dueDate).toLocaleDateString('en-AU')}` : ''} {a.assignedTo ? `· ${a.assignedTo}` : ''}
                </div>
                {a.notes && <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{a.notes}</div>}
              </div>
              {!a.isDone && (
                <button onClick={() => markDone(a.id)} style={{ background:'#ecfdf5', color:'#10b981', border:'1px solid #a7f3d0', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                  ✓ Done
                </button>
              )}
              {a.isDone && <Badge label="Done" color="#10b981" />}
            </div>
          ))}
          {activities.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>No activities yet.</div>
          )}
        </div>
      )}

      {modal && (
        <Modal title="Log Activity" onClose={() => setModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Type">
              <select style={sel} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_ICONS[t]} {t}</option>)}
              </select>
            </Field>
            <Field label="Due Date">
              <input style={inp} type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Subject *">
            <input style={inp} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Follow-up call with Jane Smith" />
          </Field>
          <Field label="Notes">
            <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>Cancel</button>
            <button onClick={create} disabled={saving || !form.subject.trim()} style={{ padding:'8px 18px', borderRadius:8, background:'#f59e0b', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Log Activity'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [tab, setTab] = useState<'leads'|'contacts'|'accounts'|'deals'|'activities'>('leads')

  return (
    <div style={{ padding:24, maxWidth:1400, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#111827' }}>CRM</h1>
        <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>Leads · Contacts · Accounts · Deals · Activities</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:'2px solid #f3f4f6', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontSize:14, fontWeight:600, color: tab===t.key ? '#6366f1' : '#6b7280', borderBottom: tab===t.key ? '2px solid #6366f1' : '2px solid transparent', marginBottom:-2, whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'leads'      && <LeadsTab />}
      {tab === 'contacts'   && <ContactsTab />}
      {tab === 'accounts'   && <AccountsTab />}
      {tab === 'deals'      && <DealsTab />}
      {tab === 'activities' && <ActivitiesTab />}
    </div>
  )
}
