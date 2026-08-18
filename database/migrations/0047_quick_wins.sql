-- Migration 0047: Quick Wins
-- Adds contract end_date + notes columns for fixed-term expiry alerts

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes text;

-- Index for expiry alert queries
CREATE INDEX IF NOT EXISTS contracts_end_date_idx ON contracts(end_date) WHERE end_date IS NOT NULL;
