'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Tenant slug → display label
const TENANT_LABELS: Record<string, string> = {
  'yahweh-care':           'Yahweh Care',
  'yahweh-property-care':  'Yahweh Property Care',
}

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [tenantSlug,  setTenantSlug]  = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [orgLabel,    setOrgLabel]    = useState('')
  const [form,   setForm]   = useState({ email: '', password: '' })
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Priority 1: NEXT_PUBLIC_TENANT_SLUG set per Vercel project
    const deploymentTenant = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ''
    if (deploymentTenant) {
      if (deploymentTenant === 'admin') {
        setIsSuperAdmin(true)
        setTenantSlug('admin')
        setOrgLabel('Platform Administration')
      } else {
        setIsSuperAdmin(false)
        setTenantSlug(deploymentTenant)
        setOrgLabel(TENANT_LABELS[deploymentTenant] ?? deploymentTenant)
      }
      return
    }

    // Priority 2: ?tenant= URL param (set by middleware on redirect)
    const paramTenant = params.get('tenant') ?? ''
    if (paramTenant === 'admin') {
      setIsSuperAdmin(true)
      setTenantSlug('admin')
      setOrgLabel('Platform Administration')
      return
    }
    if (paramTenant) {
      setIsSuperAdmin(false)
      setTenantSlug(paramTenant)
      setOrgLabel(TENANT_LABELS[paramTenant] ?? paramTenant)
      return
    }

    // Priority 3: default → super admin (local dev / yahweh-hrms.vercel.app root)
    setIsSuperAdmin(true)
    setTenantSlug('admin')
    setOrgLabel('Platform Administration')
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, tenantSlug }),
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
            {isSuperAdmin ? '★' : orgLabel[0]?.toUpperCase() ?? 'H'}
          </div>
          <h1 className="text-xl font-bold text-white">
            {isSuperAdmin ? 'Super Admin' : 'HRMS'}
          </h1>
          <p className="text-sm text-gray-400">
            {isSuperAdmin ? 'Platform administration' : `Sign in to ${orgLabel || 'your organisation'}`}
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
