-- ============================================================
-- Migration 0055 — Create missing tables not covered by prior migrations
-- Tables: hrms_employee_notes, hrms_offer_letters,
--         hrms_offer_letter_events, hrms_offer_letter_templates,
--         hrms_platform_announcements
-- Run in: Supabase SQL Editor (both YC and YPC databases)
-- ============================================================

-- ── Employee Notes ────────────────────────────────────────────────────────────
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

-- ── Offer Letters ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hrms_offer_letters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  candidate_name    VARCHAR(255) NOT NULL,
  candidate_email   VARCHAR(255) NOT NULL,
  position          VARCHAR(255) NOT NULL,
  department        VARCHAR(255),
  employment_type   VARCHAR(50)  NOT NULL DEFAULT 'full_time',
  start_date        DATE,
  salary_amount     INTEGER,
  salary_cycle      VARCHAR(20)  NOT NULL DEFAULT 'annual',
  template_content  TEXT,
  pdf_url           TEXT,
  status            VARCHAR(50)  NOT NULL DEFAULT 'draft',
  sent_at           TIMESTAMP,
  accepted_at       TIMESTAMP,
  rejected_at       TIMESTAMP,
  expires_at        TIMESTAMP,
  acceptance_token  TEXT,
  recruitment_id    UUID,
  employee_id       UUID REFERENCES hrms_employees(id),
  created_by        VARCHAR(255),
  notes             TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_letters_tenant_idx ON hrms_offer_letters (tenant_id);
CREATE INDEX IF NOT EXISTS offer_letters_status_idx ON hrms_offer_letters (status);
CREATE INDEX IF NOT EXISTS offer_letters_email_idx  ON hrms_offer_letters (candidate_email);

-- ── Offer Letter Events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hrms_offer_letter_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  offer_id     UUID NOT NULL REFERENCES hrms_offer_letters(id) ON DELETE CASCADE,
  event        VARCHAR(100) NOT NULL,
  note         TEXT,
  performed_by VARCHAR(255),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_events_offer_idx ON hrms_offer_letter_events (offer_id);

-- ── Offer Letter Templates ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hrms_offer_letter_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES hrms_tenants(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  file_url   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_tmpl_tenant_idx ON hrms_offer_letter_templates (tenant_id);

-- ── Platform Announcements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hrms_platform_announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(300) NOT NULL,
  body            TEXT NOT NULL,
  priority        VARCHAR(20)  NOT NULL DEFAULT 'info',
  target_tenants  TEXT         NOT NULL DEFAULT 'all',
  expires_at      TIMESTAMP,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS announcements_active_idx  ON hrms_platform_announcements (is_active);
CREATE INDEX IF NOT EXISTS announcements_created_idx ON hrms_platform_announcements (created_at);
