'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const [tenantSlug, setTenantSlug] = useState<string>('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Detect context from query param (local dev) or hostname (production)
    const slug = params.get('tenant') ?? ''
    const host = window.location.hostname

    if (host.startsWith('admin.') || slug === 'admin' || slug === '') {
      // Treat empty slug as super admin in dev
      if (!slug || slug === 'admin') {
        setIsSuperAdmin(true)
        setTenantSlug('admin')
      }
    } else {
      // Extract subdomain e.g. "yahweh-care" from "yahweh-care.yourdomain.com"
      const subdomain = host.split('.')[0]
      setTenantSlug(slug || subdomain)
      setIsSuperAdmin(false)
    }
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
            {isSuperAdmin ? 'Super Admin' : 'Yahweh HRMS'}
          </h1>
          <p className="text-sm text-gray-400">
            {isSuperAdmin
              ? 'Platform administration'
              : `Sign in to ${tenantSlug || 'your organisation'}`}
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
          Yahweh HRMS · Enterprise HR Platform
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
