import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import {
  MODULE_MONTHLY_PRICE_AUD,
  convertAUD,
  getCurrency,
  getCurrencySymbol,
  COUNTRIES,
} from '@/lib/integrations/payroll'

// GET /api/super-admin/cost-estimation
// Returns per-client cost breakdown for all active tenants
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const allTenants = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, tier: tenants.tier, settings: tenants.settings, isActive: tenants.isActive })
    .from(tenants)

  const results = await Promise.all(
    allTenants.map(async tenant => {
      const settings  = (tenant.settings ?? {}) as Record<string, unknown>
      const country   = (settings.country as string) ?? 'AU'
      const currency  = getCurrency(country)
      const symbol    = getCurrencySymbol(currency)
      const headcount = Number(settings.headcount ?? 0)

      // Get enabled modules for this tenant
      const mods = await db
        .select({ moduleId: tenantModules.moduleId, moduleName: tenantModules.moduleName, isEnabled: tenantModules.isEnabled })
        .from(tenantModules)
        .where(and(eq(tenantModules.tenantId, tenant.id), eq(tenantModules.isEnabled, true)))

      // Base per-seat monthly cost (sum of enabled module prices in AUD)
      const perSeatMonthlyAUD = mods.reduce((sum, m) => {
        return sum + (MODULE_MONTHLY_PRICE_AUD[m.moduleId] ?? 0)
      }, 0)

      // Total monthly AUD (per-seat × headcount, min 1)
      const effectiveHeadcount  = Math.max(headcount, 1)
      const totalMonthlyAUD     = perSeatMonthlyAUD * effectiveHeadcount
      const totalAnnualAUD      = totalMonthlyAUD * 12

      // Convert to client currency
      const perSeatMonthlyCurr = convertAUD(perSeatMonthlyAUD, currency)
      const totalMonthlyCurr   = convertAUD(totalMonthlyAUD, currency)
      const totalAnnualCurr    = convertAUD(totalAnnualAUD, currency)

      const countryName = COUNTRIES.find(c => c.code === country)?.name ?? country

      return {
        id:                 tenant.id,
        name:               tenant.name,
        slug:               tenant.slug,
        tier:               tenant.tier,
        isActive:           tenant.isActive,
        country,
        countryName,
        currency,
        symbol,
        headcount,
        enabledModules:     mods.length,
        moduleBreakdown:    mods.map(m => ({
          id:       m.moduleId,
          name:     m.moduleName,
          priceAUD: MODULE_MONTHLY_PRICE_AUD[m.moduleId] ?? 0,
        })),
        perSeatMonthlyAUD,
        perSeatMonthlyCurr,
        totalMonthlyAUD,
        totalMonthlyCurr,
        totalAnnualAUD,
        totalAnnualCurr,
      }
    })
  )

  return NextResponse.json({ clients: results })
}
