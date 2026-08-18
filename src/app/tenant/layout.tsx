import { headers, cookies } from 'next/headers'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/tenant/NotificationBell'
import TenantSidebar from '@/components/tenant/TenantSidebar'
import TenantUserDropdown from '@/components/tenant/TenantUserDropdown'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { hasPermission, type Permission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

/**
 * Required permission to see each nav route.
 * null = always shown (e.g. dashboard).
 * Routes not listed default to hidden.
 */
const NAV_PERMISSION: Record<string, Permission | null> = {
  'dashboard':          null,
  'employee-management':'employees:read',   // further restricted below (not for employee/contractor)
  'roles':              'roles:read',
  'audit-logs':         'audit_logs:read',
  'documents':          'documents:read',
  'compliance':         'compliance:read',
  'onboarding':         'onboarding:read',
  'training':           'training:read',
  'competencies':       'competencies:read',
  'supervision':        'supervision:read',
  'workforce-planning': 'workforce_planning:read',
  'recruitment':        'recruitment:read',
  'contracts':          'contracts:read',
  'performance':        'performance:read',
  'whs':                'whs:read',
  'grievances':         'grievances:read',
  'separation':         'separation:read',
  'analytics':          'analytics:read',
  'benefits':           'benefits:read',
  'recognition':        'recognition:read',
  'referrals':          'referrals:read',
  'dei':                'dei:read',
  'engagement':         'engagement:read',
  'assets':             'assets:read',
  'rostering':          'rostering:read',
  'payroll':            'payroll:read',
  'leave':              'leave:read',
  'public-holidays':    'leave:read',
  'crm':                'crm:read',
  'expenses':           'expenses:read',
  'ndis-audits':        'ndis_audits:read',
  'ndis-incidents':     'ndis_incidents:read',
  'participants':       'participant_mgmt:read',
  'medication-health':  'medication_health:read',
  'incident-behaviour': 'incident_behaviour:read',
  'roster-shifts':      'roster_shifts:read',
  // Built-in routes (IDs 31+) — not controlled by tenant module toggles
  'timesheets':         'timesheets:read',
  'screening':          'compliance:read',
  'reports':            'analytics:read',
  'offer-letters':      'contracts:read',
}

// Maps SOW module ID → { route slug, sidebar label }
const MODULE_ROUTES: Record<number, { key: string; label: string }> = {
  1:  { key: 'dashboard',             label: 'Dashboard' },
  2:  { key: 'employee-management',   label: 'Employees' },
  3:  { key: 'roles',                 label: 'Roles & Access' },
  4:  { key: 'audit-logs',            label: 'Audit Logs' },
  5:  { key: 'documents',             label: 'Documents' },
  6:  { key: 'compliance',            label: 'Compliance' },
  7:  { key: 'compliance',            label: 'Compliance' },
  8:  { key: 'compliance',            label: 'Compliance' },
  9:  { key: 'onboarding',            label: 'Onboarding' },
  10: { key: 'training',              label: 'Training' },
  11: { key: 'competencies',          label: 'Competencies' },
  12: { key: 'supervision',           label: 'Supervision' },
  13: { key: 'workforce-planning',    label: 'Workforce' },
  14: { key: 'recruitment',           label: 'Recruitment' },
  15: { key: 'contracts',             label: 'Contracts' },
  16: { key: 'performance',           label: 'Performance' },
  17: { key: 'whs',                   label: 'Safety (WHS)' },
  18: { key: 'grievances',            label: 'Grievances' },
  19: { key: 'separation',            label: 'Separation' },
  20: { key: 'analytics',             label: 'Analytics' },
  21: { key: 'benefits',              label: 'Benefits' },
  22: { key: 'recognition',           label: 'Recognition' },
  23: { key: 'referrals',             label: 'Referrals' },
  24: { key: 'dei',                   label: 'DEI' },
  25: { key: 'engagement',            label: 'Engagement' },
  26: { key: 'assets',                label: 'Assets' },
  27: { key: 'rostering',             label: 'Rostering' },
  28: { key: 'payroll',               label: 'Payroll' },
  29: { key: 'leave',                 label: 'Leave Management' },
  30: { key: 'public-holidays',       label: 'Public Holidays' },
  // IDs 31+ are built-in routes (always visible, not toggled by tenant module settings)
  31: { key: 'timesheets',            label: 'Timesheets' },
  32: { key: 'screening',             label: 'Screening' },
  33: { key: 'reports',               label: 'Reports' },
  34: { key: 'offer-letters',         label: 'Offer Letters' },
  35: { key: 'crm',                   label: 'CRM' },
  36: { key: 'expenses',              label: 'Expenses' },
  37: { key: 'ndis-audits',           label: 'NDIS Audits' },
  38: { key: 'ndis-incidents',        label: 'Reportable Incidents' },
  39: { key: 'participants',          label: 'Participants' },
  40: { key: 'medication-health',     label: 'Medication & Health' },
  41: { key: 'incident-behaviour',    label: 'Incidents & Behaviour' },
  42: { key: 'roster-shifts',         label: 'Roster & Shifts' },
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
  const headersList  = await headers()
  const cookieStore  = await cookies()
  // Priority: request header (set by middleware) → cookie → deployment env var → 'default'
  const tenantSlug   =
    headersList.get('x-tenant-slug') ??
    cookieStore.get('tenant_slug')?.value ??
    process.env.NEXT_PUBLIC_TENANT_SLUG ??
    'default'

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
  // Deduplicate by key so sub-modules that share a route (e.g. compliance 6/7/8) appear once
  // Then filter by role permissions so each role only sees routes they can access
  const isRestrictedEmployee = userRole === 'employee' || userRole === 'contractor'
  const navItems = Object.entries(MODULE_ROUTES)
    .filter(([id]) => {
      const numId = Number(id)
      if (numId === 1) return false                      // Dashboard shown separately
      if (numId >= 31) return true                       // Built-in routes always included
      return enabledModuleIds.includes(numId)            // Tenant-toggled modules
    })
    .map(([, { key, label }]) => ({ key, label }))
    .filter((item, idx, arr) => arr.findIndex(x => x.key === item.key) === idx)
    .filter(({ key }) => {
      const requiredPerm = NAV_PERMISSION[key]
      // Route not in our map — hide it
      if (requiredPerm === undefined) return false
      // No permission required — always show
      if (requiredPerm === null) return true
      // employee-management: never for employee/contractor roles
      if (key === 'employee-management' && isRestrictedEmployee) return false
      // rostering: employees use My Schedule instead
      if (key === 'rostering' && isRestrictedEmployee) return false
      return hasPermission(userRole, requiredPerm)
    })

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
              <ThemeToggle className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition" />
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
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
