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

// Maps SOW module ID → { route slug, sidebar label }
const MODULE_ROUTES: Record<number, { key: string; label: string }> = {
  1:  { key: 'dashboard',             label: '🏠 Dashboard' },
  2:  { key: 'employee-management',   label: '👥 Employees' },
  3:  { key: 'roles',                 label: '🔑 Roles & Access' },
  4:  { key: 'audit-logs',            label: '📋 Audit Logs' },
  5:  { key: 'documents',             label: '📄 Documents' },
  6:  { key: 'compliance',             label: '🔒 Compliance' },
  7:  { key: 'compliance',            label: '🔒 Compliance' },
  8:  { key: 'compliance',            label: '🔒 Compliance' },
  9:  { key: 'onboarding',            label: '🎉 Onboarding' },
  10: { key: 'training',              label: '📚 Training' },
  11: { key: 'competencies',          label: '🎯 Competencies' },
  12: { key: 'supervision',           label: '👁 Supervision' },
  13: { key: 'workforce-planning',    label: '📐 Workforce' },
  14: { key: 'recruitment',           label: '🔍 Recruitment' },
  15: { key: 'contracts',             label: '📝 Contracts' },
  16: { key: 'performance',           label: '📈 Performance' },
  17: { key: 'whs',                   label: '🦺 Safety' },
  18: { key: 'grievances',            label: '⚖️  Grievances' },
  19: { key: 'separation',            label: '🚪 Separation' },
  20: { key: 'analytics',             label: '📊 Analytics' },
  21: { key: 'benefits',              label: '🎁 Benefits' },
  22: { key: 'recognition',           label: '🏆 Recognition' },
  23: { key: 'referrals',             label: '🤝 Referrals' },
  24: { key: 'dei',                   label: '🌍 DEI' },
  25: { key: 'engagement',            label: '💬 Engagement' },
  26: { key: 'assets',                label: '🖥 Assets' },
  27: { key: 'rostering',             label: '🕐 Rostering' },
  28: { key: 'payroll',               label: '💰 Payroll' },
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
      enabledModuleIds: modules.map(m => m.moduleId),
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
  const enabledModuleIds: number[] = config?.enabledModuleIds ?? []

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
  const userRole    = session?.userRole ?? 'employee'

  // Build nav items from enabled module IDs (skip Dashboard — always shown separately)
  const navItems = Object.entries(MODULE_ROUTES)
    .filter(([id]) => enabledModuleIds.includes(Number(id)) && Number(id) !== 1)
    .map(([, { key, label }]) => ({ key, label }))

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
