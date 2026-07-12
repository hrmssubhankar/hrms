-- ── Leave Management ─────────────────────────────────────────────────────────
-- Migration 004: leave_requests table + enums

CREATE TYPE leave_type AS ENUM (
  'annual', 'sick', 'personal', 'unpaid', 'long_service', 'carer', 'compassionate'
);

CREATE TYPE leave_status AS ENUM (
  'pending', 'approved', 'rejected', 'cancelled'
);

CREATE TABLE leave_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type    leave_type  NOT NULL,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  total_days    INTEGER     NOT NULL,
  reason        TEXT,
  status        leave_status NOT NULL DEFAULT 'pending',
  reviewed_by   VARCHAR(255),          -- user id (JWT sub) of the approver/rejecter
  reviewed_at   TIMESTAMPTZ,
  review_note   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX leave_tenant_idx   ON leave_requests (tenant_id);
CREATE INDEX leave_employee_idx ON leave_requests (employee_id);
CREATE INDEX leave_status_idx   ON leave_requests (status);
CREATE INDEX leave_date_idx     ON leave_requests (start_date);
