/**
 * Migration: Rostering & Timesheets module
 *
 * Run from project root:
 *   npx tsx scripts/migrate-rostering.ts
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL!)

  const statements = [
    // ── participants table ────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS participants (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      first_name      VARCHAR(100) NOT NULL,
      last_name       VARCHAR(100) NOT NULL,
      preferred_name  VARCHAR(100),
      ndis_number     VARCHAR(20),
      date_of_birth   DATE,
      address         TEXT,
      phone           VARCHAR(20),
      email           VARCHAR(255),
      support_level   VARCHAR(100),
      funding_body    VARCHAR(100) DEFAULT 'NDIS',
      plan_start_date DATE,
      plan_end_date   DATE,
      notes           TEXT,
      is_active       BOOLEAN NOT NULL DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE INDEX IF NOT EXISTS participants_tenant_idx ON participants(tenant_id)`,

    // ── shifts: new columns ───────────────────────────────────────────────────
    `ALTER TABLE shifts ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES participants(id)`,
    `ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_type VARCHAR(100) DEFAULT 'standard'`,
    `ALTER TABLE shifts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`,
    `ALTER TABLE shifts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,

    // rename status default from 'scheduled' to 'draft' for new rows — existing rows keep their value
    `ALTER TABLE shifts ALTER COLUMN status SET DEFAULT 'draft'`,

    // ── shifts: indexes ───────────────────────────────────────────────────────
    `CREATE INDEX IF NOT EXISTS shifts_tenant_idx   ON shifts(tenant_id)`,
    `CREATE INDEX IF NOT EXISTS shifts_employee_idx ON shifts(employee_id)`,
    `CREATE INDEX IF NOT EXISTS shifts_time_idx     ON shifts(start_time, end_time)`,

    // ── timesheets: new columns ───────────────────────────────────────────────
    `ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS break_minutes    INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS notes            TEXT`,
    `ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejected_reason  TEXT`,
    `ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT now()`,
    `ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()`,

    // ── timesheets: indexes ───────────────────────────────────────────────────
    `CREATE INDEX IF NOT EXISTS timesheets_tenant_idx   ON timesheets(tenant_id)`,
    `CREATE INDEX IF NOT EXISTS timesheets_employee_idx ON timesheets(employee_id)`,
  ]

  console.log(`Running ${statements.length} migration statements…`)
  let ok = 0
  for (const stmt of statements) {
    try {
      await sql(stmt)
      console.log(`  ✓ ${stmt.slice(0, 70).replace(/\s+/g, ' ')}…`)
      ok++
    } catch (err: any) {
      console.error(`  ✗ ${stmt.slice(0, 70).replace(/\s+/g, ' ')}…\n    ${err.message}`)
    }
  }
  console.log(`\n${ok}/${statements.length} statements succeeded.`)
}

main().catch(err => { console.error(err); process.exit(1) })
