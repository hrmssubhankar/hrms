/**
 * Migration: Screening, Competency, Contracting, Referral tables
 * Run: npx tsx scripts/migrate-new-modules.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const statements = [
  // ── Enums (idempotent) ────────────────────────────────────────────────────
  `DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('green','amber','red','pending');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,

  // ── screening_records ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS screening_records (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_type       VARCHAR(100) NOT NULL,
    status           compliance_status NOT NULL DEFAULT 'pending',
    reference_number VARCHAR(100),
    issued_date      DATE,
    expiry_date      DATE,
    document_id      UUID REFERENCES documents(id),
    notes            TEXT,
    verified_by      UUID,
    verified_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS screening_tenant_idx   ON screening_records(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS screening_employee_idx ON screening_records(employee_id)`,
  `CREATE INDEX IF NOT EXISTS screening_status_idx   ON screening_records(status)`,
  `CREATE INDEX IF NOT EXISTS screening_expiry_idx   ON screening_records(expiry_date)`,

  // ── competencies ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS competencies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE INDEX IF NOT EXISTS competencies_tenant_idx ON competencies(tenant_id)`,

  // ── competency_assessments ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS competency_assessments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    competency_id  UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    assessor_id    UUID REFERENCES employees(id),
    outcome        VARCHAR(50),
    assessed_at    TIMESTAMPTZ,
    expiry_date    DATE,
    evidence       TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS comp_assess_tenant_idx     ON competency_assessments(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS comp_assess_employee_idx   ON competency_assessments(employee_id)`,
  `CREATE INDEX IF NOT EXISTS comp_assess_competency_idx ON competency_assessments(competency_id)`,

  // ── contracts ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type            VARCHAR(100) NOT NULL,
    pdf_url         TEXT,
    signed_pdf_url  TEXT,
    status          VARCHAR(50) NOT NULL DEFAULT 'draft',
    sent_at         TIMESTAMPTZ,
    signed_at       TIMESTAMPTZ,
    signature_ip    VARCHAR(45),
    signature_data  TEXT,
    tfn_provided    BOOLEAN NOT NULL DEFAULT FALSE,
    super_fund      VARCHAR(200),
    bank_bsb        VARCHAR(10),
    bank_account    VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS contracts_tenant_idx   ON contracts(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS contracts_employee_idx ON contracts(employee_id)`,
  `CREATE INDEX IF NOT EXISTS contracts_status_idx   ON contracts(status)`,

  // ── referrals ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS referrals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    referrer_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    referred_employee_id UUID REFERENCES employees(id),
    referred_name       VARCHAR(200),
    referred_email      VARCHAR(255),
    status              VARCHAR(50) NOT NULL DEFAULT 'pending',
    bonus_amount        NUMERIC(10,2),
    bonus_paid_at       TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS referrals_tenant_idx   ON referrals(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id)`,
]

async function migrate() {
  const { neon } = await import('@neondatabase/serverless')
  const url = process.env.DATABASE_URL
  if (!url || url.includes('placeholder')) {
    console.error('❌  DATABASE_URL missing or placeholder')
    process.exit(1)
  }
  const sql = neon(url)
  console.log(`Running ${statements.length} statements…\n`)
  for (const stmt of statements) {
    const label = stmt.trim().split('\n')[0].slice(0, 70)
    process.stdout.write(`  ${label}… `)
    await sql(stmt)
    console.log('✓')
  }
  console.log('\n✅  Migration complete')
  process.exit(0)
}

migrate().catch(err => {
  console.error('\n❌  Migration failed:', err.message ?? err)
  process.exit(1)
})
