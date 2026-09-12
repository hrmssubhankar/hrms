/**
 * Migration Registry — single source of truth for all schema changes.
 *
 * Architecture note:
 *   ALL tenants (YC, YPC, and every future client) share ONE Supabase database.
 *   Tenant isolation is via tenant_id columns — NOT separate databases.
 *   Therefore a migration applied here covers ALL tenants automatically.
 *
 * How it works:
 *   1. hrms_schema_migrations table tracks which migrations have been applied.
 *   2. POST /api/super-admin/migrations applies any not-yet-applied entries.
 *   3. All SQL uses IF NOT EXISTS / IF NOT EXISTS so it is always safe to re-run.
 *
 * Adding a new migration:
 *   Append an entry to MIGRATIONS below. Name must be unique and sortable
 *   (use zero-padded number prefix). The SQL must be idempotent.
 */

export interface Migration {
  name: string          // unique, sortable — e.g. "0055_offer_letters"
  description: string
  sql: string           // idempotent DDL (CREATE TABLE IF NOT EXISTS, etc.)
}

export const MIGRATIONS: Migration[] = [

  // ── 0001: Schema migrations tracker ─────────────────────────────────────────
  {
    name: '0001_schema_migrations_tracker',
    description: 'Create hrms_schema_migrations table to track applied migrations',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_schema_migrations (
        name        VARCHAR(200) PRIMARY KEY,
        applied_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        duration_ms INTEGER
      );
    `,
  },

  // ── 0047: Contract end_date + notes ─────────────────────────────────────────
  {
    name: '0047_contract_end_date',
    description: 'Add end_date and notes columns to hrms_contracts',
    sql: `
      ALTER TABLE hrms_contracts ADD COLUMN IF NOT EXISTS end_date DATE;
      ALTER TABLE hrms_contracts ADD COLUMN IF NOT EXISTS notes TEXT;
    `,
  },

  // ── 0049: ESS onboarding submissions ────────────────────────────────────────
  {
    name: '0049_ess_onboarding',
    description: 'ESS onboarding submissions table',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_ess_onboarding_submissions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id       UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        tfn               VARCHAR(20),
        tax_free_threshold BOOLEAN DEFAULT false,
        super_fund_name   VARCHAR(255),
        super_fund_abn    VARCHAR(20),
        super_member_number VARCHAR(50),
        bank_bsb          VARCHAR(10),
        bank_account      VARCHAR(20),
        bank_account_name VARCHAR(100),
        emergency_name    VARCHAR(100),
        emergency_phone   VARCHAR(30),
        emergency_relation VARCHAR(50),
        status            VARCHAR(30) NOT NULL DEFAULT 'pending',
        submitted_at      TIMESTAMP,
        reviewed_at       TIMESTAMP,
        reviewed_by       UUID,
        notes             TEXT,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ess_onboarding_tenant_idx  ON hrms_ess_onboarding_submissions (tenant_id);
      CREATE INDEX IF NOT EXISTS ess_onboarding_employee_idx ON hrms_ess_onboarding_submissions (employee_id);
    `,
  },

  // ── 0051: Superannuation tracker ────────────────────────────────────────────
  {
    name: '0051_superannuation_tracker',
    description: 'Superannuation fund nominations and SG contribution records',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_superannuation_funds (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id     UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        fund_name       VARCHAR(255) NOT NULL,
        fund_abn        VARCHAR(20),
        member_number   VARCHAR(50),
        usi             VARCHAR(50),
        is_default      BOOLEAN NOT NULL DEFAULT false,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS super_funds_tenant_idx    ON hrms_superannuation_funds (tenant_id);
      CREATE INDEX IF NOT EXISTS super_funds_employee_idx  ON hrms_superannuation_funds (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_superannuation_contributions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id       UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        fund_id           UUID REFERENCES hrms_superannuation_funds(id),
        period_start      DATE NOT NULL,
        period_end        DATE NOT NULL,
        gross_pay         NUMERIC(12,2),
        sg_rate           NUMERIC(5,4),
        sg_amount         NUMERIC(12,2) NOT NULL,
        employee_contrib  NUMERIC(12,2),
        status            VARCHAR(30) NOT NULL DEFAULT 'pending',
        paid_at           TIMESTAMP,
        reference         VARCHAR(100),
        payroll_record_id UUID,
        notes             TEXT,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS super_contrib_tenant_idx   ON hrms_superannuation_contributions (tenant_id);
      CREATE INDEX IF NOT EXISTS super_contrib_employee_idx ON hrms_superannuation_contributions (employee_id);
    `,
  },

  // ── 0052: Salary review workflow ────────────────────────────────────────────
  {
    name: '0052_salary_review',
    description: 'Salary review cycles and increment proposals',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_salary_review_cycles (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        name         VARCHAR(255) NOT NULL,
        cycle_start  DATE NOT NULL,
        cycle_end    DATE NOT NULL,
        status       VARCHAR(30) NOT NULL DEFAULT 'draft',
        notes        TEXT,
        created_by   UUID,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS salary_cycles_tenant_idx ON hrms_salary_review_cycles (tenant_id);

      CREATE TABLE IF NOT EXISTS hrms_salary_reviews (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        cycle_id        UUID REFERENCES hrms_salary_review_cycles(id),
        employee_id     UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        current_salary  NUMERIC(12,2),
        proposed_salary NUMERIC(12,2),
        change_percent  NUMERIC(6,2),
        rationale       TEXT,
        status          VARCHAR(30) NOT NULL DEFAULT 'pending',
        reviewed_by     UUID,
        reviewed_at     TIMESTAMP,
        approved_by     UUID,
        approved_at     TIMESTAMP,
        effective_date  DATE,
        notes           TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS salary_reviews_tenant_idx   ON hrms_salary_reviews (tenant_id);
      CREATE INDEX IF NOT EXISTS salary_reviews_employee_idx ON hrms_salary_reviews (employee_id);
    `,
  },

  // ── 0053: TOIL tracking ──────────────────────────────────────────────────────
  {
    name: '0053_toil_tracking',
    description: 'TOIL accrual, requests, approval and balance ledger',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_toil_balances (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id   UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        balance_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
        updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, employee_id)
      );
      CREATE INDEX IF NOT EXISTS toil_balances_tenant_idx   ON hrms_toil_balances (tenant_id);
      CREATE INDEX IF NOT EXISTS toil_balances_employee_idx ON hrms_toil_balances (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_toil_entries (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id   UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        entry_type    VARCHAR(20) NOT NULL,
        hours         NUMERIC(6,2) NOT NULL,
        reason        TEXT,
        worked_date   DATE,
        status        VARCHAR(20) NOT NULL DEFAULT 'pending',
        approved_by   UUID,
        approved_at   TIMESTAMP,
        expires_at    DATE,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS toil_entries_tenant_idx   ON hrms_toil_entries (tenant_id);
      CREATE INDEX IF NOT EXISTS toil_entries_employee_idx ON hrms_toil_entries (employee_id);
    `,
  },

  // ── 0054: Missing operational tables ────────────────────────────────────────
  {
    name: '0054_missing_tables',
    description: 'employee_availability, headcount_plan, promotion_requests, separation_events, performance_goals, employee_experience',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_employee_availability (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id  UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        day_of_week  INTEGER NOT NULL,
        start_time   TIME,
        end_time     TIME,
        is_available BOOLEAN NOT NULL DEFAULT true,
        notes        TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS avail_tenant_idx   ON hrms_employee_availability (tenant_id);
      CREATE INDEX IF NOT EXISTS avail_employee_idx ON hrms_employee_availability (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_headcount_plan (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        department_id   UUID,
        position_title  VARCHAR(255),
        planned_count   INTEGER NOT NULL DEFAULT 0,
        current_count   INTEGER NOT NULL DEFAULT 0,
        target_date     DATE,
        notes           TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS headcount_plan_tenant_idx ON hrms_headcount_plan (tenant_id);

      CREATE TABLE IF NOT EXISTS hrms_promotion_requests (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id     UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        from_position   VARCHAR(255),
        to_position     VARCHAR(255),
        effective_date  DATE,
        reason          TEXT,
        status          VARCHAR(30) NOT NULL DEFAULT 'pending',
        reviewed_by     UUID,
        reviewed_at     TIMESTAMP,
        notes           TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS promo_tenant_idx   ON hrms_promotion_requests (tenant_id);
      CREATE INDEX IF NOT EXISTS promo_employee_idx ON hrms_promotion_requests (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_separation_events (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        separation_id   UUID REFERENCES hrms_separation_records(id),
        event           VARCHAR(100) NOT NULL,
        notes           TEXT,
        performed_by    UUID,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS sep_events_tenant_idx ON hrms_separation_events (tenant_id);

      CREATE TABLE IF NOT EXISTS hrms_performance_goals (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id   UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        review_id     UUID,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        target_date   DATE,
        status        VARCHAR(30) NOT NULL DEFAULT 'pending',
        progress      INTEGER DEFAULT 0,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS perf_goals_tenant_idx   ON hrms_performance_goals (tenant_id);
      CREATE INDEX IF NOT EXISTS perf_goals_employee_idx ON hrms_performance_goals (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_employee_experience (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id      UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id    UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        employer       VARCHAR(255),
        role_title     VARCHAR(255),
        start_date     DATE,
        end_date       DATE,
        description    TEXT,
        created_at     TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS exp_tenant_idx   ON hrms_employee_experience (tenant_id);
      CREATE INDEX IF NOT EXISTS exp_employee_idx ON hrms_employee_experience (employee_id);
    `,
  },

  // ── 0055: Employee notes + offer letters + announcements ────────────────────
  {
    name: '0055_missing_tables_ddl',
    description: 'hrms_employee_notes, hrms_offer_letters, hrms_offer_letter_events, hrms_offer_letter_templates, hrms_platform_announcements',
    sql: `
      CREATE TABLE IF NOT EXISTS hrms_employee_notes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        employee_id  UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
        author_id    UUID NOT NULL REFERENCES hrms_users(id),
        author_email VARCHAR(255) NOT NULL,
        content      TEXT NOT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS employee_notes_tenant_idx   ON hrms_employee_notes (tenant_id);
      CREATE INDEX IF NOT EXISTS employee_notes_employee_idx ON hrms_employee_notes (employee_id);

      CREATE TABLE IF NOT EXISTS hrms_offer_letters (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
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
        sent_at           TIMESTAMP,
        accepted_at       TIMESTAMP,
        rejected_at       TIMESTAMP,
        expires_at        TIMESTAMP,
        acceptance_token  TEXT,
        recruitment_id    UUID,
        employee_id       UUID REFERENCES hrms_employees(id),
        created_by        VARCHAR(255),
        notes             TEXT,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS offer_letters_tenant_idx ON hrms_offer_letters (tenant_id);
      CREATE INDEX IF NOT EXISTS offer_letters_status_idx ON hrms_offer_letters (status);
      CREATE INDEX IF NOT EXISTS offer_letters_email_idx  ON hrms_offer_letters (candidate_email);

      CREATE TABLE IF NOT EXISTS hrms_offer_letter_events (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        offer_id     UUID NOT NULL REFERENCES hrms_offer_letters(id) ON DELETE CASCADE,
        event        VARCHAR(100) NOT NULL,
        note         TEXT,
        performed_by VARCHAR(255),
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS offer_events_offer_idx ON hrms_offer_letter_events (offer_id);

      CREATE TABLE IF NOT EXISTS hrms_offer_letter_templates (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id  UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
        name       VARCHAR(255) NOT NULL,
        content    TEXT NOT NULL,
        file_url   TEXT,
        is_active  BOOLEAN NOT NULL DEFAULT TRUE,
        created_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS offer_tmpl_tenant_idx ON hrms_offer_letter_templates (tenant_id);

      CREATE TABLE IF NOT EXISTS hrms_platform_announcements (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title           VARCHAR(300) NOT NULL,
        body            TEXT NOT NULL,
        priority        VARCHAR(20)  NOT NULL DEFAULT 'info',
        target_tenants  TEXT         NOT NULL DEFAULT 'all',
        expires_at      TIMESTAMP,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_by      VARCHAR(255) NOT NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS announcements_active_idx  ON hrms_platform_announcements (is_active);
      CREATE INDEX IF NOT EXISTS announcements_created_idx ON hrms_platform_announcements (created_at);
    `,
  },

  // ── 0056: last_login_at columns ─────────────────────────────────────────────
  {
    name: '0056_last_login_at',
    description: 'Add last_login_at to hrms_users and hrms_super_admins',
    sql: `
      ALTER TABLE hrms_users        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE hrms_super_admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    `,
  },

]
