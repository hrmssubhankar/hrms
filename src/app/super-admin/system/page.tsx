'use client'

import { useEffect, useState, useCallback } from 'react'

type Check = { status: 'ok' | 'warn' | 'error'; message: string; latencyMs?: number }
type HealthData = {
  status: 'ok' | 'warn' | 'error'
  checks: Record<string, Check>
  responseMs: number
  timestamp: string
  platform: {
    nodeVersion: string
    nextVersion: string
    environment: string
    appUrl: string
  }
}

const STATUS_STYLES = {
  ok:    { dot: 'bg-green-400',  badge: 'bg-green-900/40 text-green-300 border-green-700',  label: 'Healthy' },
  warn:  { dot: 'bg-yellow-400', badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-700', label: 'Warning' },
  error: { dot: 'bg-red-400',    badge: 'bg-red-900/40 text-red-300 border-red-700',         label: 'Error' },
}

const CHECK_LABELS: Record<string, string> = {
  database:    '🗄️  Database',
  auditLog:    '📋 Audit Log',
  environment: '🔐 Environment',
}

export default function SystemHealthPage() {
  const [data, setData]       = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/health')
      const json = await res.json()
      setData(json)
      setLastChecked(new Date())
    } catch {
      setData(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const s = data ? STATUS_STYLES[data.status] : STATUS_STYLES.error

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time platform status ·{' '}
            {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString('en-AU')}` : 'Checking…'}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? '⟳ Checking…' : '⟳ Refresh'}
        </button>
      </div>

      {/* Overall status banner */}
      {data && (
        <div className={`border rounded-xl p-5 flex items-center gap-4 ${s.badge}`}>
          <div className="relative">
            <div className={`w-4 h-4 rounded-full ${s.dot}`} />
            <div className={`w-4 h-4 rounded-full ${s.dot} absolute top-0 animate-ping opacity-60`} />
          </div>
          <div>
            <p className="font-semibold">Platform is {s.label}</p>
            <p className="text-xs opacity-70 mt-0.5">
              API response: {data.responseMs}ms · {new Date(data.timestamp).toLocaleString('en-AU')}
            </p>
          </div>
        </div>
      )}

      {/* Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data ? Object.entries(data.checks).map(([key, check]) => {
          const cs = STATUS_STYLES[check.status]
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-200">
                  {CHECK_LABELS[key] ?? key}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cs.badge}`}>
                  {cs.label}
                </span>
              </div>
              <p className="text-xs text-gray-400">{check.message}</p>
              {check.latencyMs !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Latency</span>
                    <span className={check.latencyMs < 300 ? 'text-green-400' : check.latencyMs < 1000 ? 'text-yellow-400' : 'text-red-400'}>
                      {check.latencyMs}ms
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${check.latencyMs < 300 ? 'bg-green-500' : check.latencyMs < 1000 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (check.latencyMs / 2000) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        }) : (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
            </div>
          ))
        )}
      </div>

      {/* Platform Info */}
      {data?.platform && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Platform Information</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Node.js',      value: data.platform.nodeVersion },
              { label: 'Next.js',      value: data.platform.nextVersion },
              { label: 'Environment',  value: data.platform.environment },
              { label: 'App URL',      value: data.platform.appUrl },
            ].map(row => (
              <div key={row.label} className="space-y-1">
                <p className="text-xs text-gray-500">{row.label}</p>
                <p className="text-sm text-gray-200 font-mono bg-gray-800 px-2 py-1 rounded truncate">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infrastructure summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Infrastructure Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Azure App Service',       role: 'Next.js + .NET 8 API hosting',   tier: 'Basic B3',        status: 'ok' as const },
            { name: 'Neon PostgreSQL',          role: 'Primary database + audit logs',  tier: 'Serverless',      status: 'ok' as const },
            { name: 'Azure Blob Storage',       role: 'Documents, PDFs, signatures',    tier: 'LRS ~1TB',        status: 'ok' as const },
            { name: 'Brevo SMTP',               role: 'Email notifications (300/day)',   tier: 'Free tier',       status: 'ok' as const },
            { name: 'Cloudflare',               role: 'CDN, SSL, DDoS protection',      tier: 'Free tier',       status: 'ok' as const },
            { name: 'GitHub Actions',           role: 'CI/CD pipeline',                 tier: '2000 min/mo free', status: 'ok' as const },
          ].map(svc => (
            <div key={svc.name} className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_STYLES[svc.status].dot}`} />
              <div>
                <p className="text-sm font-medium text-gray-200">{svc.name}</p>
                <p className="text-xs text-gray-500">{svc.role}</p>
                <p className="text-xs text-gray-600 mt-0.5">{svc.tier}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
