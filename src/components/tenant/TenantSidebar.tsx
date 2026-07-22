'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import Icon, { type IconName } from '@/components/ui/Icon'

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

/** Strip any leading emoji + whitespace from label strings coming from layout */
function cleanLabel(label: string): string {
  return label.replace(/^[\p{Emoji}\s]+/u, '').trim()
}

/** Map nav key → icon name */
const NAV_ICONS: Record<string, IconName> = {
  'dashboard':          'dashboard',
  'employee-management':'users',
  'roles':              'key',
  'audit-logs':         'clipboard-list',
  'documents':          'document',
  'compliance':         'lock',
  'onboarding':         'onboarding',
  'training':           'training',
  'competencies':       'target',
  'supervision':        'eye',
  'workforce-planning': 'org-chart',
  'recruitment':        'search',
  'contracts':          'file-contract',
  'performance':        'chart-line',
  'whs':                'shield',
  'grievances':         'balance-scale',
  'separation':         'door-exit',
  'analytics':          'bar-chart',
  'benefits':           'gift',
  'recognition':        'trophy',
  'referrals':          'handshake',
  'dei':                'globe',
  'engagement':         'chat',
  'assets':             'monitor',
  'rostering':          'rostering',
  'timesheets':         'timesheet',
  'payroll':            'currency',
  'leave':              'calendar',
  'public-holidays':    'calendar',
  'reports':            'bar-chart',
  'screening':          'screening',
  'my-profile':         'user-circle',
  'my-payslips':        'payslip',
  'my-documents':       'folder',
}

export default function TenantSidebar({
  navItems, sidebarBg, primaryColor, tenantName,
  logoUrl, userEmail, userInitial, userRole, borderRadius,
}: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen]     = useState(false)
  const [isDark, setIsDark] = useState(false)
  const dropdownRef         = useRef<HTMLDivElement>(null)

  // Detect dark mode and react to changes
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Theme-aware sidebar colours
  const bg          = isDark ? sidebarBg : '#ffffff'
  const textColor   = isDark ? '#ffffff' : '#111827'
  const dividerClr  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const hoverBg     = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)'
  const mutedText   = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)'

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function isActive(key: string) {
    return pathname.includes(`/tenant/${key}`)
  }

  const isDashboard = pathname === '/tenant/dashboard' || pathname === '/tenant'

  function NavLink({ navKey, label }: { navKey: string; label: string }) {
    const active = navKey === 'dashboard' ? isDashboard : isActive(navKey)
    const icon   = NAV_ICONS[navKey] ?? 'document'
    return (
      <Link
        href={`/tenant/${navKey}`}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition"
        style={active
          ? { background: primaryColor, color: '#ffffff', fontWeight: 500 }
          : { color: textColor, opacity: isDark ? 0.65 : 0.75 }
        }
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.opacity = '1' } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.opacity = isDark ? '0.65' : '0.75' } }}
      >
        <Icon name={icon} className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
        <span className="truncate">{cleanLabel(label)}</span>
      </Link>
    )
  }

  return (
    <aside className="w-64 flex flex-col shrink-0 select-none transition-colors" style={{ background: bg, color: textColor }}>
      {/* Brand */}
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${dividerClr}` }}>
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
              <p className="text-sm font-bold leading-tight tracking-tight">{tenantName}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: mutedText }}>HRMS</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <NavLink navKey="dashboard" label="Dashboard" />

        {navItems.map(({ key, label }) => (
          <NavLink key={key} navKey={key} label={label} />
        ))}

        {/* Self-Service */}
        <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${dividerClr}` }}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: mutedText }}>
            My Portal
          </p>
          {[
            { key: 'my-profile',   label: 'My Profile' },
            { key: 'my-payslips',  label: 'My Payslips' },
            { key: 'my-documents', label: 'My Documents' },
          ].map(({ key, label }) => (
            <NavLink key={key} navKey={key} label={label} />
          ))}
        </div>
      </nav>

      {/* User section */}
      <div
        ref={dropdownRef}
        className="relative px-3 pb-4 pt-3"
        style={{ borderTop: `1px solid ${dividerClr}` }}
      >
        {open && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: bg, border: `1px solid ${dividerClr}` }}
          >
            <Link
              href="/tenant/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm transition"
              style={{ color: textColor }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon name="gear" className="w-4 h-4 shrink-0" />
              Settings
            </Link>
            <div style={{ borderTop: `1px solid ${dividerClr}` }} />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left"
            >
              <Icon name="logout" className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left"
          style={{ background: open ? hoverBg : `${hoverBg.replace('0.05', '0.03').replace('0.10', '0.07')}` }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = open ? hoverBg : 'transparent' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: primaryColor }}
          >
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: textColor }}>{userEmail}</p>
            <p className="text-[11px]" style={{ color: mutedText }}>{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <svg
            className="w-3.5 h-3.5 shrink-0 transition-transform"
            style={{ color: mutedText, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
