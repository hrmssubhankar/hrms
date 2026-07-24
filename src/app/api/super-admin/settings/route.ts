import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

/**
 * GET/PATCH /api/super-admin/settings
 *
 * Persists platform-wide config in a self-bootstrapping `platform_config`
 * table (key TEXT PK, value JSONB).  Falls back to DEFAULTS on first run.
 */

const DEFAULTS: Record<string, unknown> = {
  platformName:      'HRMS',
  supportEmail:      'support@yahwehhrms.com',
  defaultTier:       'starter',
  maxUsersPerTenant: 500,
  smtpHost:          'smtp-relay.brevo.com',
  smtpPort:          587,
  smtpUser:          '',
  smtpPass:          '',
  fromEmail:         'noreply@yahwehhrms.com',
  fromName:          'HRMS Platform',
  sessionHours:      8,
  require2FA:        false,
  auditRetainDays:   365,
  maintenanceMode:   false,
  maintenanceMsg:    'The platform is undergoing scheduled maintenance. We will be back shortly.',
}

async function bootstrap() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS platform_config (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `)
}

function guard(session: any): boolean {
  return !session || session.role !== 'super_admin'
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrap()

  const result = await db.execute(sql`SELECT key, value FROM platform_config`)
  const stored: Record<string, unknown> = {}
  for (const row of result.rows as { key: string; value: unknown }[]) {
    stored[row.key] = row.value
  }

  return NextResponse.json({ settings: { ...DEFAULTS, ...stored } })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrap()

  const body = await req.json() as Record<string, unknown>

  for (const [key, value] of Object.entries(body)) {
    // Only persist whitelisted keys
    if (!(key in DEFAULTS)) continue
    await db.execute(sql`
      INSERT INTO platform_config (key, value)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `)
  }

  return NextResponse.json({ ok: true })
}
