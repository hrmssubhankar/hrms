'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Client = {
  id: string
  name: string
  slug: string
  tier: string
  isActive: boolean
  primaryColor: string
  logoUrl: string | null
  createdAt: string
}

const TIER_COLORS: Record<string, string> = {
  enterprise:   'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200',
  professional: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
  starter:      'bg-gray-200 dark:bg-gray-700 text-gray-200',
}

export default function ClientsPage() {
  const [clients, setClients]           = useState<Client[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/super-admin/clients')
      .then(r => r.json())
      .then(d => { setClients(d.clients ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/super-admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    setClients(c => c.map(x => x.id === id ? { ...x, isActive: !current } : x))
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/super-admin/clients/${id}`, { method: 'DELETE' })
    setClients(c => c.filter(x => x.id !== id))
  }

  async function loginAsTenant(clientId: string, clientName: string) {
    if (!confirm(`Open ${clientName}'s portal as impersonated user? You will get a 1-hour session.`)) return
    setImpersonating(clientId)
    try {
      const res  = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: clientId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Impersonation failed'); return }

      // Open the tenant portal's /api/auth/impersonate URL in a new tab.
      // That route sets the session cookie on the *tenant* domain and
      // redirects to /tenant/dashboard — fixing the cross-domain cookie issue.
      window.open(data.redirectTo, '_blank')
    } catch {
      alert('Failed to impersonate tenant')
    } finally {
      setImpersonating(null)
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} · {clients.filter(c => c.isActive).length} active</p>
        </div>
        <Link
          href="/super-admin/clients/new"
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Client
        </Link>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search clients by name or slug…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />

      {loading ? (
        <div className="text-gray-600 dark:text-gray-400 text-sm">Loading clients…</div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Client</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug / URL</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tier</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Theme</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No clients yet.{' '}
                    <Link href="/super-admin/clients/new" className="text-purple-600 dark:text-purple-400 hover:underline">Add one →</Link>
                  </td>
                </tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition ${i % 2 === 0 ? '' : 'bg-white dark:bg-gray-900/50'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name}
                          className="w-8 h-8 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 p-0.5 shrink-0" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-900 dark:text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: c.primaryColor || '#6d28d9' }}
                        >
                          {c.name[0]}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                          Since {new Date(c.createdAt).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-purple-700 dark:text-purple-300 text-xs">{c.slug}</code>
                    <p className="text-gray-500 text-xs mt-0.5 dark:text-gray-400">{c.slug}.yourdomain.com</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[c.tier] ?? TIER_COLORS.starter}`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(c.id, c.isActive)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition ${
                        c.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-red-100 dark:bg-red-900 hover:text-red-700 dark:text-red-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-green-100 dark:bg-green-900 hover:text-green-700 dark:text-green-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-600"
                        style={{ backgroundColor: c.primaryColor || '#6d28d9' }}
                        title={c.primaryColor}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{c.primaryColor || 'default'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/super-admin/clients/${c.id}`}         className="text-xs text-blue-400 hover:text-blue-700 dark:text-blue-300 font-medium">Edit</Link>
                      <Link href={`/super-admin/clients/${c.id}/users`}   className="text-xs text-green-400 hover:text-green-700 dark:text-green-300 font-medium">Users</Link>
                      <Link href={`/super-admin/clients/${c.id}/modules`} className="text-xs text-purple-400 hover:text-purple-700 dark:text-purple-300 font-medium">Modules</Link>
                      <Link href={`/super-admin/clients/${c.id}?tab=theme`} className="text-xs text-pink-400 hover:text-pink-700 dark:text-pink-300 font-medium">Theme</Link>
                      <button
                        onClick={() => loginAsTenant(c.id, c.name)}
                        disabled={impersonating === c.id || !c.isActive}
                        className="text-xs text-yellow-400 hover:text-yellow-700 dark:text-yellow-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        title={c.isActive ? 'Open this tenant\'s portal as an impersonated session' : 'Client is inactive'}
                      >
                        {impersonating === c.id ? '…' : 'Login as'}
                      </button>
                      <button
                        onClick={() => deleteClient(c.id, c.name)}
                        className="text-xs text-red-400 hover:text-red-700 dark:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
