'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/super-admin',                  label: '🏠 Dashboard',       exact: true },
  { href: '/super-admin/clients',          label: '🏢 Clients' },
  { href: '/super-admin/intake',           label: '📋 Intake Form' },
  { href: '/super-admin/cost-estimation',  label: '💰 Cost Estimation' },
  { href: '/super-admin/billing',          label: '💳 Billing' },
  { href: '/super-admin/modules',          label: '🧩 Modules' },
  { href: '/super-admin/audit-logs',       label: '🗂️  Audit Logs' },
  { href: '/super-admin/announcements',    label: '📢 Announcements' },
  { href: '/super-admin/system',           label: '🖥️  System Health' },
  { href: '/super-admin/admins',           label: '👤 Admins' },
  { href: '/super-admin/settings',         label: '⚙️  Settings' },
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
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Super Admin</p>
        <p className="text-base font-semibold text-white">HRMS</p>
        <p className="text-xs text-gray-400">Platform Control</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? 'bg-purple-900/60 text-white border border-purple-700/50'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
        HRMS Platform v1.0
      </div>
    </aside>
  )
}
