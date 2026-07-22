'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon, { type IconName } from '@/components/ui/Icon'

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean }

const NAV: NavItem[] = [
  { href: '/super-admin',                  label: 'Dashboard',       icon: 'dashboard',        exact: true },
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

export default function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Super Admin</p>
        <p className="text-base font-semibold text-white tracking-tight">HRMS</p>
        <p className="text-xs text-gray-500">Platform Control</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-purple-900/60 text-white border border-purple-700/50 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        HRMS Platform v1.0
      </div>
    </aside>
  )
}
