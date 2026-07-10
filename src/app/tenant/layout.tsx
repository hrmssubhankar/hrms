import { headers } from 'next/headers'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import { getSession } from '@/lib/auth/session'

// Module nav labels (only shown if enabled for tenant)
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
}

async function getTenantConfig(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/tenant/config?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
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

  // Theme values
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

  const navItems = Object.entries(MODULE_NAV).filter(([key]) => enabledModules.includes(key))

  // User initials for avatar
  const userEmail   = session?.email ?? ''
  const userInitial = userEmail[0]?.toUpperCase() ?? 'U'

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

      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 flex flex-col shrink-0" style={{ background: sidebarBg, color: '#fff' }}>
          {/* Brand */}
          <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-8 object-contain mb-1" />
            ) : (
              <p className="text-base font-bold">{tenantName}</p>
            )}
            <p className="text-xs opacity-60 mt-0.5">HR Management</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
            <Link
              href="/tenant/dashboard"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm opacity-90 hover:opacity-100 hover:bg-white/10 transition"
            >
              🏠 Dashboard
            </Link>
            {navItems.map(([key, label]) => (
              <Link
                key={key}
                href={`/tenant/${key}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm opacity-80 hover:opacity-100 hover:bg-white/10 transition"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* User + logout at bottom */}
          <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {userEmail && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: primaryColor }}
                >
                  {userInitial}
                </div>
                <p className="text-xs opacity-80 truncate">{userEmail}</p>
              </div>
            )}
            <LogoutButton className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-900/20 hover:text-red-200 transition text-left opacity-80 hover:opacity-100" />
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header
            className="h-14 flex items-center justify-between px-6 bg-white shadow-sm shrink-0"
            style={{ borderBottom: `3px solid ${primaryColor}` }}
          >
            <span className="text-sm font-semibold text-gray-700">{tenantName}</span>
            <div className="flex items-center gap-3">
              {userEmail && (
                <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
              )}
              <LogoutButton className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition" />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: primaryColor, borderRadius }}
              >
                {userInitial}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
