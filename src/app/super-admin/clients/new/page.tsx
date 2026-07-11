'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIERS = [
  { value: 'starter',      label: '🟢 Starter',      modules: 9,  price: 57,  desc: 'Core (5) + Compliance (4) — 9 modules' },
  { value: 'professional', label: '🔵 Professional',  modules: 19, price: 120, desc: '+ Learning, Talent, Performance, Safety — 19 modules' },
  { value: 'enterprise',   label: '🟣 Enterprise',    modules: 28, price: 217, desc: 'All 28 modules — full platform' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

export default function NewClientPage() {
  const router  = useRouter()
  const [form, setForm] = useState({
    name: '', slug: '', tier: 'enterprise',
    primaryColor: '#1a4fff',
    adminEmail: '', adminPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleName(v: string) {
    setForm(f => ({
      ...f,
      name: v,
      slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.adminEmail && !form.adminPassword) {
      setError('Please provide a password for the admin user')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: any = { ...form }
      if (!form.adminEmail) { delete payload.adminEmail; delete payload.adminPassword }
      delete payload.logoUrl  // logo is set after creation via Edit Client → Logo & Branding
      const res  = await fetch('/api/super-admin/clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create client')
      router.push(`/super-admin/clients/${data.tenant.id}/modules`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Client</h1>
        <p className="text-gray-400 text-sm mt-1">Onboard a new organisation onto the HRMS platform</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 border border-gray-800 rounded-xl p-6">

        {/* ── Organisation ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Organisation Name *</label>
            <input required value={form.name} onChange={e => handleName(e.target.value)}
              placeholder="Yahweh Care Pty Ltd" className={INPUT} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL Slug *</label>
            <input required value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="yahweh-care" className={INPUT} />
            <p className="text-xs text-gray-500 mt-1">
              Portal will be accessible at: <span className="text-purple-400">{form.slug || 'slug'}.yourdomain.com</span>
            </p>
          </div>
        </section>

        {/* ── Subscription Tier ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscription Tier *</h2>
          {TIERS.map(t => (
            <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              form.tier === t.value ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 hover:border-gray-600'
            }`}>
              <input type="radio" name="tier" value={t.value} checked={form.tier === t.value}
                onChange={() => setForm(f => ({ ...f, tier: t.value }))} className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{t.label}</p>
                  <span className="text-xs text-gray-400">${t.price} AUD/mo · {t.modules} modules</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
              </div>
            </label>
          ))}
        </section>

        {/* ── Branding ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branding</h2>

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

          <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 text-xs text-gray-400">
            💡 Logo upload is available after creation via <strong className="text-gray-300">Edit Client → Logo &amp; Branding</strong>
          </div>
        </section>

        {/* ── Admin Account ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Account (optional)</h2>
            <p className="text-xs text-gray-500 mt-1">Creates a Director-level login for the client immediately. You can also add users later via the Users tab.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <input type="email" value={form.adminEmail}
                onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                placeholder="admin@client.com.au" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Temp Password {form.adminEmail && <span className="text-red-400">*</span>}
              </label>
              <input type="text" value={form.adminPassword}
                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                placeholder="min 8 characters" className={INPUT} />
            </div>
          </div>

          {form.adminEmail && form.adminPassword && (
            <div className="bg-green-950/50 border border-green-800 rounded-lg p-3 text-xs text-green-300">
              ✓ A Director account will be created for <strong>{form.adminEmail}</strong>.
              Login URL: <span className="text-purple-300">{form.slug || 'slug'}.yourdomain.com/login</span>
            </div>
          )}
        </section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
            {loading ? 'Creating…' : 'Create Client & Configure Modules →'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-700 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
