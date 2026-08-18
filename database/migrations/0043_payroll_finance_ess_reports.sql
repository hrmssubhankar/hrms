-- ─── Modules 43-45: Payroll & Finance, Employee Self-Service, Reports & Analytics
-- Run in Supabase SQL Editor

-- Module 43: Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  name            VARCHAR(255) NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  pay_date        DATE,
  frequency       VARCHAR(50) NOT NULL DEFAULT 'fortnightly',
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  total_gross     NUMERIC(12,2) DEFAULT 0,
  total_net       NUMERIC(12,2) DEFAULT 0,
  total_tax       NUMERIC(12,2) DEFAULT 0,
  total_super     NUMERIC(12,2) DEFAULT 0,
  employee_count  INTEGER DEFAULT 0,
  notes           TEXT,
  created_by      VARCHAR(255),
  finalised_by    VARCHAR(255),
  finalised_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payroll_runs_tenant_idx ON payroll_runs (tenant_id);
CREATE INDEX IF NOT EXISTS payroll_runs_status_idx ON payroll_runs (status);

-- Module 43: Payroll Run Entries (per-employee breakdown)
CREATE TABLE IF NOT EXISTS payroll_run_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  run_id              UUID NOT NULL,
  employee_id         UUID NOT NULL,
  employee_number     VARCHAR(50),
  first_name          VARCHAR(100),
  last_name           VARCHAR(100),
  employment_type     VARCHAR(50),
  hours_worked        NUMERIC(8,2) DEFAULT 0,
  hourly_rate         NUMERIC(10,4) DEFAULT 0,
  ordinary_pay        NUMERIC(10,2) DEFAULT 0,
  overtime_pay        NUMERIC(10,2) DEFAULT 0,
  allowances          NUMERIC(10,2) DEFAULT 0,
  gross_pay           NUMERIC(10,2) DEFAULT 0,
  payg_withholding    NUMERIC(10,2) DEFAULT 0,
  medicare_levy       NUMERIC(10,2) DEFAULT 0,
  other_deductions    NUMERIC(10,2) DEFAULT 0,
  super_contribution  NUMERIC(10,2) DEFAULT 0,
  net_pay             NUMERIC(10,2) DEFAULT 0,
  leave_accrued       NUMERIC(8,4) DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payroll_run_entries_tenant_idx ON payroll_run_entries (tenant_id);
CREATE INDEX IF NOT EXISTS payroll_run_entries_run_idx    ON payroll_run_entries (run_id);

-- Module 44: ESS Announcements
CREATE TABLE IF NOT EXISTS ess_announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  priority     VARCHAR(50) NOT NULL DEFAULT 'info',
  target_role  VARCHAR(100),
  published_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_by   VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ess_announcements_tenant_idx ON ess_announcements (tenant_id);

-- Module 44: ESS Quick Links
CREATE TABLE IF NOT EXISTS ess_quick_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  label       VARCHAR(255) NOT NULL,
  url         VARCHAR(1000) NOT NULL,
  icon        VARCHAR(50),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ess_quick_links_tenant_idx ON ess_quick_links (tenant_id);

-- Module 45: Saved Reports
CREATE TABLE IF NOT EXISTS saved_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  name         VARCHAR(255) NOT NULL,
  report_type  VARCHAR(100) NOT NULL,
  filters      JSONB DEFAULT '{}',
  columns      JSONB DEFAULT '[]',
  sort_by      VARCHAR(100),
  sort_dir     VARCHAR(10) DEFAULT 'asc',
  is_shared    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   VARCHAR(255),
  last_run_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_reports_tenant_idx ON saved_reports (tenant_id);
