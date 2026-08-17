-- ─── Module 41: Incident & Behaviour Support Register ────────────────────────
-- Run in Supabase SQL Editor
-- Note: tenant_id / participant_id use plain UUID (no FK) to match Supabase structure.

-- Incident register
CREATE TABLE IF NOT EXISTS participant_incidents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL,
  participant_id       UUID NOT NULL,
  incident_date        DATE NOT NULL,
  incident_time        VARCHAR(10),
  location             VARCHAR(255),
  incident_type        VARCHAR(100) NOT NULL DEFAULT 'general',
  severity             VARCHAR(50)  NOT NULL DEFAULT 'minor',
  description          TEXT NOT NULL,
  immediate_action     TEXT,
  witnesses            TEXT,
  reported_by          VARCHAR(255),
  reported_to          VARCHAR(255),
  ndis_reportable      BOOLEAN NOT NULL DEFAULT false,
  police_report        BOOLEAN NOT NULL DEFAULT false,
  police_report_number VARCHAR(100),
  status               VARCHAR(50)  NOT NULL DEFAULT 'open',
  outcome              TEXT,
  follow_up_required   BOOLEAN NOT NULL DEFAULT false,
  follow_up_date       DATE,
  follow_up_notes      TEXT,
  created_by           VARCHAR(255),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_incidents_tenant_idx      ON participant_incidents (tenant_id);
CREATE INDEX IF NOT EXISTS participant_incidents_participant_idx ON participant_incidents (participant_id);

-- Behaviour support plans
CREATE TABLE IF NOT EXISTS participant_behaviour_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  participant_id            UUID NOT NULL,
  plan_name                 VARCHAR(255) NOT NULL,
  behaviour_type            VARCHAR(100),
  triggers                  TEXT,
  early_warnings            TEXT,
  prevention_strategies     TEXT,
  de_escalation_strategies  TEXT,
  response_strategies       TEXT,
  post_incident_support     TEXT,
  authorised_by             VARCHAR(255),
  review_date               DATE,
  status                    VARCHAR(50) NOT NULL DEFAULT 'active',
  notes                     TEXT,
  created_by                VARCHAR(255),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS behaviour_plans_tenant_idx      ON participant_behaviour_plans (tenant_id);
CREATE INDEX IF NOT EXISTS behaviour_plans_participant_idx ON participant_behaviour_plans (participant_id);

-- Restrictive practices register
CREATE TABLE IF NOT EXISTS participant_restrictive_practices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  participant_id        UUID NOT NULL,
  practice_type         VARCHAR(100) NOT NULL,
  description           TEXT NOT NULL,
  authorised_by         VARCHAR(255),
  authorised_date       DATE,
  expiry_date           DATE,
  regulatory_approval   BOOLEAN NOT NULL DEFAULT false,
  approval_reference    VARCHAR(255),
  monitoring_frequency  VARCHAR(100),
  last_review_date      DATE,
  next_review_date      DATE,
  status                VARCHAR(50) NOT NULL DEFAULT 'active',
  notes                 TEXT,
  created_by            VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS restrictive_practices_tenant_idx      ON participant_restrictive_practices (tenant_id);
CREATE INDEX IF NOT EXISTS restrictive_practices_participant_idx ON participant_restrictive_practices (participant_id);
