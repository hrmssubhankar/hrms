/**
 * Migration: Offer Letters, Promotion Requests, Separation Events
 *
 * Run from project root:
 *   npx tsx scripts/migrate-offer-promotion-separation.ts
 */
import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function migrate() {
  console.log('Running migration: offer_letters, promotion_requests, separation_events…\n')

  await db.execute(sql`
    -- ── Offer Letters ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS offer_letters (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      candidate_name    VARCHAR(255) NOT NULL,
      candidate_email   VARCHAR(255) NOT NULL,
      position          VARCHAR(255) NOT NULL,
      department        VARCHAR(255),
      employment_type   VARCHAR(50)  NOT NULL DEFAULT 'full_time',
      start_date        DATE,
      salary_amount     INTEGER,
      salary_cycle      VARCHAR(20)  NOT NULL DEFAULT 'annual',
      template_content  TEXT,
      pdf_url           TEXT,
      status            VARCHAR(50)  NOT NULL DEFAULT 'draft',
      sent_at           TIMESTAMPTZ,
      accepted_at       TIMESTAMPTZ,
      rejected_at       TIMESTAMPTZ,
      expires_at        TIMESTAMPTZ,
      acceptance_token  TEXT,
      recruitment_id    UUID,
      employee_id       UUID REFERENCES employees(id),
      created_by        VARCHAR(255),
      notes             TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS offer_letters_tenant_idx ON offer_letters(tenant_id);
    CREATE INDEX IF NOT EXISTS offer_letters_status_idx ON offer_letters(status);
    CREATE INDEX IF NOT EXISTS offer_letters_email_idx  ON offer_letters(candidate_email);

    -- ── Offer Letter Events ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS offer_letter_events (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      offer_id      UUID NOT NULL REFERENCES offer_letters(id) ON DELETE CASCADE,
      event         VARCHAR(100) NOT NULL,
      note          TEXT,
      performed_by  VARCHAR(255),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS offer_events_offer_idx ON offer_letter_events(offer_id);

    -- ── Promotion Requests ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS promotion_requests (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      raised_by_id     VARCHAR(255),
      raised_by_name   VARCHAR(255),
      current_title    VARCHAR(255),
      current_salary   INTEGER,
      proposed_title   VARCHAR(255) NOT NULL,
      proposed_salary  INTEGER,
      effective_date   DATE,
      justification    TEXT NOT NULL,
      status           VARCHAR(50) NOT NULL DEFAULT 'pending',
      reviewed_by      VARCHAR(255),
      reviewed_at      TIMESTAMPTZ,
      review_notes     TEXT,
      implemented_at   TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS promotions_tenant_idx   ON promotion_requests(tenant_id);
    CREATE INDEX IF NOT EXISTS promotions_employee_idx ON promotion_requests(employee_id);
    CREATE INDEX IF NOT EXISTS promotions_status_idx   ON promotion_requests(status);

    -- ── Promotion Events ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS promotion_events (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      promotion_id  UUID NOT NULL REFERENCES promotion_requests(id) ON DELETE CASCADE,
      event         VARCHAR(100) NOT NULL,
      note          TEXT,
      performed_by  VARCHAR(255),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS promotion_events_promo_idx ON promotion_events(promotion_id);

    -- ── Separation Events ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS separation_events (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      separation_id   UUID NOT NULL REFERENCES separation_records(id) ON DELETE CASCADE,
      event           VARCHAR(100) NOT NULL,
      note            TEXT,
      performed_by    VARCHAR(255),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS separation_events_sep_idx ON separation_events(separation_id);
  `)

  console.log('Migration complete.')
  process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })
