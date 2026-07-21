'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ThemeToggle from '@/components/ui/ThemeToggle'

type Branding = {
  name: string
  logoUrl: string | null
  primaryColor: string
  isActive?: boolean
}

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [tenantSlug,   setTenantSlug]   = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [branding,     setBranding]     = useState<Branding>({ name: '', logoUrl: null, primaryColor: '#1a4fff' })
  const [brandingLoaded, setBrandingLoaded] = useState(false)
  const [form,      setForm]      = useState({ email: '', password: '' })
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  // 2FA challenge state
  const [step,      setStep]      = useState<'password' | 'totp'>('password')
  const [tempToken, setTempToken] = useState('')
  const [totpCode,  setTotpCode]  = useState('')

  useEffect(() => {
    // Determine slug from env → URL param → default
    const deploymentTenant = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ''
    const paramTenant      = params.get('tenant') ?? ''
    const slug = deploymentTenant || paramTenant || 'admin'

    const isAdmin = slug === 'admin'
    setIsSuperAdmin(isAdmin)
    setTenantSlug(slug)

    // Fetch live branding from DB
    fetch(`/api/auth/tenant-branding?slug=${slug}`)
      .then(r => r.json())
      .then((d: Branding) => {
        setBranding({
          name:         d.name         ?? (isAdmin ? 'Platform Administration' : slug),
          logoUrl:      d.logoUrl      ?? null,
          primaryColor: d.primaryColor ?? (isAdmin ? '#7c3aed' : '#1a4fff'),
        })
        setBrandingLoaded(true)
      })
      .catch(() => {
        setBranding({
          name:         isAdmin ? 'Platform Administration' : slug,
          logoUrl:      null,
          primaryColor: isAdmin ? '#7c3aed' : '#1a4fff',
        })
        setBrandingLoaded(true)
      })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, tenantSlug }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }

      // 2FA challenge required
      if (data.requires2FA && data.tempToken) {
        setTempToken(data.tempToken)
        setTotpCode('')
        setStep('totp')
        return
      }

      router.push(data.redirectTo)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totpCode.length !== 6) { setError('Enter the 6-digit code from your authenticator app.'); return }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/totp/challenge', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken, code: totpCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid code'); return }
      router.push(data.redirectTo)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const accentColor = branding.primaryColor

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors">
      {/* Subtle branded glow behind card */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${accentColor}, transparent)` }}
      />

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle className="p-2 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">

        {/* Logo / Brand */}
        <div className="text-center space-y-3">
          {brandingLoaded && branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={`${branding.name} logo`}
              className="h-16 max-w-[180px] object-contain mx-auto"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {isSuperAdmin ? '★' : (branding.name[0]?.toUpperCase() ?? 'H')}
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {isSuperAdmin ? 'Super Admin' : branding.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isSuperAdmin ? 'Platform administration' : `Sign in to ${branding.name || 'your organisation'}`}
            </p>
          </div>
        </div>

        {/* Card */}
        {step === 'password' ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
          >
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition"
                onFocus={e => (e.target.style.borderColor = accentColor)}
                onBlur={e => (e.target.style.borderColor = '')}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password" required autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition"
                onFocus={e => (e.target.style.borderColor = accentColor)}
                onBlur={e => (e.target.style.borderColor = '')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          /* 2FA challenge step */
          <form
            onSubmit={handleTotpSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div className="text-center pb-1">
              <p className="text-2xl mb-2">🔐</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Two-Factor Verification</p>
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-3 text-xl text-gray-900 dark:text-white text-center tracking-[0.4em] font-mono focus:outline-none transition"
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '')}
              placeholder="000000"
            />

            <button
              type="submit" disabled={loading || totpCode.length !== 6}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('password'); setError(''); setTotpCode(''); setTempToken('') }}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              ← Back to login
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          {isSuperAdmin ? 'HRMS · Platform Administration' : `${branding.name} · Powered by HRMS`}
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
