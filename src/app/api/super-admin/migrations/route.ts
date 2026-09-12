/**
 * /api/super-admin/migrations
 *
 * GET  — list all migrations with applied / pending status
 * POST — apply all pending migrations in order
 *
 * Why this exists:
 *   All tenants (YC, YPC, and every future client) share one Supabase database.
 *   A single migration run here covers every tenant automatically — no need to
 *   log into multiple Supabase projects or run SQL manually.
 *
 * Access: super_admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, sql as pgClient } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { MIGRATIONS } from '@/lib/db/migration-registry'

/** Ensure the tracker table exists before any other query. */
async function ensureTrackerTable() {
  await pgClient`
    CREATE TABLE IF NOT EXISTS hrms_schema_migrations (
      name        VARCHAR(200) PRIMARY KEY,
      applied_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      duration_ms INTEGER
    )
  `
}

/** Return the set of already-applied migration names. */
async function getAppliedNames(): Promise<Set<string>> {
  const rows = await pgClient<{ name: string }[]>`
    SELECT name FROM hrms_schema_migrations
  `
  return new Set(rows.map(r => r.name))
}

// ── GET /api/super-admin/migrations ──────────────────────────────────────────
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTrackerTable()
    const applied = await getAppliedNames()

    const migrations = MIGRATIONS.map(m => ({
      name:        m.name,
      description: m.description,
      status:      applied.has(m.name) ? 'applied' : 'pending',
    }))

    const pending = migrations.filter(m => m.status === 'pending').length
    const total   = migrations.length

    return NextResponse.json({
      summary: { total, applied: total - pending, pending },
      migrations,
    })
  } catch (err: any) {
    console.error('GET /api/super-admin/migrations error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to list migrations' }, { status: 500 })
  }
}

// ── POST /api/super-admin/migrations ─────────────────────────────────────────
// Body (optional): { names?: string[] }  — run only specific migrations
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTrackerTable()
    const applied = await getAppliedNames()

    // Optional: caller can request specific migrations by name; default = all pending
    let body: { names?: string[] } = {}
    try { body = await req.json() } catch { /* body is optional */ }

    const toRun = MIGRATIONS.filter(m => {
      if (applied.has(m.name)) return false             // already applied
      if (body.names?.length) return body.names.includes(m.name)
      return true                                        // all pending
    })

    if (toRun.length === 0) {
      return NextResponse.json({ message: 'All migrations already applied', results: [] })
    }

    const results: Array<{
      name: string
      status: 'applied' | 'error'
      durationMs: number
      error?: string
    }> = []

    for (const migration of toRun) {
      const start = Date.now()
      try {
        // Execute the migration SQL
        await pgClient.unsafe(migration.sql)

        const durationMs = Date.now() - start

        // Record it in the tracker
        await pgClient`
          INSERT INTO hrms_schema_migrations (name, applied_at, duration_ms)
          VALUES (${migration.name}, NOW(), ${durationMs})
          ON CONFLICT (name) DO NOTHING
        `

        results.push({ name: migration.name, status: 'applied', durationMs })
        console.log(`✅ Migration applied: ${migration.name} (${durationMs}ms)`)
      } catch (err: any) {
        const durationMs = Date.now() - start
        console.error(`❌ Migration failed: ${migration.name}`, err.message)
        results.push({
          name:       migration.name,
          status:     'error',
          durationMs,
          error:      err.message ?? 'Unknown error',
        })
        // Stop on first failure — preserve order integrity
        break
      }
    }

    const appliedCount = results.filter(r => r.status === 'applied').length
    const failedCount  = results.filter(r => r.status === 'error').length

    return NextResponse.json(
      {
        message:  failedCount > 0
          ? `Applied ${appliedCount} migration(s), then stopped on error`
          : `Applied ${appliedCount} migration(s) successfully`,
        results,
      },
      { status: failedCount > 0 ? 207 : 200 },
    )
  } catch (err: any) {
    console.error('POST /api/super-admin/migrations error:', err)
    return NextResponse.json({ error: err.message ?? 'Migration run failed' }, { status: 500 })
  }
}
