-- Migration 0053: TOIL (Time Off In Lieu) Tracking
-- Accrual of overtime hours as TOIL, request and approval workflow, balance ledger.

CREATE TABLE IF NOT EXISTS hrms_toil_balances (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,
  balance_hours       numeric(8,2) NOT NULL DEFAULT 0,  -- current TOIL balance in hours
  total_accrued       numeric(8,2) NOT NULL DEFAULT 0,  -- lifetime accrued
  total_taken         numeric(8,2) NOT NULL DEFAULT 0,  -- lifetime taken
  expiry_date         date,                              -- if TOIL expires under policy
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hrms_toil_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,

  -- Entry type
  entry_type          varchar(20)  NOT NULL DEFAULT 'accrual',
  -- accrual | taken | adjustment | expired

  -- When
  work_date           date NOT NULL,            -- date overtime was worked (accrual) or TOIL taken
  hours               numeric(6,2) NOT NULL,    -- positive = accrual, negative = taken/expired
  multiplier          numeric(4,2) NOT NULL DEFAULT 1.0,  -- 1.5x / 2.0x overtime rate if converted

  -- Reference
  shift_id            uuid,                     -- optional: links back to roster shift
  timesheet_id        uuid,                     -- optional: links back to timesheet entry
  description         text,

  -- Approval workflow (for take requests)
  status              varchar(50)  NOT NULL DEFAULT 'approved',
  -- approved | pending | rejected (accruals auto-approved; takes need approval)
  requested_at        timestamp,
  approved_by         varchar(255),
  approved_at         timestamp,
  rejected_reason     text,

  created_by          varchar(255),
  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hrms_toil_balances_unique ON hrms_toil_balances(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS hrms_toil_balances_tenant_idx    ON hrms_toil_balances(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_toil_entries_tenant_idx     ON hrms_toil_entries(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_toil_entries_employee_idx   ON hrms_toil_entries(employee_id);
CREATE INDEX IF NOT EXISTS hrms_toil_entries_date_idx       ON hrms_toil_entries(work_date);
