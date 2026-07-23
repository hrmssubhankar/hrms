import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * Root route — redirect to the right entry point based on deployment type.
 *
 * Super-admin deployment (x-tenant-slug = 'admin') → /super-admin
 * Tenant deployment (any other slug)               → /login
 */
export default async function RootPage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug') ?? 'admin'

  if (slug === 'admin') {
    redirect('/super-admin')
  } else {
    redirect('/login')
  }
}
