-- Migration 0051: Superannuation Tracker
-- Tracks employee super fund nominations and employer SG contribution records.

CREATE TABLE IF NOT EXISTS hrms_super_funds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,

  -- Fund details
  fund_name           varchar(255) NOT NULL,
  fund_abn            varchar(20),
  usi                 varchar(50),           -- Unique Superannuation Identifier
  member_number       varchar(100),
  is_smsf             boolean NOT NULL DEFAULT false,
  smsf_bank_bsb       varchar(7),
  smsf_bank_account   varchar(20),
  smsf_esa            varchar(255),          -- Electronic Service Address

  -- Status
  status              varchar(50)  NOT NULL DEFAULT 'active',
  -- active | stapled | employer_default | closed
  is_primary          boolean NOT NULL DEFAULT true,
  effective_from      date,
  effective_to        date,

  -- Source & verification
  source              varchar(50)  NOT NULL DEFAULT 'employee',
  -- employee (self-nominated) | ato_stapled | employer_default | ess_onboarding
  verified_at         timestamp,
  verified_by         varchar(255),
  notes               text,

  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hrms_super_contributions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,
  super_fund_id       uuid NOT NULL,

  -- Period
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  due_date            date NOT NULL,        -- 28 days after quarter end
  paid_date           date,

  -- Amounts
  gross_earnings      numeric(12,2) NOT NULL DEFAULT 0,
  sg_rate             numeric(5,4)  NOT NULL DEFAULT 0.115, -- 11.5% for 2024-25
  sg_amount           numeric(12,2) NOT NULL DEFAULT 0,     -- employer SG
  voluntary_amount    numeric(12,2) NOT NULL DEFAULT 0,     -- salary sacrifice / voluntary
  total_contribution  numeric(12,2) NOT NULL DEFAULT 0,

  -- Status
  status              varchar(50)  NOT NULL DEFAULT 'pending',
  -- pending | paid | overdue | exempt

  -- Reference
  payment_reference   varchar(255),
  notes               text,

  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hrms_super_funds_tenant_idx        ON hrms_super_funds(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_super_funds_employee_idx      ON hrms_super_funds(employee_id);
CREATE INDEX IF NOT EXISTS hrms_super_contributions_tenant_idx   ON hrms_super_contributions(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_super_contributions_employee_idx ON hrms_super_contributions(employee_id);
