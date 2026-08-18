-- Migration 0047: Quick Wins
-- Creates contracts table if missing, adds contract end_date + notes columns for fixed-term expiry alerts

CREATE TABLE IF NOT EXISTS contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  employee_id      UUID NOT NULL,
  type             VARCHAR(100) NOT NULL,
  pdf_url          TEXT,
  signed_pdf_url   TEXT,
  status           VARCHAR(50) NOT NULL DEFAULT 'draft',
  sent_at          TIMESTAMPTZ,
  signed_at        TIMESTAMPTZ,
  signature_ip     VARCHAR(45),
  signature_data   TEXT,
  tfn_provided     BOOLEAN NOT NULL DEFAULT FALSE,
  super_fund       VARCHAR(200),
  bank_bsb         VARCHAR(10),
  bank_account     VARCHAR(20),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add new columns for fixed-term expiry tracking
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes text;

-- Index for expiry alert queries
CREATE INDEX IF NOT EXISTS contracts_end_date_idx ON contracts(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_tenant_id_idx ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS contracts_employee_id_idx ON contracts(employee_id);
