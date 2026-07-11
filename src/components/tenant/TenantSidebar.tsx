'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

type NavItem = { key: string; label: string }

type Props = {
  navItems:    NavItem[]
  sidebarBg:   string
  primaryColor:string
  tenantName:  string
  logoUrl:     string
  userEmail:   string
  userInitial: string
  userRole:    string
  borderRadius:string
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
}

export default function TenantSidebar({
  navItems, sidebarBg, primaryColor, tenantName,
  logoUrl, userEmail, userInitial, userRole, borderRadius,
}: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen]     = useState(false)
  const dropdownRef         = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function isActive(key: string) {
    return pathname.includes(`/tenant/${key}`)
  }

  const isDashboard = pathname === '/tenant/dashboard' || pathname === '/tenant'

  return (
    <aside className="w-64 flex flex-col shrink-0 select-none" style={{ background: sidebarBg, color: '#fff' }}>
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={tenantName} className="h-8 object-contain" />
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: primaryColor }}
            >
              {tenantName[0]}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{tenantName}</p>
              <p className="text-xs opacity-50">HR Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {/* Dashboard always first */}
        <Link
          href="/tenant/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
            isDashboard
              ? 'text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          style={isDashboard ? { background: primaryColor } : {}}
        >
          🏠 Dashboard
        </Link>

        {navItems.map(({ key, label }) => {
          const active = isActive(key)
          return (
            <Link
              key={key}
              href={`/tenant/${key}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? 'text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={active ? { background: primaryColor } : {}}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section at bottom — click to open dropdown */}
      <div
        ref={dropdownRef}
        className="relative px-3 pb-4 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Dropdown menu — appears above the card */}
        {open && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: sidebarBg, border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Link
              href="/tenant/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <span className="text-base">⚙️</span>
              Settings
            </Link>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-300/90 hover:text-red-200 hover:bg-red-900/20 transition text-left"
            >
              <span className="text-base">🚪</span>
              Sign out
            </button>
          </div>
        )}

        {/* User card — toggles dropdown */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition hover:bg-white/10 text-left"
          style={{ background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: primaryColor }}
          >
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{userEmail}</p>
            <p className="text-xs opacity-50">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          {/* Chevron */}
          <svg
            className="w-3.5 h-3.5 text-white/40 shrink-0 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
