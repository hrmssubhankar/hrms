import type { Metadata } from 'next'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Super Admin | HRMS' }

const nav = [
  { href: '/super-admin',          label: '🏠 Dashboard' },
  { href: '/super-admin/clients',  label: '🏢 Clients' },
  { href: '/super-admin/admins',   label: '👤 Admins' },
  { href: '/super-admin/settings', label: '⚙️  Settings' },
]

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

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

        {/* User + Logout at bottom of sidebar */}
        <div className="px-3 py-3 border-t border-gray-800 space-y-2">
          {session && (
            <div className="px-3 py-2 rounded-lg bg-gray-800/50">
              <p className="text-xs font-medium text-white truncate">{session.name ?? 'Super Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{session.email}</p>
            </div>
          )}
          <LogoutButton className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition text-left" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm text-gray-400">Platform Administration</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-purple-900 text-purple-200 text-xs px-3 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              Super Admin
            </span>
            <LogoutButton className="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1 rounded hover:bg-red-900/20" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
