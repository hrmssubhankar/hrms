'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const FONT_OPTIONS = [
  { value: 'Inter',     label: 'Inter (default)' },
  { value: 'Poppins',  label: 'Poppins' },
  { value: 'Roboto',   label: 'Roboto' },
  { value: 'DM Sans',  label: 'DM Sans' },
  { value: 'Nunito',   label: 'Nunito' },
]

const RADIUS_OPTIONS = [
  { value: '0',    label: 'Sharp' },
  { value: '4px',  label: 'Subtle' },
  { value: '8px',  label: 'Rounded' },
  { value: '12px', label: 'Soft' },
  { value: '9999px', label: 'Pill' },
]

const DARK_MODES = [
  { value: 'light', label: '☀️ Light only' },
  { value: 'dark',  label: '🌙 Dark only' },
  { value: 'auto',  label: '⚡ System auto' },
]

export default function ThemePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [theme, setTheme] = useState({
    primaryColor:   '#1a4fff',
    accentColor:    '#7c3aed',
    logoUrl:        '',
    fontFamily:     'Inter',
    borderRadius:   '8px',
    darkMode:       'light',
    sidebarDark:    true,
  })

  useEffect(() => {
    fetch(`/api/super-admin/clients/${id}`)
      .then(r => r.json())
      .then(data => {
        const t = data.tenant
        setTenantName(t?.name ?? '')
        if (t?.settings) {
          try {
            const s = typeof t.settings === 'string' ? JSON.parse(t.settings) : t.settings
            setTheme(prev => ({ ...prev, ...s }))
          } catch {}
        }
        if (t?.primaryColor) setTheme(prev => ({ ...prev, primaryColor: t.primaryColor }))
        if (t?.logoUrl) setTheme(prev => ({ ...prev, logoUrl: t.logoUrl }))
        setLoading(false)
      })
  }, [id])

  async function saveTheme() {
    setSaving(true)
    await fetch(`/api/super-admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryColor: theme.primaryColor,
        logoUrl: theme.logoUrl,
        settings: theme,
      }),
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div className="text-gray-400">Loading…</div>

  // Compute preview text color (contrast check)
  const previewBg = theme.primaryColor

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Theme Customiser</h1>
        <p className="text-gray-400 text-sm mt-1">
          Live preview of <span className="text-purple-300 font-medium">{tenantName}</span>&#39;s brand
        </p>
      </div>

      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-sm text-green-300">Theme saved successfully.</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5 bg-gray-900 border border-gray-800 rounded-xl p-6">
          {/* Primary colour */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={e => setTheme(t => ({ ...t, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={e => setTheme(t => ({ ...t, primaryColor: e.target.value }))}
                className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Accent colour */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Accent Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.accentColor}
                onChange={e => setTheme(t => ({ ...t, accentColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={e => setTheme(t => ({ ...t, accentColor: e.target.value }))}
                className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL</label>
            <input
              type="url"
              value={theme.logoUrl}
              onChange={e => setTheme(t => ({ ...t, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Font */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTheme(t => ({ ...t, fontFamily: f.value }))}
                  style={{ fontFamily: f.value }}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition ${
                    theme.fontFamily === f.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Button / Card Radius</label>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setTheme(t => ({ ...t, borderRadius: r.value }))}
                  className={`flex-1 px-2 py-2 border text-xs transition ${
                    theme.borderRadius === r.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                  style={{ borderRadius: r.value }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Colour Mode</label>
            <div className="flex gap-2">
              {DARK_MODES.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setTheme(t => ({ ...t, darkMode: d.value }))}
                  className={`flex-1 px-2 py-2 rounded-lg border text-xs transition ${
                    theme.darkMode === d.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar dark */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Dark Sidebar</p>
              <p className="text-xs text-gray-500">Use dark background for navigation</p>
            </div>
            <button
              type="button"
              onClick={() => setTheme(t => ({ ...t, sidebarDark: !t.sidebarDark }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${theme.sidebarDark ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${theme.sidebarDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl overflow-hidden border border-gray-800 shadow-xl" style={{ fontFamily: theme.fontFamily }}>
          {/* Miniature HRMS shell */}
          <div className="flex h-72">
            {/* Sidebar */}
            <div
              className="w-36 flex flex-col text-white text-xs shrink-0"
              style={{ background: theme.sidebarDark ? '#111827' : previewBg }}
            >
              <div className="px-3 py-3 border-b border-white/10">
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt="Logo" className="h-5 object-contain" />
                ) : (
                  <div className="font-bold text-sm truncate">{tenantName || 'Client HRMS'}</div>
                )}
              </div>
              {['Dashboard', 'Employees', 'Leave', 'Payroll', 'Documents'].map(item => (
                <div
                  key={item}
                  className="px-3 py-1.5 opacity-80 hover:opacity-100 cursor-pointer"
                  style={item === 'Dashboard' ? { background: 'rgba(255,255,255,0.15)' } : {}}
                >
                  {item}
                </div>
              ))}
            </div>
            {/* Main */}
            <div className="flex-1 bg-white flex flex-col">
              {/* Header */}
              <div className="h-8 flex items-center px-3 border-b border-gray-100 justify-between">
                <span className="text-xs font-semibold text-gray-700">Dashboard</span>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: previewBg }}
                />
              </div>
              {/* Content */}
              <div className="flex-1 p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {['48 Staff', '3 On Leave', '2 Reviews'].map((s, i) => (
                    <div
                      key={i}
                      className="rounded p-2 text-white text-xs font-semibold"
                      style={{
                        background: i === 0 ? previewBg : i === 1 ? theme.accentColor : '#64748b',
                        borderRadius: theme.borderRadius,
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 pt-1">Recent Activity</div>
                <div className="space-y-1">
                  {['John Smith — Leave Approved', 'Maria Garcia — Onboarded'].map(l => (
                    <div key={l} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 truncate">{l}</div>
                  ))}
                </div>
                <button
                  className="mt-1 text-xs text-white px-3 py-1 font-medium"
                  style={{ background: previewBg, borderRadius: theme.borderRadius }}
                >
                  + Add Employee
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-xs text-gray-500">
            Live preview · {theme.fontFamily} · radius {theme.borderRadius}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveTheme}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
        >
          {saving ? 'Saving…' : 'Save Theme'}
        </button>
        <button
          onClick={() => router.push('/super-admin/clients')}
          className="border border-gray-700 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded-lg transition"
        >
          Done
        </button>
      </div>
    </div>
  )
}
