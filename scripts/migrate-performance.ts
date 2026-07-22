/**
 * Migration: Performance Reviews + Goals
 *
 * Run from project root:
 *   npx tsx scripts/migrate-performance.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const statements = [
  // ── Performance Reviews ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS performance_reviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id      VARCHAR(255),
    type             VARCHAR(50)  NOT NULL DEFAULT 'annual',
    status           VARCHAR(50)  NOT NULL DEFAULT 'scheduled',
    scheduled_date   DATE,
    completed_at     TIMESTAMPTZ,
    overall_rating   NUMERIC(3,1),
    kpis             JSONB        NOT NULL DEFAULT '[]',
    development_plan TEXT,
    outcome          TEXT,
    employee_input   TEXT,
    manager_input    TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,
  // Add updated_at to existing performance_reviews table if column doesn't already exist
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='performance_reviews' AND column_name='updated_at'
    ) THEN
      ALTER TABLE performance_reviews ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
  END $$`,
  `CREATE INDEX IF NOT EXISTS perf_reviews_tenant_idx   ON performance_reviews(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS perf_reviews_employee_idx ON performance_reviews(employee_id)`,
  `CREATE INDEX IF NOT EXISTS perf_reviews_status_idx   ON performance_reviews(status)`,
  `CREATE INDEX IF NOT EXISTS perf_reviews_type_idx     ON performance_reviews(type)`,

  // ── Performance Goals ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS performance_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    review_id       UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    target_date     DATE,
    status          VARCHAR(50)  NOT NULL DEFAULT 'active',
    progress        INTEGER      NOT NULL DEFAULT 0,
    self_rating     INTEGER,
    manager_rating  INTEGER,
    manager_note    TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS perf_goals_tenant_idx   ON performance_goals(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS perf_goals_employee_idx ON performance_goals(employee_id)`,
  `CREATE INDEX IF NOT EXISTS perf_goals_review_idx   ON performance_goals(review_id)`,
]

async function migrate() {
  const { neon } = await import('@neondatabase/serverless')
  const url = process.env.DATABASE_URL
  if (!url || url.includes('placeholder')) {
    console.error('ERROR: DATABASE_URL not set. Check .env.local exists.')
    process.exit(1)
  }

  const sql = neon(url)
  console.log('Running migration: performance_reviews, performance_goals…\n')

  for (const stmt of statements) {
    const label = stmt.trim().split('\n')[0].slice(0, 60)
    process.stdout.write(`  ${label}… `)
    await sql(stmt)
    console.log('OK')
  }

  console.log('\nMigration complete.')
  process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })
