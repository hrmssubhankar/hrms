'use client'

import { useState, useEffect, use } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Org = {
  id: string; name: string; slug: string; logoUrl: string | null
  primaryColor: string; industry: string | null; city: string | null
  state: string | null; country: string | null
  careerTagline: string | null; careerBanner: string | null
}

type Job = {
  id: string; title: string; description: string | null
  status: string; createdAt: string
}

// ─── Application Modal ────────────────────────────────────────────────────────

function ApplyModal({ job, org, onClose }: { job: Job; org: Org; onClose: () => void }) {
  const [form, setForm]     = useState({ firstName:'', lastName:'', email:'', phone:'', coverLetter:'' })
  const [resume, setResume] = useState<File | null>(null)
  const [step, setStep]     = useState<'form'|'success'|'error'>('form')
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const color = org.primaryColor

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email) return
    setSaving(true)
    setErrMsg('')
    try {
      const fd = new FormData()
      fd.append('tenantId',      org.id)
      fd.append('requisitionId', job.id)
      fd.append('firstName',     form.firstName)
      fd.append('lastName',      form.lastName)
      fd.append('email',         form.email)
      fd.append('phone',         form.phone)
      fd.append('coverLetter',   form.coverLetter)
      if (resume) fd.append('resume', resume)

      const r = await fetch('/api/careers/apply', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setErrMsg(d.error ?? 'Failed to submit'); setSaving(false); return }
      setStep('success')
    } catch { setErrMsg('Something went wrong. Please try again.'); setSaving(false) }
  }

  const inp: React.CSSProperties = { width:'100%', border:'1px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:14, outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg, ${color}, ${color}cc)`, padding:'24px 28px', borderRadius:'20px 20px 0 0', color:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:12, opacity:0.8, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Apply for</div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>{job.title}</h2>
              <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>{org.name}</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', borderRadius:8, width:32, height:32, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>
        </div>

        <div style={{ padding:28 }}>
          {step === 'success' ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
              <h3 style={{ margin:'0 0 8px', fontSize:22, fontWeight:700, color:'#111827' }}>Application Submitted!</h3>
              <p style={{ color:'#6b7280', margin:'0 0 24px', lineHeight:1.6 }}>
                Thanks for applying for <strong>{job.title}</strong> at <strong>{org.name}</strong>.<br/>
                We'll be in touch at <strong>{form.email}</strong>.
              </p>
              <button onClick={onClose} style={{ background:color, color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>First Name *</label>
                  <input style={inp} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Last Name *</label>
                  <input style={inp} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Smith" />
                </div>
              </div>

              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email Address *</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" />
              </div>

              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Phone (optional)</label>
                <input style={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+61 400 000 000" />
              </div>

              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Resume / CV</label>
                <div style={{ border:'2px dashed #e5e7eb', borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer', position:'relative', background: resume ? '#f0fdf4' : '#fafafa' }}
                  onClick={() => document.getElementById('resume-upload')?.click()}>
                  <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" style={{ position:'absolute', opacity:0, inset:0, cursor:'pointer' }}
                    onChange={e => setResume(e.target.files?.[0] ?? null)} />
                  {resume ? (
                    <div style={{ color:'#10b981', fontWeight:600, fontSize:14 }}>✅ {resume.name}</div>
                  ) : (
                    <div>
                      <div style={{ fontSize:24, marginBottom:4 }}>📎</div>
                      <div style={{ fontSize:13, color:'#6b7280' }}>Click to upload PDF, DOC or DOCX</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Cover Letter (optional)</label>
                <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} value={form.coverLetter}
                  onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  placeholder="Tell us why you'd be a great fit…" />
              </div>

              {errMsg && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13 }}>
                  {errMsg}
                </div>
              )}

              <button onClick={submit} disabled={saving || !form.firstName || !form.lastName || !form.email}
                style={{ marginTop:20, width:'100%', background:color, color:'#fff', border:'none', borderRadius:10, padding:'13px', fontWeight:700, fontSize:15, cursor:'pointer', opacity: (saving || !form.firstName || !form.email) ? 0.6 : 1, transition:'opacity 0.2s' }}>
                {saving ? 'Submitting…' : 'Submit Application →'}
              </button>

              <p style={{ textAlign:'center', fontSize:12, color:'#9ca3af', marginTop:12 }}>
                By applying you agree to our privacy policy. Your data is used only for recruitment purposes.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, org, color, onApply }: { job: Job; org: Org; color: string; onApply: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000)

  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e5e7eb', overflow:'hidden', transition:'box-shadow 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}>
      <div style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#111827' }}>{job.title}</h3>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:`${color}12`, color, border:`1px solid ${color}30`, borderRadius:6, padding:'2px 10px', fontSize:12, fontWeight:600 }}>
                Open
              </span>
              <span style={{ fontSize:12, color:'#9ca3af' }}>
                {daysAgo === 0 ? 'Posted today' : daysAgo === 1 ? 'Posted yesterday' : `Posted ${daysAgo} days ago`}
              </span>
            </div>
          </div>
          <button onClick={onApply}
            style={{ background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            Apply Now
          </button>
        </div>

        {job.description && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:14, color:'#374151', lineHeight:1.7, maxHeight: expanded ? 'none' : 80, overflow:'hidden', position:'relative' }}>
              {job.description}
              {!expanded && job.description.length > 200 && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:32, background:'linear-gradient(transparent, #fff)' }} />
              )}
            </div>
            {job.description.length > 200 && (
              <button onClick={() => setExpanded(e => !e)}
                style={{ background:'none', border:'none', color, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:4, padding:0 }}>
                {expanded ? '↑ Show less' : '↓ Read more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CareersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [data, setData]           = useState<{ org: Org; jobs: Job[]; total: number } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [search, setSearch]       = useState('')
  const [applying, setApplying]   = useState<Job | null>(null)

  useEffect(() => {
    fetch(`/api/careers/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' }}>
        <div style={{ textAlign:'center', color:'#9ca3af' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <div>Loading…</div>
        </div>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' }}>
        <div style={{ textAlign:'center', maxWidth:380, padding:24 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🏢</div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>Organisation not found</h1>
          <p style={{ color:'#6b7280', margin:0 }}>The career page you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const { org, jobs } = data
  const color = org.primaryColor
  const filteredJobs = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', fontFamily:"'Inter', system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, color:'#fff', padding:'0' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 24px 56px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:32 }}>
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} style={{ height:56, maxWidth:140, objectFit:'contain', background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'8px 12px' }} />
            ) : (
              <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800 }}>
                {org.name[0]}
              </div>
            )}
            <div>
              <h1 style={{ margin:0, fontSize:28, fontWeight:800, letterSpacing:'-0.02em' }}>{org.name}</h1>
              {(org.city || org.country) && (
                <div style={{ fontSize:14, opacity:0.85, marginTop:2 }}>
                  📍 {[org.city, org.state, org.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
          <h2 style={{ margin:'0 0 10px', fontSize:36, fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2 }}>
            {org.careerTagline ?? `Join the ${org.name} team`}
          </h2>
          <p style={{ margin:'0 0 28px', fontSize:17, opacity:0.9, lineHeight:1.6 }}>
            Explore open positions and start your next chapter with us.
          </p>

          {/* Search */}
          <div style={{ position:'relative', maxWidth:480 }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
            <input
              placeholder="Search job titles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', border:'none', borderRadius:12, padding:'13px 16px 13px 42px', fontSize:15, outline:'none', boxSizing:'border-box', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 0' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, color:'#6b7280' }}>
            <strong style={{ color:'#111827' }}>{filteredJobs.length}</strong> open position{filteredJobs.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ''}
          </span>
          {org.industry && <span style={{ fontSize:13, color:'#9ca3af' }}>Industry: {org.industry}</span>}
        </div>
      </div>

      {/* Jobs */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 64px' }}>
        {filteredJobs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'#fff', borderRadius:16, border:'1px solid #f3f4f6' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔭</div>
            <h3 style={{ margin:'0 0 8px', color:'#111827', fontSize:20 }}>
              {search ? 'No jobs match your search' : 'No open positions right now'}
            </h3>
            <p style={{ color:'#6b7280', margin:0 }}>
              {search ? 'Try a different keyword.' : `Check back soon — ${org.name} may have new opportunities.`}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} org={org} color={color} onApply={() => setApplying(job)} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:48, paddingTop:24, borderTop:'1px solid #e5e7eb' }}>
          <p style={{ fontSize:12, color:'#d1d5db', margin:0 }}>
            Powered by <span style={{ color: color, fontWeight:600 }}>Yahweh HRMS</span>
          </p>
        </div>
      </div>

      {/* Apply Modal */}
      {applying && (
        <ApplyModal job={applying} org={org} onClose={() => setApplying(null)} />
      )}
    </div>
  )
}
