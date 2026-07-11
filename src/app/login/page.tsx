'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Dedicated deployment hostname → { tenantSlug, isAdmin, label }
const HOST_CONFIG: Record<string, { slug: string; isAdmin: boolean; label: string }> = {
  'superadmin-hrms.vercel.app': { slug: 'admin',                 isAdmin: true,  label: 'Platform Administration' },
  'admin-hrms.vercel.app':      { slug: 'admin',                 isAdmin: true,  label: 'Platform Administration' },
  'yahwehcare-hrms.vercel.app': { slug: 'yahweh-care',           isAdmin: false, label: 'Yahweh Care' },
  'yahwehpc-hrms.vercel.app':   { slug: 'yahweh-property-care',  isAdmin: false, label: 'Yahweh Property Care' },
}

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const [tenantSlug, setTenantSlug] = useState<string>('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [orgLabel, setOrgLabel] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const slug = params.get('tenant') ?? ''
    const host = window.location.hostname

    // 1. Check dedicated deployment hostname map first
    const hostCfg = HOST_CONFIG[host]
    if (hostCfg) {
      setIsSuperAdmin(hostCfg.isAdmin)
      setTenantSlug(hostCfg.slug)
      setOrgLabel(hostCfg.label)
      return
    }

    // 2. URL param or empty → super admin
    if (host.startsWith('admin.') || slug === 'admin' || slug === '') {
      setIsSuperAdmin(true)
      setTenantSlug('admin')
      setOrgLabel('Platform Administration')
      return
    }

    // 3. Explicit tenant param or subdomain
    const subdomain = host.split('.')[0]
    const resolved  = slug || subdomain
    setTenantSlug(resolved)
    setIsSuperAdmin(false)
    setOrgLabel(resolved)
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantSlug }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push(data.redirectTo)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold"
            style={{ background: isSuperAdmin ? '#7c3aed' : '#1a4fff' }}
          >
            {isSuperAdmin ? '★' : 'H'}
          </div>
          <h1 className="text-xl font-bold text-white">
            {isSuperAdmin ? 'Super Admin' : 'HRMS'}
          </h1>
          <p className="text-sm text-gray-400">
            {isSuperAdmin
              ? 'Platform administration'
              : `Sign in to ${orgLabel || tenantSlug || 'your organisation'}`}
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: isSuperAdmin ? '#7c3aed' : '#1a4fff' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          HRMS · Enterprise HR Platform
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
