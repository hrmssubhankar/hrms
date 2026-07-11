'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const TIERS = [
  { value: 'starter',      label: '🟢 Starter',      modules: 9,  desc: '9 modules — Core + Compliance' },
  { value: 'professional', label: '🔵 Professional',  modules: 19, desc: '19 modules — + Learning, Talent, Safety' },
  { value: 'enterprise',   label: '🟣 Enterprise',    modules: 28, desc: '28 modules — full platform' },
]

const STARTER_MODULES    = [1,2,3,4,5,6,7,8,9]
const PRO_MODULES        = [...STARTER_MODULES, 10,11,12,13,14,15,16,17,18,19]
const ENTERPRISE_MODULES = Array.from({ length: 28 }, (_, i) => i + 1)
const TIER_MODULE_MAP: Record<string, number[]> = {
  starter: STARTER_MODULES, professional: PRO_MODULES, enterprise: ENTERPRISE_MODULES,
}

const FONT_OPTIONS = ['Inter', 'Poppins', 'Roboto', 'DM Sans', 'Nunito', 'Lato', 'Open Sans']
const RADIUS_OPTIONS = [
  { value: '0',      label: 'Sharp' },
  { value: '4px',    label: 'Subtle' },
  { value: '8px',    label: 'Rounded' },
  { value: '12px',   label: 'Soft' },
  { value: '9999px', label: 'Pill' },
]
const PRESET_THEMES = [
  { label: 'Ocean',    primaryColor: '#1a4fff', accentColor: '#7c3aed' },
  { label: 'Forest',   primaryColor: '#16a34a', accentColor: '#0d9488' },
  { label: 'Sunrise',  primaryColor: '#ea580c', accentColor: '#d97706' },
  { label: 'Midnight', primaryColor: '#6d28d9', accentColor: '#db2777' },
  { label: 'Teal',     primaryColor: '#0d9488', accentColor: '#0891b2' },
  { label: 'Slate',    primaryColor: '#334155', accentColor: '#0ea5e9' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL = 'block text-sm font-medium text-gray-300 mb-1'

function EditClientInner() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const searchParams = useSearchParams()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', slug: '', tier: 'enterprise',
    primaryColor: '#1a4fff', isActive: true,
  })
  const [theme, setTheme] = useState({
    accentColor: '#7c3aed', fontFamily: 'Inter', borderRadius: '8px', sidebarDark: true,
  })
  const [logoUrl,      setLogoUrl]      = useState<string>('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [originalTier, setOriginalTier] = useState('enterprise')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [applyingTier, setApplyingTier] = useState(false)
  const initialTab = (searchParams.get('tab') as 'general'|'branding'|'theme') ?? 'general'
  const [activeTab,    setActiveTab]    = useState<'general'|'branding'|'theme'>(initialTab)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  useEffect(() => {
    fetch(`/api/super-admin/clients/${id}`)
      .then(r => r.json())
      .then(data => {
        const t = data.tenant
        if (!t) return
        const tier = t.tier ?? 'enterprise'
        setForm({ name: t.name ?? '', slug: t.slug ?? '', tier, primaryColor: t.primaryColor ?? '#1a4fff', isActive: t.isActive ?? true })
        setOriginalTier(tier)
        setLogoUrl(t.logoUrl ?? '')
        const s = typeof t.settings === 'string' ? JSON.parse(t.settings) : (t.settings ?? {})
        setTheme({
          accentColor:  s.accentColor  ?? '#7c3aed',
          fontFamily:   s.fontFamily   ?? 'Inter',
          borderRadius: s.borderRadius ?? '8px',
          sidebarDark:  s.sidebarDark  !== false,
        })
        setLoading(false)
      })
  }, [id])

  // ── Logo upload ───────────────────────────────────────
  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) { setError('Logo must be under 512 KB'); return }
    setLogoUploading(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string
      const res  = await fetch(`/api/super-admin/clients/${id}/logo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed') }
      else { setLogoUrl(data.logoUrl); setSuccess('Logo updated.') }
      setLogoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function removeLogo() {
    await fetch(`/api/super-admin/clients/${id}/logo`, { method: 'DELETE' })
    setLogoUrl(''); setSuccess('Logo removed.')
  }

  // ── Save general ──────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      // General tab: only save form fields — do NOT send logoUrl or settings
      // (logo is managed by its own API; settings by the Theme tab)
      const res  = await fetch(`/api/super-admin/clients/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ name: form.name, slug: form.slug, tier: form.tier, isActive: form.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setOriginalTier(form.tier)
      setSuccess('Changes saved.')
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false); setTimeout(() => setSuccess(''), 3000) }
  }

  // ── Save theme ────────────────────────────────────────
  async function saveTheme() {
    setSaving(true); setError(''); setSuccess('')
    const settings = { ...theme, primaryColor: form.primaryColor, logoUrl }
    try {
      const res  = await fetch(`/api/super-admin/clients/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: form.primaryColor, settings }),
      })
      if (!res.ok) throw new Error('Theme save failed')
      setSuccess('Theme saved — changes reflect immediately in tenant portal.')
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false); setTimeout(() => setSuccess(''), 4000) }
  }

  // ── Apply tier modules ────────────────────────────────
  async function applyTierDefaults() {
    setApplyingTier(true); setError('')
    const modules = ENTERPRISE_MODULES.map(moduleId => ({
      moduleId, isEnabled: (TIER_MODULE_MAP[form.tier] ?? ENTERPRISE_MODULES).includes(moduleId),
    }))
    const res  = await fetch(`/api/super-admin/clients/${id}/modules`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed'); setApplyingTier(false); return }
    setSuccess(`Applied ${form.tier} defaults.`)
    setApplyingTier(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  if (loading) return <div className="text-gray-400 p-6">Loading client…</div>


  const tierChanged = form.tier !== originalTier
  const previewBg   = form.primaryColor

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-gray-800 p-1" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: form.primaryColor }}>
              {form.name[0] ?? 'C'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{form.name}</h1>
            <p className="text-gray-400 text-sm">{form.slug} · {form.tier}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/super-admin/clients/${id}/users`}   className="text-xs border border-green-700 text-green-300 hover:bg-green-900/30 px-3 py-1.5 rounded-lg transition">👥 Users</Link>
          <Link href={`/super-admin/clients/${id}/modules`} className="text-xs border border-purple-700 text-purple-300 hover:bg-purple-900/30 px-3 py-1.5 rounded-lg transition">🧩 Modules</Link>
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300">{error}</div>}
      {success && <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-sm text-green-300">✓ {success}</div>}

      {/* Tier-change banner */}
      {tierChanged && (
        <div className="bg-amber-950 border border-amber-700 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-300">Tier changed → {form.tier}</p>
            <p className="text-xs text-amber-400 mt-0.5">Save, then apply module defaults ({TIER_MODULE_MAP[form.tier].length} modules enabled).</p>
          </div>
          <button onClick={applyTierDefaults} disabled={applyingTier}
            className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg">
            {applyingTier ? 'Applying…' : `Apply ${form.tier} modules`}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {([
          { id: 'general',  label: '⚙️ General' },
          { id: 'branding', label: '🖼 Logo & Branding' },
          { id: 'theme',    label: '🎨 Theme & Colours' },
        ] as { id: 'general'|'branding'|'theme'; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">

          {/* Active toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div>
              <p className="text-sm font-medium text-white">Account Status</p>
              <p className="text-xs text-gray-400 mt-0.5">Inactive clients cannot log in</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-green-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className={LABEL}>Organisation Name</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} />
            <p className="text-xs text-gray-500 mt-1">This name appears on the client login page and throughout their portal.</p>
          </div>

          <div>
            <label className={LABEL}>URL Slug</label>
            <input required value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              className={INPUT} />
            <p className="text-xs text-gray-500 mt-1">
              Portal URL: <span className="text-purple-400">{form.slug}.yourdomain.com</span>
            </p>
          </div>

          <div>
            <label className={LABEL}>Subscription Tier</label>
            <div className="space-y-2 mt-2">
              {TIERS.map(t => (
                <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  form.tier === t.value ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 hover:border-gray-600'}`}>
                  <input type="radio" name="tier" value={t.value} checked={form.tier === t.value}
                    onChange={() => setForm(f => ({ ...f, tier: t.value }))} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <span className="text-xs text-gray-400">{t.modules} modules</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                  {originalTier === t.value && <span className="text-xs text-gray-500 shrink-0 mt-0.5">current</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/super-admin/clients')}
              className="border border-gray-700 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded-lg transition">
              ← Clients
            </button>
          </div>
        </form>
      )}

      {/* ── BRANDING TAB ── */}
      {activeTab === 'branding' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

          {/* Logo upload */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Organisation Logo</p>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <span className="text-3xl text-gray-600">🖼</span>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden" onChange={handleLogoFile} />
                <button onClick={() => fileRef.current?.click()} disabled={logoUploading}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-60 text-white text-sm px-4 py-2.5 rounded-lg transition">
                  {logoUploading ? '⏳ Uploading…' : '📁 Upload Logo'}
                </button>
                {logoUrl && (
                  <button onClick={removeLogo}
                    className="w-full border border-red-800 text-red-400 hover:bg-red-900/30 text-sm px-4 py-2.5 rounded-lg transition">
                    Remove Logo
                  </button>
                )}
                <p className="text-xs text-gray-500">PNG, JPG, SVG or WebP · max 512 KB · Recommended: 200×60px on transparent background</p>
              </div>
            </div>
          </div>

          {/* Portal name */}
          <div>
            <label className={LABEL}>Portal Display Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} />
            <p className="text-xs text-gray-500 mt-1">Shown on login page, browser tab, and portal header.</p>
          </div>

          {/* Live preview */}
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <div className="bg-gray-800 px-3 py-2 text-xs text-gray-500 font-medium">Login page preview</div>
            <div className="bg-gray-950 flex items-center justify-center py-8 px-4">
              <div className="w-64 space-y-3 text-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 mx-auto object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: form.primaryColor }}>
                    {form.name[0] ?? 'C'}
                  </div>
                )}
                <p className="text-white font-bold text-lg">{form.name || 'Your Organisation'}</p>
                <p className="text-gray-400 text-xs">Sign in to {form.name || 'your organisation'}</p>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2 mt-2">
                  <div className="h-7 bg-gray-800 rounded-lg" />
                  <div className="h-7 bg-gray-800 rounded-lg" />
                  <div className="h-7 rounded-lg" style={{ background: form.primaryColor }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              setSaving(true); setError(''); setSuccess('')
              try {
                const res = await fetch(`/api/super-admin/clients/${id}`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: form.name }),
                })
                if (!res.ok) throw new Error('Save failed')
                setSuccess('Branding saved.')
              } catch (err: any) { setError(err.message) }
              finally { setSaving(false); setTimeout(() => setSuccess(''), 3000) }
            }}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
          >
            {saving ? 'Saving…' : 'Save Display Name'}
          </button>
        </div>
      )}

      {/* ── THEME TAB ── */}
      {activeTab === 'theme' && (
        <div className="space-y-5">

          {/* Preset pills */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-300 mb-3">Preset Themes</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_THEMES.map(p => (
                <button key={p.label}
                  onClick={() => { setForm(f => ({ ...f, primaryColor: p.primaryColor })); setTheme(t => ({ ...t, accentColor: p.accentColor })) }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    form.primaryColor === p.primaryColor ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <span className="w-3 h-3 rounded-full" style={{ background: p.primaryColor }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">

            {/* Primary + Accent colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Primary Colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input type="text" value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Sidebar, header accent, buttons</p>
              </div>
              <div>
                <label className={LABEL}>Accent Colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.accentColor}
                    onChange={e => setTheme(t => ({ ...t, accentColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input type="text" value={theme.accentColor}
                    onChange={e => setTheme(t => ({ ...t, accentColor: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Badges, highlights, secondary elements</p>
              </div>
            </div>

            {/* Font */}
            <div>
              <label className={LABEL}>Font Family</label>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(f => (
                  <button key={f} onClick={() => setTheme(t => ({ ...t, fontFamily: f }))}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition ${theme.fontFamily === f ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    style={{ fontFamily: f }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <label className={LABEL}>Border Radius</label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map(r => (
                  <button key={r.value} onClick={() => setTheme(t => ({ ...t, borderRadius: r.value }))}
                    className={`flex-1 py-2 text-xs border transition ${theme.borderRadius === r.value ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    style={{ borderRadius: r.value }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar dark toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Dark Sidebar</p>
                <p className="text-xs text-gray-500">Use dark background for sidebar navigation</p>
              </div>
              <button onClick={() => setTheme(t => ({ ...t, sidebarDark: !t.sidebarDark }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${theme.sidebarDark ? 'bg-purple-600' : 'bg-gray-700'}`}>
                <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${theme.sidebarDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Live mini-preview */}
            <div className="rounded-xl overflow-hidden border border-gray-700" style={{ fontFamily: theme.fontFamily }}>
              <div className="bg-gray-800 px-3 py-1.5 text-xs text-gray-500">Live preview</div>
              <div className="flex h-48">
                <div className="w-32 flex flex-col text-white text-xs" style={{ background: theme.sidebarDark ? '#111827' : form.primaryColor }}>
                  <div className="px-3 py-2.5 border-b border-white/10 font-bold truncate" style={{ borderRadius: theme.borderRadius }}>
                    {form.name || 'Client Portal'}
                  </div>
                  {['Dashboard', 'Employees', 'Payroll'].map((item, i) => (
                    <div key={item} className="px-3 py-1.5 text-xs"
                      style={i === 0 ? { background: 'rgba(255,255,255,0.15)', borderRadius: theme.borderRadius } : {}}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-gray-950 p-3 space-y-2">
                  <div className="flex gap-2">
                    {[{ label: '48 Staff', bg: form.primaryColor }, { label: '3 Leave', bg: theme.accentColor }, { label: '2 Due', bg: '#64748b' }].map(s => (
                      <div key={s.label} className="flex-1 rounded py-1.5 text-center text-white text-xs font-semibold"
                        style={{ background: s.bg, borderRadius: theme.borderRadius }}>{s.label}</div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">Recent Activity</div>
                  <div className="bg-gray-900 rounded p-2 text-xs text-gray-500" style={{ borderRadius: theme.borderRadius }}>John Smith — Leave Approved</div>
                  <button className="text-xs text-white px-3 py-1 font-medium"
                    style={{ background: form.primaryColor, borderRadius: theme.borderRadius }}>+ Add Employee</button>
                </div>
              </div>
              <div className="bg-gray-900 border-t border-gray-800 px-3 py-1.5 text-xs text-gray-500">
                {theme.fontFamily} · radius {theme.borderRadius} · {theme.sidebarDark ? 'dark' : 'colour'} sidebar
              </div>
            </div>
          </div>

          <button onClick={saveTheme} disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
            {saving ? 'Saving…' : '✓ Save Theme — applies immediately to tenant portal'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function EditClientPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-6">Loading…</div>}>
      <EditClientInner />
    </Suspense>
  )
}
