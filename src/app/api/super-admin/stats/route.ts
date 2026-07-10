import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, users, tenantModules } from '@/lib/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [tenantRows] = await db
      .select({ total: count() })
      .from(tenants)

    const [userRows] = await db
      .select({ total: count() })
      .from(users)

    const [activeUserRows] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.isActive, true))

    const [enabledModuleRows] = await db
      .select({ total: count() })
      .from(tenantModules)
      .where(eq(tenantModules.isEnabled, true))

    const tierCounts = await db
      .select({ tier: tenants.tier, count: count() })
      .from(tenants)
      .groupBy(tenants.tier)

    const tierMap: Record<string, number> = {}
    for (const row of tierCounts) {
      tierMap[row.tier] = Number(row.count)
    }

    return NextResponse.json({
      totalTenants:      Number(tenantRows.total),
      totalUsers:        Number(userRows.total),
      activeUsers:       Number(activeUserRows.total),
      enabledModules:    Number(enabledModuleRows.total),
      tierBreakdown: {
        starter:      tierMap['starter']      ?? 0,
        professional: tierMap['professional'] ?? 0,
        enterprise:   tierMap['enterprise']   ?? 0,
      },
    })
  } catch (err) {
    console.error('GET /api/super-admin/stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
