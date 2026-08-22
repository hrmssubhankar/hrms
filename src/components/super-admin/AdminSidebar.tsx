'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon, { type IconName } from '@/components/ui/Icon'

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean }

const NAV: NavItem[] = [
  { href: '/super-admin',                  label: 'Dashboard',       icon: 'dashboard',      exact: true },
  { href: '/super-admin/clients',          label: 'Clients',         icon: 'building' },
  { href: '/super-admin/intake',           label: 'Intake Form',     icon: 'intake' },
  { href: '/super-admin/cost-estimation',  label: 'Cost Estimation', icon: 'cost' },
  { href: '/super-admin/billing',          label: 'Billing',         icon: 'billing' },
  { href: '/super-admin/modules',          label: 'Modules',         icon: 'puzzle' },
  { href: '/super-admin/audit-logs',       label: 'Audit Logs',      icon: 'clipboard-list' },
  { href: '/super-admin/announcements',    label: 'Announcements',   icon: 'megaphone' },
  { href: '/super-admin/system',           label: 'System Health',   icon: 'server' },
  { href: '/super-admin/admins',           label: 'Admins',          icon: 'admin' },
  { href: '/super-admin/settings',         label: 'Settings',        icon: 'gear' },
]

const ACCENT = '#7c3aed'

export default function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 flex flex-col h-full shrink-0 select-none bg-[#070c1a] dark:bg-[#070c1a] border-r border-white/[0.055]">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/[0.055]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, boxShadow: `0 0 12px ${ACCENT}50` }}>
            ⚡
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white leading-tight tracking-tight">Super Admin</p>
            <p className="text-[10px] font-medium tracking-widest uppercase text-purple-400/70">Platform Control</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 py-[7px] pr-3 rounded-lg text-[13px] transition-all duration-150"
              style={active ? {
                background: `linear-gradient(90deg, ${ACCENT}25, ${ACCENT}10)`,
                borderLeft: `2px solid ${ACCENT}`,
                color: '#ffffff',
                fontWeight: 600,
                paddingLeft: '10px',
              } : {
                color: 'rgba(226,232,244,0.6)',
                paddingLeft: '12px',
              }}
              onMouseEnter={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.05)'
                  el.style.color = '#e2e8f4'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'rgba(226,232,244,0.6)'
                }
              }}>
              <span style={active ? { color: ACCENT } : {}}>
                <Icon name={item.icon} className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.6} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.055]">
        <p className="text-[11px] text-slate-600 font-medium">HRMS Platform v1.0</p>
      </div>
    </aside>
  )
}
