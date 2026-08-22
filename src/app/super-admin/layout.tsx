import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AdminDropdown from '@/components/auth/AdminDropdown'
import ThemeToggle from '@/components/ui/ThemeToggle'
import AdminSidebar from '@/components/super-admin/AdminSidebar'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Super Admin | HRMS' }

const ACCENT = '#7c3aed'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') redirect('/login')
  const name  = session.name  ?? 'Super Admin'
  const email = session.email ?? ''
  return (
    <div className="flex h-screen text-gray-900 dark:text-white overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center justify-between px-5 flex-shrink-0 backdrop-blur-md" style={{ background: 'rgba(7,12,26,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT}88)` }} />
            <span className="text-[13px] font-medium text-white/50 tracking-wide select-none">Platform Administration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="p-2 rounded-lg text-white/40 hover:text-yellow-400 hover:bg-white/[0.06] transition" />
            <AdminDropdown name={name} email={email} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5" style={{ background: '#050817' }}>{children}</main>
      </div>
    </div>
  )
}
