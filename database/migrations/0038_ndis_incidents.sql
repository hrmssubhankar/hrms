-- ─── NDIS Reportable Incidents Module (ID 38) ────────────────────────────────
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ndis_incidents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Classification
  incident_type           VARCHAR(100) NOT NULL,   -- death, serious_injury, abuse, neglect, unlawful_sexual, unauthorised_restrictive_practice, missing_participant, medication_error, physical_assault, self_harm, property_damage, other
  incident_category       VARCHAR(100),
  is_reportable           BOOLEAN NOT NULL DEFAULT true,
  -- Status
  status                  VARCHAR(50) NOT NULL DEFAULT 'open',   -- open, under_review, reported_to_commission, closed
  severity                VARCHAR(50) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  -- People
  participant_id          UUID REFERENCES participants(id) ON DELETE SET NULL,
  participant_name        VARCHAR(255),
  worker_name             VARCHAR(255),
  worker_role             VARCHAR(100),
  witness_names           TEXT,
  -- Incident details
  title                   VARCHAR(255) NOT NULL,
  description             TEXT NOT NULL,
  location                VARCHAR(500),
  incident_date           TIMESTAMPTZ NOT NULL,
  discovered_date         TIMESTAMPTZ,
  reported_internally     BOOLEAN NOT NULL DEFAULT false,
  internal_report_date    DATE,
  -- Commission
  commission_notified     BOOLEAN NOT NULL DEFAULT false,
  commission_notify_date  DATE,
  commission_ref_number   VARCHAR(100),
  -- Police
  police_notified         BOOLEAN NOT NULL DEFAULT false,
  police_report_number    VARCHAR(100),
  -- Response
  immediate_actions       TEXT,
  root_cause              TEXT,
  outcome_description     TEXT,
  -- Admin
  evidence_url            VARCHAR(1000),
  assigned_to             VARCHAR(255),
  notes                   TEXT,
  created_by              VARCHAR(255),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ndis_incidents_tenant_idx      ON ndis_incidents (tenant_id);
CREATE INDEX IF NOT EXISTS ndis_incidents_status_idx      ON ndis_incidents (status);
CREATE INDEX IF NOT EXISTS ndis_incidents_date_idx        ON ndis_incidents (incident_date);
CREATE INDEX IF NOT EXISTS ndis_incidents_participant_idx ON ndis_incidents (participant_id);

CREATE TABLE IF NOT EXISTS ndis_incident_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incident_id  UUID NOT NULL REFERENCES ndis_incidents(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  action_type  VARCHAR(100) DEFAULT 'corrective',  -- corrective, preventive, notification, investigation
  priority     VARCHAR(50) NOT NULL DEFAULT 'medium',
  status       VARCHAR(50) NOT NULL DEFAULT 'open',
  due_date     DATE,
  resolved_at  TIMESTAMPTZ,
  assigned_to  VARCHAR(255),
  notes        TEXT,
  created_by   VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ndis_incident_actions_tenant_idx   ON ndis_incident_actions (tenant_id);
CREATE INDEX IF NOT EXISTS ndis_incident_actions_incident_idx ON ndis_incident_actions (incident_id);

-- Enable module ID 38 for all existing tenants
INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled, created_at, updated_at)
SELECT
  t.id,
  38,
  'NDIS Reportable Incidents',
  true,
  NOW(),
  NOW()
FROM tenants t
WHERE t.is_active = true
ON CONFLICT (tenant_id, module_id) DO UPDATE
  SET is_enabled  = true,
      module_name = 'NDIS Reportable Incidents',
      updated_at  = NOW();
