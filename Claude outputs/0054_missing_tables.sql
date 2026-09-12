-- Migration 0054: Add missing tables not yet in database
-- Tables: employee_availability, headcount_plan, promotion_requests,
--         promotion_events, separation_events, performance_goals,
--         employee_experience
-- Run in Supabase SQL Editor for BOTH YC and YPC databases.

-- Employee Availability
CREATE TABLE IF NOT EXISTS hrms_employee_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id),
  employee_id  UUID NOT NULL REFERENCES hrms_employees(id),
  day_of_week  INTEGER NOT NULL,
  start_time   VARCHAR(5) NOT NULL,
  end_time     VARCHAR(5) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS availability_tenant_idx ON hrms_employee_availability (tenant_id);
CREATE INDEX IF NOT EXISTS availability_emp_idx    ON hrms_employee_availability (employee_id);

-- Headcount Plan
CREATE TABLE IF NOT EXISTS hrms_headcount_plan (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES hrms_tenants(id),
  department_id  UUID REFERENCES hrms_departments(id),
  position_id    UUID REFERENCES hrms_positions(id),
  planned_count  INTEGER NOT NULL,
  current_count  INTEGER NOT NULL DEFAULT 0,
  vacancy_count  INTEGER NOT NULL DEFAULT 0,
  target_date    DATE,
  status         VARCHAR(50) NOT NULL DEFAULT 'open',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS headcount_plan_tenant_idx ON hrms_headcount_plan (tenant_id);

-- Promotion Requests
CREATE TABLE IF NOT EXISTS hrms_promotion_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS promotions_tenant_idx   ON hrms_promotion_requests (tenant_id);
CREATE INDEX IF NOT EXISTS promotions_employee_idx ON hrms_promotion_requests (employee_id);
CREATE INDEX IF NOT EXISTS promotions_status_idx   ON hrms_promotion_requests (status);

-- Promotion Events
CREATE TABLE IF NOT EXISTS hrms_promotion_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  promotion_id  UUID NOT NULL REFERENCES hrms_promotion_requests(id) ON DELETE CASCADE,
  event         VARCHAR(100) NOT NULL,
  note          TEXT,
  performed_by  VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS promotion_events_promo_idx ON hrms_promotion_events (promotion_id);

-- Separation Events
CREATE TABLE IF NOT EXISTS hrms_separation_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  separation_id  UUID NOT NULL REFERENCES hrms_separation_records(id) ON DELETE CASCADE,
  event          VARCHAR(100) NOT NULL,
  note           TEXT,
  performed_by   VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS separation_events_sep_idx ON hrms_separation_events (separation_id);

-- Performance Goals
CREATE TABLE IF NOT EXISTS hrms_performance_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
  review_id       UUID REFERENCES hrms_performance_reviews(id) ON DELETE SET NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  target_date     DATE,
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  progress        INTEGER NOT NULL DEFAULT 0,
  self_rating     INTEGER,
  manager_rating  INTEGER,
  manager_note    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS perf_goals_tenant_idx   ON hrms_performance_goals (tenant_id);
CREATE INDEX IF NOT EXISTS perf_goals_employee_idx ON hrms_performance_goals (employee_id);
CREATE INDEX IF NOT EXISTS perf_goals_review_idx   ON hrms_performance_goals (review_id);

-- Employee Experience (Work History)
CREATE TABLE IF NOT EXISTS hrms_employee_experience (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  employee_id         UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
  company_name        VARCHAR(255) NOT NULL,
  job_title           VARCHAR(255) NOT NULL,
  employment_type     VARCHAR(50) NOT NULL DEFAULT 'full_time',
  start_date          DATE NOT NULL,
  end_date            DATE,
  is_current          BOOLEAN NOT NULL DEFAULT false,
  location            VARCHAR(255),
  description         TEXT,
  reason_for_leaving  VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS employee_experience_tenant_idx   ON hrms_employee_experience (tenant_id);
CREATE INDEX IF NOT EXISTS employee_experience_employee_idx ON hrms_employee_experience (employee_id);
