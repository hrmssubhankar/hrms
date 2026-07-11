'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const TIERS = [
  { value: 'starter',      label: '🟢 Starter',      modules: 9,  desc: '9 modules — Core + Compliance' },
  { value: 'professional', label: '🔵 Professional',  modules: 19, desc: '19 modules — + Learning, Talent, Safety' },
  { value: 'enterprise',   label: '🟣 Enterprise',    modules: 28, desc: '28 modules — full platform' },
]

const STARTER_MODULES      = [1,2,3,4,5,6,7,8,9]
const PRO_MODULES          = [...STARTER_MODULES, 10,11,12,13,14,15,16,17,18,19]
const ENTERPRISE_MODULES   = Array.from({ length: 28 }, (_, i) => i + 1)
const TIER_MODULE_MAP: Record<string, number[]> = {
  starter:      STARTER_MODULES,
  professional: PRO_MODULES,
  enterprise:   ENTERPRISE_MODULES,
}

export default function EditClientPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [form, setForm] = useState({
    name: '', slug: '', tier: 'enterprise',
    primaryColor: '#1a4fff', logoUrl: '', isActive: true,
  })
  const [originalTier, setOriginalTier] = useState('enterprise')
  const [loading,       setLoading]     = useState(true)
  const [saving,        setSaving]      = useState(false)
  const [applyingTier,  setApplyingTier] = useState(false)
  const [error,         setError]       = useState('')
  const [success,       setSuccess]     = useState('')

  useEffect(() => {
    fetch(`/api/super-admin/clients/${id}`)
      .then(r => r.json())
      .then(data => {
        const t = data.tenant
        if (t) {
          const tier = t.tier ?? 'enterprise'
          setForm({
            name:         t.name        ?? '',
            slug:         t.slug        ?? '',
            tier,
            primaryColor: t.primaryColor ?? '#1a4fff',
            logoUrl:      t.logoUrl     ?? '',
            isActive:     t.isActive    ?? true,
          })
          setOriginalTier(tier)
        }
        setLoading(false)
      })
  }, [id])

  const tierChanged = form.tier !== originalTier

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res  = await fetch(`/api/super-admin/clients/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setOriginalTier(form.tier)
      setSuccess('Changes saved.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function applyTierDefaults() {
    setApplyingTier(true)
    setError('')
    try {
      const enabledSet = new Set(TIER_MODULE_MAP[form.tier] ?? ENTERPRISE_MODULES)
      const modules = ENTERPRISE_MODULES.map(moduleId => ({
        moduleId,
        isEnabled: enabledSet.has(moduleId),
      }))
      const res  = await fetch(`/api/super-admin/clients/${id}/modules`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ modules }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply modules')
      setSuccess(`Applied ${form.tier} defaults — ${(TIER_MODULE_MAP[form.tier] ?? ENTERPRISE_MODULES).length} modules enabled.`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplyingTier(false)
    }
  }

  if (loading) return <div className="text-gray-400">Loading client…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Client</h1>
          <p className="text-gray-400 text-sm mt-1">{form.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/super-admin/clients/${id}/users`}
            className="text-xs border border-green-700 text-green-300 hover:bg-green-900/30 px-3 py-1.5 rounded-lg transition">
            👥 Users
          </Link>
          <Link href={`/super-admin/clients/${id}/modules`}
            className="text-xs border border-purple-700 text-purple-300 hover:bg-purple-900/30 px-3 py-1.5 rounded-lg transition">
            🧩 Modules
          </Link>
          <Link href={`/super-admin/clients/${id}/theme`}
            className="text-xs border border-pink-700 text-pink-300 hover:bg-pink-900/30 px-3 py-1.5 rounded-lg transition">
            🎨 Theme
          </Link>
        </div>
      </div>

      {error   && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300">{error}</div>}
      {success && <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-sm text-green-300">✓ {success}</div>}

      {/* Tier-change banner */}
      {tierChanged && (
        <div className="bg-amber-950 border border-amber-700 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-300">Tier changed to {form.tier}</p>
            <p className="text-xs text-amber-400 mt-0.5">
              Save will update the billing tier. Also apply {form.tier} module defaults
              ({TIER_MODULE_MAP[form.tier].length} modules)?
            </p>
          </div>
          <button
            type="button"
            onClick={applyTierDefaults}
            disabled={applyingTier}
            className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            {applyingTier ? 'Applying…' : `Apply ${form.tier} modules`}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-900 border border-gray-800 rounded-xl p-6">

        {/* Active toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <p className="text-sm font-medium text-white">Account Status</p>
            <p className="text-xs text-gray-400 mt-0.5">Inactive clients cannot log in</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Organisation Name</label>
          <input required value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL Slug</label>
          <input required value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-purple-400">{form.slug}.yourdomain.com</span>
          </p>
        </div>

        {/* Tier */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Tier</label>
          <div className="space-y-2">
            {TIERS.map(t => (
              <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                form.tier === t.value ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 hover:border-gray-600'
              }`}>
                <input type="radio" name="tier" value={t.value} checked={form.tier === t.value}
                  onChange={() => setForm(f => ({ ...f, tier: t.value }))} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <span className="text-xs text-gray-400">{t.modules} modules</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                {originalTier === t.value && (
                  <span className="text-xs text-gray-500 shrink-0 mt-0.5">current</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Brand colour */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Brand Primary Colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primaryColor}
              onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
            <input type="text" value={form.primaryColor}
              onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
            <div className="flex-1 h-10 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryColor}88)` }} />
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL</label>
          <input type="url" value={form.logoUrl}
            onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/super-admin/clients')}
            className="border border-gray-700 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded-lg transition">
            Back to Clients
          </button>
        </div>
      </form>
    </div>
  )
}
