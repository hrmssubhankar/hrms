import type { Metadata } from 'next'
import Link from 'next/link'
import AdminDropdown from '@/components/auth/AdminDropdown'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Super Admin | HRMS' }

const nav = [
  { href: '/super-admin',            label: '🏠 Dashboard'  },
  { href: '/super-admin/clients',    label: '🏢 Clients'    },
  { href: '/super-admin/billing',    label: '💳 Billing'    },
  { href: '/super-admin/audit-logs', label: '📋 Audit Logs' },
  { href: '/super-admin/admins',     label: '👤 Admins'     },
  { href: '/super-admin/settings',   label: '⚙️  Settings'  },
]

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const name    = session?.name  ?? 'Super Admin'
  const email   = session?.email ?? ''

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Super Admin</p>
          <p className="text-base font-semibold">HRMS</p>
          <p className="text-xs text-gray-400">Platform Control</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
          HRMS Platform v1.0
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm text-gray-400">Platform Administration</span>
          <div className="flex items-center gap-2">
            <ThemeToggle className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition" />
            <AdminDropdown name={name} email={email} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
