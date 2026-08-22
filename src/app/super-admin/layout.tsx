import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AdminLayoutShell from '@/components/super-admin/AdminLayoutShell'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Super Admin | HRMS' }

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || session.role !== 'super_admin') {
    redirect('/login')
  }

  const name  = session.name  ?? 'Super Admin'
  const email = session.email ?? ''

  return (
    <AdminLayoutShell name={name} email={email}>
      {children}
    </AdminLayoutShell>
  )
}
