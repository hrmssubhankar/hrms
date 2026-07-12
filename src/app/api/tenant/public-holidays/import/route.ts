import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicHolidays, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

/**
 * POST /api/tenant/public-holidays/import
 * Body: { year?: number; countryCode?: string }
 *
 * Imports public holidays from Nager.Date (https://date.nager.at) for the
 * given year and country. Defaults to tenant's country from settings and
 * the current year.
 *
 * Inserts each holiday only if an exact match (date + country + tenantId)
 * does not already exist (idempotent).
 *
 * Requires leave:approve permission (HR managers / directors).
 */
export async function POST(req: NextRequest) {
  const guard = await apiGuard('leave:approve')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json().catch(() => ({}))
  const year = Number(body.year ?? new Date().getFullYear())

  // Resolve country: body param → tenant settings → fallback AU
  let countryCode: string = (body.countryCode as string | undefined) ?? 'AU'
  if (!body.countryCode) {
    const [row] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, session.tenantId))
    const s = row?.settings as Record<string, unknown> | null
    countryCode = (s?.country as string | undefined) ?? 'AU'
  }

  // Nager.Date public API — no auth required
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
  let nagerHolidays: NagerHoliday[]
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `No holiday data found for country "${countryCode}" on Nager.Date.` },
          { status: 404 },
        )
      }
      return NextResponse.json(
        { error: `Nager.Date returned ${res.status}` },
        { status: 502 },
      )
    }
    nagerHolidays = (await res.json()) as NagerHoliday[]
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach Nager.Date API. Check server connectivity.' },
      { status: 502 },
    )
  }

  if (!Array.isArray(nagerHolidays) || nagerHolidays.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, total: 0 })
  }

  // Load existing dates so we can skip duplicates
  const existing = await db
    .select({ date: publicHolidays.date, country: publicHolidays.country })
    .from(publicHolidays)
    .where(eq(publicHolidays.tenantId, session.tenantId))

  const existingSet = new Set(existing.map(r => `${r.date}|${r.country}`))

  let imported = 0
  let skipped  = 0

  for (const h of nagerHolidays) {
    const key = `${h.date}|${countryCode}`
    if (existingSet.has(key)) {
      skipped++
      continue
    }

    await db.insert(publicHolidays).values({
      tenantId:   session.tenantId,
      name:       h.localName ?? h.name,
      date:       h.date,
      country:    countryCode,
      state:      null,
      isNational: h.global ?? true,
    })

    existingSet.add(key)
    imported++
  }

  return NextResponse.json({ imported, skipped, total: nagerHolidays.length, countryCode, year })
}

type NagerHoliday = {
  date:      string
  localName: string
  name:      string
  countryCode: string
  global:    boolean
  counties:  string[] | null
  launchYear: number | null
  types:     string[]
}
