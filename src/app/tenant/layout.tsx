import { headers } from 'next/headers'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/tenant/NotificationBell'
import TenantSidebar from '@/components/tenant/TenantSidebar'
import TenantUserDropdown from '@/components/tenant/TenantUserDropdown'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const MODULE_NAV: Record<string, string> = {
  'employee-management':    '👥 Employees',
  'leave-management':       '🏖  Leave',
  'payroll':                '💰 Payroll',
  'document-management':    '📄 Documents',
  'compliance-screening':   '🔒 Compliance',
  'onboarding':             '🎉 Onboarding',
  'training-development':   '📚 Training',
  'performance-management': '📈 Performance',
  'recruitment':            '🔍 Recruitment',
  'whs-safety':             '🦺 Safety',
  'reporting-analytics':    '📊 Reports',
  'time-attendance':        '🕐 Timesheets',
  'communications':         '✉️  Communications',
}

async function getTenantConfig(slug: string) {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug))
    if (!tenant || !tenant.isActive) return null
    const modules = await db
      .select()
      .from(tenantModules)
      .where(and(eq(tenantModules.tenantId, tenant.id), eq(tenantModules.isEnabled, true)))
    return {
      tenant: {
        id: tenant.id, name: tenant.name, slug: tenant.slug,
        logoUrl: tenant.logoUrl, primaryColor: tenant.primaryColor, settings: tenant.settings,
      },
      enabledModules: modules.map(m => m.moduleName),
    }
  } catch { return null }
}

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const tenantSlug  = headersList.get('x-tenant-slug') ?? 'default'

  const [config, session] = await Promise.all([
    getTenantConfig(tenantSlug),
    getSession(),
  ])

  const tenant  = config?.tenant
  const enabledModules: string[] = config?.enabledModules ?? []

  // Theme
  const primaryColor = tenant?.primaryColor ?? '#1a4fff'
  const logoUrl      = tenant?.logoUrl ?? ''
  const tenantName   = tenant?.name ?? 'HRMS'
  const settings     = tenant?.settings
    ? (typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings)
    : {}
  const fontFamily   = settings.fontFamily   ?? 'Inter'
  const borderRadius = settings.borderRadius ?? '8px'
  const sidebarDark  = settings.sidebarDark  !== false
  const accentColor  = settings.accentColor  ?? '#7c3aed'
  const sidebarBg    = sidebarDark ? '#111827' : primaryColor

  // Session
  const userEmail   = session?.email ?? ''
  const userInitial = userEmail[0]?.toUpperCase() ?? 'U'
  const userRole    = (session as any)?.role_label ?? 'employee'

  // Build nav items from enabled modules
  const navItems = Object.entries(MODULE_NAV)
    .filter(([key]) => enabledModules.includes(key))
    .map(([key, label]) => ({ key, label }))

  return (
    <>
      <style>{`
        :root {
          --primary:  ${primaryColor};
          --accent:   ${accentColor};
          --radius:   ${borderRadius};
          --font:     ${fontFamily}, system-ui, sans-serif;
        }
        body { font-family: var(--font); }
      `}</style>

      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        {/* Sidebar — client component with active highlighting */}
        <TenantSidebar
          navItems={navItems}
          sidebarBg={sidebarBg}
          primaryColor={primaryColor}
          tenantName={tenantName}
          logoUrl={logoUrl}
          userEmail={userEmail}
          userInitial={userInitial}
          userRole={userRole}
          borderRadius={borderRadius}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header
            className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-900 shadow-sm shrink-0"
            style={{ borderBottom: `3px solid ${primaryColor}` }}
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{tenantName}</span>

            <div className="flex items-center gap-1.5">
              <ThemeToggle className="p-2 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition" />
              <NotificationBell primaryColor={primaryColor} />
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
              <TenantUserDropdown
                email={userEmail}
                role={userRole}
                initial={userInitial}
                primaryColor={primaryColor}
                borderRadius={borderRadius}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
