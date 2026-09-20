import { redirect } from 'next/navigation'

/**
 * /super-admin/dashboard — canonical alias that redirects to the root
 * dashboard at /super-admin.  This prevents a 404 when users (or sidebar
 * links) navigate to the /dashboard sub-path.
 */
export default function SuperAdminDashboardRedirect() {
  redirect('/super-admin')
}
