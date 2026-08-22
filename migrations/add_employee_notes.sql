-- Migration: Add employee notes table
-- Run this against your PostgreSQL database before deploying the Notes tab feature.

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
