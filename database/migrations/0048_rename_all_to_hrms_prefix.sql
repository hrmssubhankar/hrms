-- Migration 0048: Rename all tables to hrms_ prefix for consistency
-- Tables already prefixed (hrms_*) are untouched.
-- Non-prefixed tables created by migrations 0037-0047 are renamed here.

-- CRM tables
ALTER TABLE IF EXISTS crm_leads             RENAME TO hrms_crm_leads;
ALTER TABLE IF EXISTS crm_contacts          RENAME TO hrms_crm_contacts;
ALTER TABLE IF EXISTS crm_accounts          RENAME TO hrms_crm_accounts;
ALTER TABLE IF EXISTS crm_deals             RENAME TO hrms_crm_deals;
ALTER TABLE IF EXISTS crm_activities        RENAME TO hrms_crm_activities;

-- NDIS tables
ALTER TABLE IF EXISTS ndis_audits           RENAME TO hrms_ndis_audits;
ALTER TABLE IF EXISTS ndis_audit_actions    RENAME TO hrms_ndis_audit_actions;
ALTER TABLE IF EXISTS ndis_incidents        RENAME TO hrms_ndis_incidents;
ALTER TABLE IF EXISTS ndis_incident_actions RENAME TO hrms_ndis_incident_actions;

-- Participant tables
ALTER TABLE IF EXISTS participants              RENAME TO hrms_participants;
ALTER TABLE IF EXISTS participant_goals         RENAME TO hrms_participant_goals;
ALTER TABLE IF EXISTS participant_support_plans RENAME TO hrms_participant_support_plans;
ALTER TABLE IF EXISTS participant_notes         RENAME TO hrms_participant_notes;
ALTER TABLE IF EXISTS participant_contacts      RENAME TO hrms_participant_contacts;

-- Payroll & Finance tables
ALTER TABLE IF EXISTS payroll_runs          RENAME TO hrms_payroll_runs;
ALTER TABLE IF EXISTS payroll_run_entries   RENAME TO hrms_payroll_run_entries;
ALTER TABLE IF EXISTS expense_claims        RENAME TO hrms_expense_claims;

-- ESS tables
ALTER TABLE IF EXISTS ess_announcements     RENAME TO hrms_ess_announcements;
ALTER TABLE IF EXISTS ess_quick_links       RENAME TO hrms_ess_quick_links;

-- Reports
ALTER TABLE IF EXISTS saved_reports         RENAME TO hrms_saved_reports;

-- Contracts: hrms_contracts already exists from the original schema.
-- The bare `contracts` table was created by migration 0047 as a fallback.
-- Add end_date and notes to hrms_contracts (the real table), then drop the duplicate.
ALTER TABLE IF EXISTS hrms_contracts
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes    text;

CREATE INDEX IF NOT EXISTS hrms_contracts_end_date_idx
  ON hrms_contracts(end_date) WHERE end_date IS NOT NULL;

DROP TABLE IF EXISTS contracts;
