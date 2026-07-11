'use client'

import { useEffect, useRef, useState } from 'react'

type Settings = {
  domain?: { customDomain?: string; subdomain?: string; wwwRedirect?: boolean; sslForced?: boolean }
  email?:  { smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string; fromName?: string; fromEmail?: string; replyTo?: string; useTLS?: boolean }
  notifications?: { emailOnboarding?: boolean; emailCompliance?: boolean; emailPayroll?: boolean; emailGrievance?: boolean; slackWebhook?: string }
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL = 'block text-xs font-medium text-gray-400 mb-1'

type Tab = 'branding' | 'domain' | 'email' | 'notifications'

export default function TenantSettingsPage() {
  const [tab,          setTab]          = useState<Tab>('branding')
  const [settings,     setSettings]     = useState<Settings>({})
  const [portalName,   setPortalName]   = useState('')
  const [logoUrl,      setLogoUrl]      = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1a4fff')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/tenant/config').then(r => r.json()).then(d => {
      const t = d.tenant ?? {}
      const s = t.settings ?? {}
      setPortalName(t.name ?? '')
      setLogoUrl(t.logoUrl ?? null)
      setPrimaryColor(t.primaryColor ?? '#1a4fff')
      setSettings(typeof s === 'string' ? JSON.parse(s) : s)
      setLoading(false)
    })
  }, [])

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) { setError('Logo must be under 512 KB'); return }
    setError(''); setLogoUploading(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string
      const res  = await fetch('/api/tenant/config', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: dataUrl }),
      })
      const data = await res.json()
      if (res.ok) { setLogoUrl(data.logoUrl); flash() }
      else setError(data.error ?? 'Upload failed')
      setLogoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function removeLogo() {
    await fetch('/api/tenant/config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: null }),
    })
    setLogoUrl(null); flash()
  }

  async function saveBranding() {
    setSaving(true); setError('')
    const res = await fetch('/api/tenant/config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: portalName }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Save failed')
    else flash()
    setSaving(false)
  }

  async function save(patch: Partial<Settings>) {
    setSaving(true)
    const merged = { ...settings, ...patch }
    await fetch('/api/tenant/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: patch }),
    })
    setSettings(merged)
    setSaving(false); flash()
  }

  const domain = settings.domain ?? {}
  const email  = settings.email  ?? {}
  const notif  = settings.notifications ?? {}

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Portal Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your branding, domain, email delivery, and notifications</p>
      </div>

      {saved && (
        <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-2.5 text-sm text-green-300">
          ✓ Settings saved — changes take effect on next page load
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2.5 text-sm text-red-300">{error}</div>
      )}

      {/* Tab nav */}
      <div className="flex border-b border-gray-800">
        {([
          { id: 'branding',      label: '🎨 Branding' },
          { id: 'domain',        label: '🌐 Domain' },
          { id: 'email',         label: '✉️ Email' },
          { id: 'notifications', label: '🔔 Notifications' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <>

          {/* ── BRANDING TAB ── */}
          {tab === 'branding' && (
            <div className="space-y-6">

              {/* Logo */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <div>
                  <p className="text-sm font-medium text-white mb-1">Organisation Logo</p>
                  <p className="text-xs text-gray-500">Shown in the sidebar header. PNG, JPG, SVG or WebP · max 512 KB · Recommended: transparent background, min 200px wide.</p>
                </div>

                <div className="flex items-start gap-5">
                  {/* Preview box */}
                  <div className="w-28 h-28 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                        style={{ background: primaryColor }}
                      >
                        {portalName[0]?.toUpperCase() ?? 'H'}
                      </div>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <input ref={fileRef} type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden" onChange={handleLogoFile} />
                    <button
                      onClick={() => { setError(''); fileRef.current?.click() }}
                      disabled={logoUploading}
                      className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-60 text-white text-sm px-4 py-2.5 rounded-lg transition"
                    >
                      {logoUploading ? '⏳ Uploading…' : '📁 Upload Logo'}
                    </button>
                    {logoUrl && (
                      <button onClick={removeLogo}
                        className="w-full border border-red-800 text-red-400 hover:bg-red-900/30 text-sm px-4 py-2.5 rounded-lg transition">
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Portal name */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <div>
                  <label className={LABEL}>Portal Display Name</label>
                  <input value={portalName}
                    onChange={e => setPortalName(e.target.value)}
                    placeholder="e.g. Yahweh Care" className={INPUT} />
                  <p className="text-xs text-gray-500 mt-1.5">
                    This name appears in the sidebar, login page, browser tab, and email notifications.
                    It replaces &quot;HRMS&quot; everywhere in your portal.
                  </p>
                </div>

                {/* Live sidebar preview */}
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  <div className="bg-gray-800 px-3 py-1.5 text-xs text-gray-500">Sidebar preview</div>
                  <div className="bg-gray-900 p-4">
                    <div className="w-56 bg-gray-800 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10" style={{ background: '#111827' }}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ background: primaryColor }}>
                              {portalName[0]?.toUpperCase() ?? 'H'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{portalName || 'Your Organisation'}</p>
                              <p className="text-xs text-white/50">HR Management</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 space-y-1">
                        {['Dashboard', 'Employees', 'Compliance'].map((item, i) => (
                          <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-white ${i === 0 ? 'opacity-100' : 'opacity-50'}`}
                            style={i === 0 ? { background: primaryColor } : {}}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={saveBranding} disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-lg">
                  {saving ? 'Saving…' : 'Save Display Name'}
                </button>
              </div>
            </div>
          )}

          {/* ── DOMAIN TAB ── */}
          {tab === 'domain' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
                <strong>DNS Configuration:</strong> Point your custom domain CNAME to{' '}
                <code className="bg-blue-900/50 px-1 rounded">cname.vercel-dns.com</code>, then enter it below.
                Vercel will automatically provision an SSL certificate.
              </div>

              <div>
                <label className={LABEL}>Custom Domain</label>
                <input value={domain.customDomain ?? ''} placeholder="hr.yourcompany.com.au"
                  onChange={e => setSettings(s => ({ ...s, domain: { ...s.domain, customDomain: e.target.value } }))}
                  className={INPUT} />
                <p className="text-xs text-gray-600 mt-1">Leave blank to use your default subdomain.</p>
              </div>

              <div>
                <label className={LABEL}>Subdomain</label>
                <div className="flex items-center gap-2">
                  <input value={domain.subdomain ?? ''} placeholder="yahweh-care"
                    onChange={e => setSettings(s => ({ ...s, domain: { ...s.domain, subdomain: e.target.value } }))}
                    className={`${INPUT} flex-1`} />
                  <span className="text-gray-500 text-sm shrink-0">.yourhrms.com.au</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={domain.wwwRedirect ?? true}
                    onChange={e => setSettings(s => ({ ...s, domain: { ...s.domain, wwwRedirect: e.target.checked } }))}
                    className="accent-purple-500 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-300">Redirect www → root domain</p>
                    <p className="text-xs text-gray-500">www.yourdomain.com → yourdomain.com</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={domain.sslForced ?? true}
                    onChange={e => setSettings(s => ({ ...s, domain: { ...s.domain, sslForced: e.target.checked } }))}
                    className="accent-purple-500 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-300">Force HTTPS</p>
                    <p className="text-xs text-gray-500">Redirect HTTP requests to HTTPS</p>
                  </div>
                </label>
              </div>

              <button onClick={() => save({ domain: settings.domain })} disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-lg">
                {saving ? 'Saving…' : 'Save Domain Settings'}
              </button>
            </div>
          )}

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-xs text-amber-300">
                Configure your own SMTP server to send system emails (onboarding, compliance alerts, etc.) from your own domain.
                Leave blank to use the platform default sender.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>From Name</label>
                  <input value={email.fromName ?? ''} placeholder="Yahweh Care HR"
                    onChange={e => setSettings(s => ({ ...s, email: { ...s.email, fromName: e.target.value } }))}
                    className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>From Email</label>
                  <input type="email" value={email.fromEmail ?? ''} placeholder="hr@yahwehcare.com.au"
                    onChange={e => setSettings(s => ({ ...s, email: { ...s.email, fromEmail: e.target.value } }))}
                    className={INPUT} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Reply-To Email</label>
                  <input type="email" value={email.replyTo ?? ''} placeholder="noreply@yahwehcare.com.au"
                    onChange={e => setSettings(s => ({ ...s, email: { ...s.email, replyTo: e.target.value } }))}
                    className={INPUT} />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">SMTP Server</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>SMTP Host</label>
                    <input value={email.smtpHost ?? ''} placeholder="smtp.gmail.com"
                      onChange={e => setSettings(s => ({ ...s, email: { ...s.email, smtpHost: e.target.value } }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Port</label>
                    <input type="number" value={email.smtpPort ?? 587} placeholder="587"
                      onChange={e => setSettings(s => ({ ...s, email: { ...s.email, smtpPort: Number(e.target.value) } }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>SMTP Username</label>
                    <input value={email.smtpUser ?? ''} placeholder="you@yourcompany.com"
                      onChange={e => setSettings(s => ({ ...s, email: { ...s.email, smtpUser: e.target.value } }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>SMTP Password</label>
                    <input type="password" value={email.smtpPass ?? ''} placeholder="••••••••"
                      onChange={e => setSettings(s => ({ ...s, email: { ...s.email, smtpPass: e.target.value } }))}
                      className={INPUT} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input type="checkbox" checked={email.useTLS ?? true}
                    onChange={e => setSettings(s => ({ ...s, email: { ...s.email, useTLS: e.target.checked } }))}
                    className="accent-purple-500 w-4 h-4" />
                  <span className="text-sm text-gray-300">Use TLS / STARTTLS</span>
                </label>
              </div>

              <button onClick={() => save({ email: settings.email })} disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-lg">
                {saving ? 'Saving…' : 'Save Email Settings'}
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {tab === 'notifications' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Notifications</p>
              <div className="space-y-3">
                {[
                  { key: 'emailOnboarding', label: 'New employee onboarding',       desc: 'Send welcome email when employee is onboarded' },
                  { key: 'emailCompliance', label: 'Compliance expiry alerts',       desc: 'Notify when WWCC/police check is expiring within 30 days' },
                  { key: 'emailPayroll',    label: 'Payroll approved notifications', desc: 'Notify employee when pay run is approved' },
                  { key: 'emailGrievance', label: 'Grievance lodged alerts',        desc: 'Alert HR Officer when a grievance is submitted' },
                ].map(n => (
                  <label key={n.key} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="accent-purple-500 w-4 h-4 mt-0.5"
                      checked={(notif as any)[n.key] ?? true}
                      onChange={e => setSettings(s => ({ ...s, notifications: { ...s.notifications, [n.key]: e.target.checked } }))} />
                    <div>
                      <p className="text-sm text-gray-300">{n.label}</p>
                      <p className="text-xs text-gray-500">{n.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Slack Integration</p>
                <label className={LABEL}>Incoming Webhook URL</label>
                <input value={notif.slackWebhook ?? ''} placeholder="https://hooks.slack.com/services/..."
                  onChange={e => setSettings(s => ({ ...s, notifications: { ...s.notifications, slackWebhook: e.target.value } }))}
                  className={INPUT} />
                <p className="text-xs text-gray-600 mt-1">
                  Create an Incoming Webhook in your Slack workspace to receive HR alerts in a channel.
                </p>
              </div>

              <button onClick={() => save({ notifications: settings.notifications })} disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-lg">
                {saving ? 'Saving…' : 'Save Notification Settings'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
