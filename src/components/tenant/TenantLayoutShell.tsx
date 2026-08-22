'use client'

import { useState } from 'react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/tenant/NotificationBell'
import TenantSidebar from '@/components/tenant/TenantSidebar'
import TenantUserDropdown from '@/components/tenant/TenantUserDropdown'

type NavItem = { key: string; label: string }

type Props = {
  children:     React.ReactNode
  navItems:     NavItem[]
  sidebarBg:    string
  primaryColor: string
  tenantName:   string
  logoUrl:      string
  userEmail:    string
  userInitial:  string
  userRole:     string
  borderRadius: string
}

export default function TenantLayoutShell({
  children, navItems, sidebarBg, primaryColor, tenantName,
  logoUrl, userEmail, userInitial, userRole, borderRadius,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f3f4f8] dark:bg-[#050817] overflow-hidden">
      {/* Sidebar — hidden on mobile unless open */}
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
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 md:px-5 bg-white/80 dark:bg-[#070c1a]/90 backdrop-blur-md shrink-0 border-b border-black/[0.06] dark:border-white/[0.05]">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition mr-1"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div
              className="w-1.5 h-4 rounded-full hidden md:block"
              style={{ background: `linear-gradient(180deg, ${primaryColor}, ${primaryColor}60)` }}
            />
            <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight truncate max-w-[120px] sm:max-w-none">
              {tenantName}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition" />
            <NotificationBell primaryColor={primaryColor} />
            <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.08] mx-1" />
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 bg-[#f3f4f8] dark:bg-[#050817]">
          {children}
        </main>
      </div>
    </div>
  )
}
