'use client'

import { useEffect, useState, useCallback } from 'react'

type Profile = {
  id:             string
  employeeNumber: string
  firstName:      string
  lastName:       string
  preferredName:  string | null
  email:          string
  phone:          string | null
  address:        string | null
  dateOfBirth:    string | null
  gender:         string | null
  photoUrl:       string | null
  entityName:     string | null
  employmentType: string
  startDate:      string
  isActive:       boolean
}

type EmergencyContact = {
  id:           string
  name:         string
  relationship: string | null
  phone:        string | null
  email:        string | null
  isPrimary:    boolean
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
const LABEL = 'block text-xs font-medium text-gray-400 mb-1'
const ROW   = 'flex justify-between items-center py-2.5 border-b border-gray-800 last:border-0'

// ── 2FA Section ───────────────────────────────────────────────────────────────
type TotpStep = 'idle' | 'setup' | 'disable'

function TwoFactorSection() {
  const [enabled,      setEnabled]      = useState<boolean | null>(null)
  const [step,         setStep]         = useState<TotpStep>('idle')
  const [qrCode,       setQrCode]       = useState('')
  const [secret,       setSecret]       = useState('')
  const [code,         setCode]         = useState('')
  const [msg2fa,       setMsg2fa]       = useState('')
  const [busy,         setBusy]         = useState(false)

  const refreshStatus = useCallback(() => {
    fetch('/api/auth/totp/status')
      .then(r => r.json())
      .then(d => setEnabled(d.totpEnabled ?? false))
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  async function startSetup() {
    setBusy(true); setMsg2fa('')
    const res  = await fetch('/api/auth/totp/setup')
    const data = await res.json()
    if (!res.ok) { setMsg2fa(data.error ?? 'Failed to generate QR code'); setBusy(false); return }
    setQrCode(data.qrCodeDataUrl)
    setSecret(data.secret)
    setCode('')
    setStep('setup')
    setBusy(false)
  }

  async function verifySetup() {
    if (!code.trim()) { setMsg2fa('Enter the 6-digit code from your authenticator app.'); return }
    setBusy(true); setMsg2fa('')
    const res  = await fetch('/api/auth/totp/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, code: code.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg2fa(data.error ?? 'Verification failed'); setBusy(false); return }
    setMsg2fa('✓ 2FA enabled successfully.')
    setStep('idle'); setEnabled(true); setCode(''); setQrCode(''); setSecret('')
    setBusy(false)
  }

  async function disableTotp() {
    if (!code.trim()) { setMsg2fa('Enter your current 6-digit code to confirm.'); return }
    setBusy(true); setMsg2fa('')
    const res  = await fetch('/api/auth/totp/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg2fa(data.error ?? 'Disable failed'); setBusy(false); return }
    setMsg2fa('2FA has been disabled.')
    setStep('idle'); setEnabled(false); setCode('')
    setBusy(false)
  }

  function cancelStep() { setStep('idle'); setCode(''); setMsg2fa(''); setQrCode(''); setSecret('') }

  if (enabled === null) return null  // still loading

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Two-Factor Authentication</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${enabled ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
          {enabled ? '🔐 Enabled' : 'Disabled'}
        </span>
      </div>

      {msg2fa && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm border ${msg2fa.startsWith('✓') ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'}`}>
          {msg2fa}
        </div>
      )}

      {step === 'idle' && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {enabled
              ? 'Your account is protected with an authenticator app (Google Authenticator, Authy, etc.).'
              : 'Add an extra layer of security. You\'ll need an authenticator app (Google Authenticator, Authy, etc.).'}
          </p>
          <button
            onClick={enabled ? () => { setStep('disable'); setCode(''); setMsg2fa('') } : startSetup}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              enabled
                ? 'border border-red-700 text-red-400 hover:bg-red-900/20'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {busy ? 'Loading…' : enabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </>
      )}

      {step === 'setup' && qrCode && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="TOTP QR Code" width={180} height={180} />
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Can&apos;t scan? Enter the secret manually: <code className="text-purple-400 font-mono">{secret}</code>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center tracking-widest font-mono focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-3">
            <button onClick={verifySetup} disabled={busy || code.length !== 6}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
              {busy ? 'Verifying…' : 'Verify & Enable'}
            </button>
            <button onClick={cancelStep}
              className="px-5 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Enter the 6-digit code from your authenticator app to confirm disabling 2FA.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center tracking-widest font-mono focus:outline-none focus:border-red-500"
          />
          <div className="flex gap-3">
            <button onClick={disableTotp} disabled={busy || code.length !== 6}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
              {busy ? 'Processing…' : 'Confirm Disable'}
            </button>
            <button onClick={cancelStep}
              className="px-5 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [contacts,   setContacts]   = useState<EmergencyContact[]>([])
  const [linked,     setLinked]     = useState(true)
  const [loading,    setLoading]    = useState(true)

  // Edit form
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({ preferredName: '', phone: '', address: '' })
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    fetch('/api/tenant/my-profile')
      .then(r => r.json())
      .then(d => {
        setLinked(d.employeeLinked)
        if (d.profile) {
          setProfile(d.profile)
          setForm({
            preferredName: d.profile.preferredName ?? '',
            phone:         d.profile.phone         ?? '',
            address:       d.profile.address        ?? '',
          })
        }
        setContacts(d.emergencyContacts ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      const res  = await fetch('/api/tenant/my-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? 'Save failed'); return }
      setProfile(prev => prev ? { ...prev, ...data.profile } : prev)
      setMsg('✓ Profile updated successfully.')
      setEditing(false)
    } catch {
      setMsg('Save failed — please try again.')
    } finally {
      setSaving(false)
    }
  }

  function fmt(dateStr: string | null | undefined) {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">👤</div>
          <p className="text-sm">Loading your profile…</p>
        </div>
      </div>
    )
  }

  if (!linked || !profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-5xl mb-4">🔗</p>
          <h2 className="text-lg font-semibold text-white mb-2">Profile Not Linked</h2>
          <p className="text-gray-400 text-sm">
            Your user account has not yet been linked to an employee profile.
            Please contact your HR administrator to set this up.
          </p>
        </div>
      </div>
    )
  }

  const employmentTypeLabel: Record<string, string> = {
    full_time:  'Full-Time', part_time: 'Part-Time',
    casual:     'Casual',    contractor: 'Contractor',
    volunteer:  'Volunteer',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.firstName} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.preferredName || profile.firstName} {profile.lastName}
            </h1>
            <p className="text-sm text-gray-400">
              #{profile.employeeNumber} · {profile.entityName ?? 'HRMS'} ·{' '}
              <span className={`${profile.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        {!editing && (
          <button
            onClick={() => { setEditing(true); setMsg('') }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-purple-600 text-purple-400 hover:bg-purple-900/20 transition"
          >
            ✏ Edit Contact Info
          </button>
        )}
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm border ${msg.startsWith('✓') ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'}`}>
          {msg}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-gray-900 border border-purple-800/50 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Update Contact Information</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className={LABEL}>Preferred Name</label>
              <input type="text" value={form.preferredName} onChange={e => setForm(f => ({ ...f, preferredName: e.target.value }))}
                className={INPUT} placeholder={profile.firstName} />
            </div>
            <div>
              <label className={LABEL}>Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={INPUT} placeholder="+61 4XX XXX XXX" />
            </div>
            <div>
              <label className={LABEL}>Residential Address</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={INPUT + ' min-h-[70px] resize-none'} placeholder="Street, Suburb, State, Postcode" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="px-5 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg">
                Cancel
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-600 mt-3">
            Name, employment type, salary, and start date are managed by HR and cannot be self-updated.
          </p>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h2>
        <div className={ROW}><span className="text-gray-500 text-sm">Full Name</span><span className="text-white text-sm font-medium">{profile.firstName} {profile.lastName}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Preferred Name</span><span className="text-white text-sm">{profile.preferredName || '—'}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Email</span><span className="text-white text-sm">{profile.email}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Phone</span><span className="text-white text-sm">{profile.phone || '—'}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Address</span><span className="text-white text-sm text-right max-w-xs">{profile.address || '—'}</span></div>
        {profile.dateOfBirth && (
          <div className={ROW}><span className="text-gray-500 text-sm">Date of Birth</span><span className="text-white text-sm">{fmt(profile.dateOfBirth)}</span></div>
        )}
      </div>

      {/* Employment Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Employment Details</h2>
        <div className={ROW}><span className="text-gray-500 text-sm">Employee Number</span><span className="text-white text-sm font-mono">#{profile.employeeNumber}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Organisation</span><span className="text-white text-sm">{profile.entityName || '—'}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Employment Type</span><span className="text-white text-sm">{employmentTypeLabel[profile.employmentType] ?? profile.employmentType}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Start Date</span><span className="text-white text-sm">{fmt(profile.startDate)}</span></div>
        <div className={ROW}><span className="text-gray-500 text-sm">Status</span>
          <span className={`text-sm px-2 py-0.5 rounded-full border ${profile.isActive ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-red-900/40 text-red-300 border-red-800'}`}>
            {profile.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Emergency Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">No emergency contacts on file. Contact HR to add them.</p>
        ) : (
          <div className="space-y-4">
            {contacts.map(c => (
              <div key={c.id} className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-white text-sm">{c.name}</p>
                  {c.isPrimary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-700 text-purple-300">Primary</span>
                  )}
                </div>
                {c.relationship && <p className="text-xs text-gray-500 mb-1">{c.relationship}</p>}
                <div className="flex gap-4 text-xs text-gray-400">
                  {c.phone && <span>📞 {c.phone}</span>}
                  {c.email && <span>✉ {c.email}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <TwoFactorSection />

    </div>
  )
}
