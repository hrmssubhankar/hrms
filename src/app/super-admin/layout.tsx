import type { Metadata } from 'next'
import AdminDropdown from '@/components/auth/AdminDropdown'
import ThemeToggle from '@/components/ui/ThemeToggle'
import AdminSidebar from '@/components/super-admin/AdminSidebar'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Super Admin | HRMS' }

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const name    = session?.name  ?? 'Super Admin'
  const email   = session?.email ?? ''

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <AdminSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm text-gray-500 dark:text-gray-400">Platform Administration</span>
          <div className="flex items-center gap-2">
            <ThemeToggle className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" />
            <AdminDropdown name={name} email={email} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
