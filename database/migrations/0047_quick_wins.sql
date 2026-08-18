-- Migration 0047: Quick Wins
-- Adds end_date + notes to hrms_contracts for fixed-term expiry alerts
-- (hrms_contracts already exists from 001_initial_schema; we only add the new columns)

ALTER TABLE IF EXISTS hrms_contracts
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes    text;

CREATE INDEX IF NOT EXISTS hrms_contracts_end_date_idx
  ON hrms_contracts(end_date) WHERE end_date IS NOT NULL;
