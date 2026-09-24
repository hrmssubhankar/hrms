'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  email:        string
  role:         string
  initial:      string
  primaryColor: string
  borderRadius: string
}

const ROLE_LABELS: Record<string, string> = {
  director:           'Director',
  hr_officer:         'HR Officer',
  compliance_manager: 'Compliance Manager',
  operations_manager: 'Operations Manager',
  team_leader:        'Team Leader',
  payroll_officer:    'Payroll Officer',
  employee:           'Employee',
  auditor:            'Auditor',
  it_admin:           'IT Admin',
  contractor:         'Contractor',
}

export default function TenantUserDropdown({ email, role, initial, primaryColor, borderRadius }: Props) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [isDark, setIsDark]     = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const router     = useRouter()

  /* Track dark mode */
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  /* Close on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Position the fixed panel below the trigger */
  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
  }

  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  /* Solid hardcoded colors — no CSS variables so nothing can bleed through */
  const panelBg     = isDark ? '#0f172a' : '#ffffff'
  const panelFg     = isDark ? '#f1f5f9' : '#111827'
  const dividerClr  = isDark ? '#1e293b' : '#f3f4f6'
  const itemHoverBg = isDark ? '#1e293b' : '#f9fafb'
  const mutedFg     = isDark ? '#94a3b8' : '#6b7280'

  return (
    <div ref={triggerRef} className="relative">

      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 ${open ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: primaryColor, borderRadius }}
        >
          {initial}
        </div>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          style={{ color: mutedFg }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel uses position:fixed to escape the header's backdrop-filter stacking context */}
      {open && (
        <div
          style={{
            position:     'fixed',
            top:          panelPos.top,
            right:        panelPos.right,
            width:        240,
            background:   panelBg,
            color:        panelFg,
            borderRadius: 12,
            border:       `1px solid ${dividerClr}`,
            boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            zIndex:       9999,
            overflow:     'hidden',
          }}
        >
          {/* Identity header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dividerClr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: panelFg, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
                <p style={{ fontSize: 11, color: mutedFg, margin: 0 }}>{ROLE_LABELS[role] ?? role}</p>
              </div>
            </div>
          </div>

          {/* Menu rows */}
          <div style={{ padding: '4px 0' }}>
            {[
              { label: 'My Profile', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { label: 'Change Password', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: mutedFg, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = itemHoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div style={{ borderTop: `1px solid ${dividerClr}`, padding: '4px 0' }}>
            <button
              onClick={logout}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', opacity: loading ? 0.6 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              {loading ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
