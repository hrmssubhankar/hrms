'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProvidersForCountry, type PayrollProvider } from '@/lib/integrations/payroll'

type IntegrationConfig = {
  enabled:    boolean
  apiKey?:    string
  orgId?:     string
  notes?:     string
  updatedAt?: string
}

export default function ClientIntegrationsPage() {
  const { id } = useParams<{ id: string }>()

  const [country,      setCountry]      = useState('AU')
  const [currency,     setCurrency]     = useState('AUD')
  const [tenantName,   setTenantName]   = useState('')
  const [integrations, setIntegrations] = useState<Record<string, IntegrationConfig>>({})
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState<string | null>(null)
  const [msg,          setMsg]          = useState('')
  const [configuring,  setConfiguring]  = useState<string | null>(null)
  const [draft,        setDraft]        = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/super-admin/clients/${id}/integrations`)
      .then(r => r.json())
      .then(d => {
        setCountry(d.country ?? 'AU')
        setCurrency(d.currency ?? 'AUD')
        setTenantName(d.tenantName ?? '')
        setIntegrations(d.integrations ?? {})
        setLoading(false)
      })
  }, [id])

  const providers = getProvidersForCountry(country)
  const otherProviders = providers.filter(p => !integrations[p.id]?.enabled)
  const connectedProviders = providers.filter(p => integrations[p.id]?.enabled)

  async function save(provider: PayrollProvider, config: Record<string, string>, enabled: boolean) {
    setSaving(provider.id); setMsg('')
    const res = await fetch(`/api/super-admin/clients/${id}/integrations`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ providerId: provider.id, config, enabled }),
    })
    const data = await res.json()
    if (res.ok) {
      setIntegrations(data.integrations ?? {})
      setMsg(`${provider.name} ${enabled ? 'connected' : 'updated'} successfully`)
      setConfiguring(null)
    } else {
      setMsg(`Error: ${data.error}`)
    }
    setSaving(null)
  }

  async function disconnect(provider: PayrollProvider) {
    if (!confirm(`Disconnect ${provider.name}? This will remove the stored credentials.`)) return
    setSaving(provider.id)
    await fetch(`/api/super-admin/clients/${id}/integrations`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ providerId: provider.id }),
    })
    setIntegrations(prev => {
      const next = { ...prev }
      delete next[provider.id]
      return next
    })
    setMsg(`${provider.name} disconnected`)
    setSaving(null)
  }

  function startConfig(p: PayrollProvider) {
    const existing = integrations[p.id] ?? {}
    setDraft({ apiKey: existing.apiKey ?? '', orgId: existing.orgId ?? '', notes: existing.notes ?? '' })
    setConfiguring(p.id)
  }

  if (loading) return <div className="text-gray-400 text-sm p-6">Loading integrations…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Payroll Integrations</h1>
        <p className="text-gray-400 text-sm mt-1">
          {tenantName} · <span className="text-purple-300">{country}</span> · {currency}
        </p>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm border ${msg.startsWith('') ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'}`}>
          {msg}
        </div>
      )}

      {providers.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No payroll providers are configured for country <strong className="text-white">{country}</strong>.</p>
          <p className="text-gray-500 text-xs mt-1">Update the client country in their profile to see available integrations.</p>
        </div>
      )}

      {/* Connected */}
      {connectedProviders.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Connected</h2>
          <div className="space-y-3">
            {connectedProviders.map(p => {
              const cfg = integrations[p.id]
              return (
                <div key={p.id} className="bg-gray-900 border border-green-800/50 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: p.color }}>{p.logo}</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 border border-green-700 text-green-300">● Connected</span>
                      <button onClick={() => startConfig(p)}
                        className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white transition">
                        Edit
                      </button>
                      <button onClick={() => disconnect(p)} disabled={saving === p.id}
                        className="text-xs px-3 py-1.5 rounded border border-red-800 text-red-400 hover:bg-red-900/20 transition disabled:opacity-50">
                        {saving === p.id ? '…' : 'Disconnect'}
                      </button>
                    </div>
                  </div>

                  {cfg?.updatedAt && (
                    <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(cfg.updatedAt).toLocaleDateString('en-AU')}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.features.map(f => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">{f}</span>
                    ))}
                  </div>

                  {/* Config form (inline) */}
                  {configuring === p.id && (
                    <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                      {p.authType === 'api_key' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">API Key</label>
                          <input type="password" value={draft.apiKey ?? ''} onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
                            placeholder="Enter API key…"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                        </div>
                      )}
                      {p.authType === 'oauth2' && (
                        <div className="bg-blue-950/40 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
                          OAuth2 connection is managed at the tenant level. The tenant connects via Settings → Integrations in their portal.
                          Record the Xero Tenant ID here if needed for reference.
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Organisation / Account ID</label>
                        <input value={draft.orgId ?? ''} onChange={e => setDraft(d => ({ ...d, orgId: e.target.value }))}
                          placeholder="Org or account identifier"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Notes</label>
                        <input value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                          placeholder="Any setup notes…"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => save(p, draft, true)} disabled={saving === p.id}
                          className="px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-60">
                          {saving === p.id ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setConfiguring(null)}
                          className="px-4 py-2 text-xs border border-gray-700 text-gray-400 hover:text-white rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available */}
      {otherProviders.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Available for {country}
          </h2>
          <div className="space-y-3">
            {otherProviders.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 opacity-80"
                      style={{ background: p.color }}>{p.logo}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.description}</p>
                      <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300">{p.website}</a>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                      {p.authType === 'oauth2' ? 'OAuth2' : p.authType === 'api_key' ? 'API Key' : 'Manual'}
                    </span>
                    <button onClick={() => { startConfig(p) }}
                      className="text-xs px-4 py-1.5 rounded-lg text-white font-medium transition hover:opacity-90"
                      style={{ background: p.color }}>
                      Connect
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {p.features.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">{f}</span>
                  ))}
                </div>

                {configuring === p.id && (
                  <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                    {p.authType === 'api_key' && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">API Key *</label>
                        <input type="password" value={draft.apiKey ?? ''} onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
                          placeholder={`Enter your ${p.name} API key…`}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                        <p className="text-xs text-gray-500 mt-1">
                          Find your API key at{' '}
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">{p.website}</a>
                        </p>
                      </div>
                    )}
                    {p.authType === 'oauth2' && (
                      <div className="bg-blue-950/40 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
                        <p className="font-semibold mb-1">OAuth2 Integration</p>
                        <p>The tenant connects their {p.name} account via their portal under Settings → Integrations.
                        Once connected, record their {p.name} Organisation ID below for reference.</p>
                      </div>
                    )}
                    {p.authType === 'manual' && (
                      <div className="bg-amber-950/40 border border-amber-800 rounded-lg p-3 text-xs text-amber-300">
                        This provider uses a manual export/import process. Configure the export settings and record the account details below.
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Organisation / Account ID</label>
                      <input value={draft.orgId ?? ''} onChange={e => setDraft(d => ({ ...d, orgId: e.target.value }))}
                        placeholder="Organisation or account identifier"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Notes</label>
                      <input value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                        placeholder="Setup notes, account manager name, etc."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => save(p, draft, true)} disabled={saving === p.id}
                        className="px-4 py-2 text-xs text-white rounded-lg font-medium disabled:opacity-60"
                        style={{ background: p.color }}>
                        {saving === p.id ? 'Connecting…' : `Connect ${p.name}`}
                      </button>
                      <button onClick={() => setConfiguring(null)}
                        className="px-4 py-2 text-xs border border-gray-700 text-gray-400 hover:text-white rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
