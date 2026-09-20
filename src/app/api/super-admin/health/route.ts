import { NextResponse } from 'next/server'
import { db, sql as pgClient } from '@/lib/db'
import { tenants, users, auditLogs } from '@/lib/db/schema'
import { count, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { MIGRATIONS } from '@/lib/db/migration-registry'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'warn' | 'error'; message: string; latencyMs?: number }> = {}

  // DB connectivity + latency
  // Thresholds: ok < 500 ms, warn < 2000 ms, error >= 2000 ms
  // (Supabase free-tier cold starts routinely hit 400–600 ms — 300 ms was too strict)
  try {
    const dbStart = Date.now()
    const [tenantCount] = await db.select({ total: count() }).from(tenants)
    const [userCount]   = await db.select({ total: count() }).from(users)
    const dbLatency = Date.now() - dbStart

    checks.database = {
      status: dbLatency < 500 ? 'ok' : dbLatency < 2000 ? 'warn' : 'error',
      message: `Connected · ${tenantCount.total} tenants · ${userCount.total} users`,
      latencyMs: dbLatency,
    }
  } catch (err: any) {
    checks.database = { status: 'error', message: err.message ?? 'Connection failed' }
  }

  // Audit log table
  try {
    const [last] = await db.select({ createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1)
    checks.auditLog = {
      status: 'ok',
      message: last ? `Last entry: ${new Date(last.createdAt).toLocaleString('en-AU')}` : 'No entries yet',
    }
  } catch {
    checks.auditLog = { status: 'error', message: 'Audit log table unreachable' }
  }

  // Environment — split required vs optional so optional absences don't
  // trigger a platform-level Warning that obscures real problems.
  const requiredEnv  = ['DATABASE_URL', 'JWT_SECRET', 'APP_URL']
  const optionalEnv  = ['RESEND_API_KEY', 'BLOB_READ_WRITE_TOKEN']
  const missingRequired = requiredEnv.filter(k => !process.env[k])
  const missingOptional = optionalEnv.filter(k => !process.env[k])

  if (missingRequired.length > 0) {
    checks.environment = {
      status: 'error',
      message: `Missing required env vars: ${missingRequired.join(', ')}`,
    }
  } else if (missingOptional.length > 0) {
    checks.environment = {
      status: 'ok',
      message: `All required vars set · optional not set: ${missingOptional.join(', ')} (email & file storage disabled)`,
    }
  } else {
    checks.environment = {
      status: 'ok',
      message: 'All env vars set',
    }
  }

  // Migration status
  try {
    await pgClient`
      CREATE TABLE IF NOT EXISTS hrms_schema_migrations (
        name        VARCHAR(200) PRIMARY KEY,
        applied_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        duration_ms INTEGER
      )
    `
    const rows = await pgClient<{ name: string }[]>`SELECT name FROM hrms_schema_migrations`
    const appliedNames = new Set(rows.map(r => r.name))
    const pendingCount = MIGRATIONS.filter(m => !appliedNames.has(m.name)).length
    checks.migrations = {
      status: pendingCount === 0 ? 'ok' : 'warn',
      message: pendingCount === 0
        ? `All ${MIGRATIONS.length} migrations applied`
        : `${pendingCount} migration(s) pending — visit /super-admin/migrations to apply`,
    }
  } catch (err: any) {
    checks.migrations = { status: 'error', message: err.message ?? 'Could not check migration status' }
  }

  const overallStatus = Object.values(checks).some(c => c.status === 'error')
    ? 'error'
    : Object.values(checks).some(c => c.status === 'warn')
    ? 'warn'
    : 'ok'

  return NextResponse.json({
    status: overallStatus,
    checks,
    responseMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    platform: {
      nodeVersion:  process.version,
      nextVersion:  '15.x',
      environment:  process.env.NODE_ENV ?? 'unknown',
      appUrl:       process.env.APP_URL ?? 'not set',
    },
  })
}
