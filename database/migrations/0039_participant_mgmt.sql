-- ─── Module 39: Participant Management CRM ───────────────────────────────────
-- Run in Supabase SQL Editor
-- Note: tenant_id / participant_id use plain UUID (no FK) to match Supabase structure.

-- Ensure participants table exists (base table for NDIS participants)
CREATE TABLE IF NOT EXISTS participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  preferred_name  VARCHAR(100),
  ndis_number     VARCHAR(20),
  date_of_birth   DATE,
  address         TEXT,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  support_level   VARCHAR(100),
  funding_body    VARCHAR(100) DEFAULT 'NDIS',
  plan_start_date DATE,
  plan_end_date   DATE,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participants_tenant_idx ON participants (tenant_id);

-- NDIS Goals
CREATE TABLE IF NOT EXISTS participant_goals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  participant_id   UUID NOT NULL,
  goal_category    VARCHAR(100) NOT NULL DEFAULT 'daily_living',
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  status           VARCHAR(50)  NOT NULL DEFAULT 'not_started',
  target_date      DATE,
  achieved_date    DATE,
  progress_notes   TEXT,
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_goals_tenant_idx      ON participant_goals (tenant_id);
CREATE INDEX IF NOT EXISTS participant_goals_participant_idx ON participant_goals (participant_id);

-- Support Plans
CREATE TABLE IF NOT EXISTS participant_support_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  participant_id   UUID NOT NULL,
  plan_type        VARCHAR(50)  NOT NULL DEFAULT 'initial',
  title            VARCHAR(255) NOT NULL,
  status           VARCHAR(50)  NOT NULL DEFAULT 'draft',
  plan_start_date  DATE,
  plan_end_date    DATE,
  review_date      DATE,
  total_budget     DECIMAL(12,2),
  funded_supports  TEXT,
  coordinator_name VARCHAR(255),
  coordinator_org  VARCHAR(255),
  coordinator_email VARCHAR(255),
  notes            TEXT,
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_support_plans_tenant_idx      ON participant_support_plans (tenant_id);
CREATE INDEX IF NOT EXISTS participant_support_plans_participant_idx ON participant_support_plans (participant_id);

-- Case / Progress Notes
CREATE TABLE IF NOT EXISTS participant_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL,
  participant_id UUID NOT NULL,
  note_type      VARCHAR(50) NOT NULL DEFAULT 'case_note',
  title          VARCHAR(255),
  content        TEXT NOT NULL,
  visibility     VARCHAR(50) NOT NULL DEFAULT 'internal',
  created_by     VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_notes_tenant_idx      ON participant_notes (tenant_id);
CREATE INDEX IF NOT EXISTS participant_notes_participant_idx ON participant_notes (participant_id);

-- Contacts (emergency, family, support coordinator, guardian)
CREATE TABLE IF NOT EXISTS participant_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL,
  participant_id UUID NOT NULL,
  contact_type   VARCHAR(50) NOT NULL DEFAULT 'emergency',
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100),
  relationship   VARCHAR(100),
  phone          VARCHAR(20),
  email          VARCHAR(255),
  address        TEXT,
  is_primary     BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_contacts_tenant_idx      ON participant_contacts (tenant_id);
CREATE INDEX IF NOT EXISTS participant_contacts_participant_idx ON participant_contacts (participant_id);
