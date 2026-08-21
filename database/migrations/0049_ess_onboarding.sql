-- Migration 0049: ESS Employee Self-Service Onboarding Submissions
-- Stores employee-submitted onboarding details (TFN declaration, super, bank, emergency contact)
-- Kept separate from hrms_employees so HR can review before committing to payroll records.

CREATE TABLE IF NOT EXISTS hrms_ess_onboarding (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,

  -- Step 1: Personal details
  preferred_name      varchar(100),
  date_of_birth       date,
  gender              varchar(50),
  phone               varchar(20),
  address             text,

  -- Step 2: Tax (TFN Declaration)
  tfn_declared        boolean NOT NULL DEFAULT false,
  tax_residency       varchar(50),           -- 'resident', 'non_resident', 'working_holiday'
  tax_free_threshold  boolean NOT NULL DEFAULT false,
  has_help_debt       boolean NOT NULL DEFAULT false,
  tax_file_number     varchar(9),            -- stored masked after confirmation

  -- Step 3: Superannuation
  super_fund_name     varchar(255),
  super_fund_abn      varchar(20),
  super_usi           varchar(50),           -- Unique Superannuation Identifier
  super_member_number varchar(100),
  is_smsf             boolean NOT NULL DEFAULT false,

  -- Step 4: Bank details
  bank_name           varchar(100),
  bank_bsb            varchar(7),
  bank_account_number varchar(20),
  bank_account_name   varchar(100),

  -- Step 5: Emergency contact
  emergency_name      varchar(200),
  emergency_relation  varchar(100),
  emergency_phone     varchar(20),
  emergency_phone2    varchar(20),

  -- Workflow
  status              varchar(50) NOT NULL DEFAULT 'draft',
  -- draft → submitted → hr_reviewed → completed
  submitted_at        timestamp,
  reviewed_by         varchar(255),
  reviewed_at         timestamp,
  hr_notes            text,

  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hrms_ess_onboarding_tenant_idx   ON hrms_ess_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_ess_onboarding_employee_idx ON hrms_ess_onboarding(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS hrms_ess_onboarding_unique ON hrms_ess_onboarding(tenant_id, employee_id);
