import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

const ALL_MODULES = [
  { id: 1,  name: 'Enterprise Dashboard',              category: 'Core' },
  { id: 2,  name: 'Employee Master Profiles',           category: 'Core' },
  { id: 3,  name: 'RBAC & Custom Authentication',       category: 'Core' },
  { id: 4,  name: 'Audit Logging',                     category: 'Core' },
  { id: 5,  name: 'Document Management System',         category: 'Core' },
  { id: 6,  name: 'Pre-Employment Screening',           category: 'Compliance' },
  { id: 7,  name: 'Compliance Lock System',             category: 'Compliance' },
  { id: 8,  name: 'Ongoing Compliance Tracking',        category: 'Compliance' },
  { id: 9,  name: 'Onboarding & Induction',             category: 'Compliance' },
  { id: 10, name: 'Training Management & LMS',          category: 'Learning' },
  { id: 11, name: 'Competency Management',              category: 'Learning' },
  { id: 12, name: 'Supervision Management',             category: 'Learning' },
  { id: 13, name: 'Workforce Planning & Role Design',   category: 'Talent' },
  { id: 14, name: 'Recruitment & Applicant Tracking',   category: 'Talent' },
  { id: 15, name: 'Employment Contracting & E-Sign',    category: 'Talent' },
  { id: 16, name: 'Probation & Performance Management', category: 'Performance' },
  { id: 17, name: 'WHS & Injury Management',            category: 'Safety' },
  { id: 18, name: 'Grievance & Investigation Mgmt',     category: 'Safety' },
  { id: 19, name: 'Separation & Exit Management',       category: 'Compliance' },
  { id: 20, name: 'Reporting & Analytics',              category: 'Intelligence' },
  { id: 21, name: 'Employee Experience & Benefits',     category: 'Experience' },
  { id: 22, name: 'Recognition & Rewards',              category: 'Experience' },
  { id: 23, name: 'Referral Program',                   category: 'Experience' },
  { id: 24, name: 'Diversity, Equity & Inclusion',      category: 'Experience' },
  { id: 25, name: 'Employee Voice & Engagement',        category: 'Experience' },
  { id: 26, name: 'Asset & Equipment Register',         category: 'Operations' },
  { id: 27, name: 'Rostering & Attendance Integration', category: 'Operations' },
  { id: 28, name: 'Payroll & Award Compliance',         category: 'Operations' },
]

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const allTenants = await db.select({ id: tenants.id, name: tenants.name, tier: tenants.tier }).from(tenants)
    const allModules = await db.select().from(tenantModules)

    // Per-module analytics
    const moduleStats = ALL_MODULES.map(mod => {
      const rows = allModules.filter(r => r.moduleId === mod.id)
      const enabled = rows.filter(r => r.isEnabled)
      const tenantNames = enabled.map(r => allTenants.find(t => t.id === r.tenantId)?.name ?? 'Unknown')
      return {
        ...mod,
        enabledCount: enabled.length,
        totalTenants: allTenants.length,
        percentage: allTenants.length ? Math.round((enabled.length / allTenants.length) * 100) : 0,
        enabledFor: tenantNames,
      }
    })

    return NextResponse.json({ modules: moduleStats, tenantCount: allTenants.length })
  } catch (err) {
    console.error('GET /api/super-admin/modules error:', err)
    return NextResponse.json({ error: 'Failed to fetch module stats' }, { status: 500 })
  }
}
