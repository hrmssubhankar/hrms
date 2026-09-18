import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { getSession } from '@/lib/auth/session'

// Monthly price per tier in AUD — mirrors TIER_CONFIG in /super-admin/billing/page.tsx
const TIER_PRICE: Record<string, number> = {
  starter:      57,
  professional: 120,
  enterprise:   217,
}

// GET /api/super-admin/billing — per-tenant subscriptions plus MRR summary
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db
      .select({
        id: tenants.id, name: tenants.name, slug: tenants.slug,
        tier: tenants.tier, isActive: tenants.isActive, createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(tenants.createdAt)

    const subscriptions = rows.map(t => ({ ...t, monthlyPrice: TIER_PRICE[t.tier] ?? 0 }))
    const active = subscriptions.filter(s => s.isActive)
    const mrr = active.reduce((sum, s) => sum + s.monthlyPrice, 0)

    const tiers: Record<string, { clients: number; revenue: number }> = {}
    for (const tier of Object.keys(TIER_PRICE)) {
      const inTier = active.filter(s => s.tier === tier)
      tiers[tier] = { clients: inTier.length, revenue: inTier.length * TIER_PRICE[tier] }
    }

    return NextResponse.json({
      currency: 'AUD',
      summary: {
        mrr,
        annualRunRate: mrr * 12,
        activeSubscriptions: active.length,
        totalClients: subscriptions.length,
        avgRevenuePerClient: active.length ? Math.round(mrr / active.length) : 0,
      },
      tiers,
      subscriptions,
    })
  } catch (error) {
    console.error('GET /api/super-admin/billing error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 })
  }
}
