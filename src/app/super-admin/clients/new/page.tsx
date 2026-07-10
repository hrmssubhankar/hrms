'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIERS = [
  { value: 'starter',      label: '🟢 Starter',      desc: '11 modules — Core + Compliance' },
  { value: 'professional', label: '🔵 Professional',  desc: '20 modules — + Talent, Learning, Performance, Safety' },
  { value: 'enterprise',   label: '🟣 Enterprise',    desc: '28 modules — All modules included' },
]

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    tier: 'enterprise',
    primaryColor: '#1a4fff',
    logoUrl: '',
    adminEmail: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleName(v: string) {
    setForm(f => ({
      ...f,
      name: v,
      slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/super-admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-900 border border-gray-800 rounded-xl p-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Organisation Name *</label>
          <input
            required
            value={form.name}
            onChange={e => handleName(e.target.value)}
            placeholder="Yahweh Care Pty Ltd"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL Slug *</label>
          <div className="flex items-center gap-2">
            <input
              required
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="yahweh-care"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Client will access their HRMS at: <span className="text-purple-400">{form.slug || 'slug'}.yourdomain.com</span>
          </p>
        </div>

        {/* Tier */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Tier *</label>
          <div className="space-y-2">
            {TIERS.map(t => (
              <label
                key={t.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  form.tier === t.value
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t.value}
                  checked={form.tier === t.value}
                  onChange={() => setForm(f => ({ ...f, tier: t.value }))}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-white">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Brand colour */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Brand Primary Colour</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <div
              className="flex-1 h-10 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryColor}88)` }}
            />
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL (optional)</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Admin email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Client Admin Email</label>
          <input
            type="email"
            value={form.adminEmail}
            onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
            placeholder="admin@yahwehcare.com.au"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">A login invitation will be sent to this email</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
          >
            {loading ? 'Creating…' : 'Create Client & Configure Modules →'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-700 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
