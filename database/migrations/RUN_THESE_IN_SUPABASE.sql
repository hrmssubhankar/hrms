-- ═══════════════════════════════════════════════════════════════════════════
-- COMBINED PENDING MIGRATIONS — paste the entire file into Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Migration 0037: NDIS Practice Standards Audit ───────────────────────────

CREATE TABLE IF NOT EXISTS ndis_audits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  audit_type          VARCHAR(100) NOT NULL,
  standard            VARCHAR(255) NOT NULL,
  outcome_group       VARCHAR(100),
  status              VARCHAR(50)  NOT NULL DEFAULT 'scheduled',
  result              VARCHAR(50),
  risk_rating         VARCHAR(50),
  scheduled_date      DATE NOT NULL,
  completed_date      DATE,
  next_review_date    DATE,
  auditor_name        VARCHAR(255),
  auditor_org         VARCHAR(255),
  finding_summary     TEXT,
  corrective_actions  TEXT,
  evidence_url        VARCHAR(1000),
  notes               TEXT,
  assigned_to         VARCHAR(255),
  created_by          VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ndis_audits_tenant_idx ON ndis_audits (tenant_id);
CREATE INDEX IF NOT EXISTS ndis_audits_status_idx ON ndis_audits (status);
CREATE INDEX IF NOT EXISTS ndis_audits_date_idx   ON ndis_audits (scheduled_date);

CREATE TABLE IF NOT EXISTS ndis_audit_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  audit_id     UUID NOT NULL REFERENCES ndis_audits(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS ndis_audit_actions_tenant_idx ON ndis_audit_actions (tenant_id);
CREATE INDEX IF NOT EXISTS ndis_audit_actions_audit_idx  ON ndis_audit_actions (audit_id);

INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled, created_at, updated_at)
SELECT t.id, 37, 'NDIS Practice Standards Audit', true, NOW(), NOW()
FROM tenants t WHERE t.is_active = true
ON CONFLICT (tenant_id, module_id) DO UPDATE
  SET is_enabled = true, module_name = 'NDIS Practice Standards Audit', updated_at = NOW();


-- ─── Migration 0038: NDIS Reportable Incidents ───────────────────────────────

CREATE TABLE IF NOT EXISTS ndis_incidents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incident_type           VARCHAR(100) NOT NULL,
  incident_category       VARCHAR(100),
  is_reportable           BOOLEAN NOT NULL DEFAULT true,
  status                  VARCHAR(50) NOT NULL DEFAULT 'open',
  severity                VARCHAR(50) NOT NULL DEFAULT 'medium',
  participant_id          UUID REFERENCES participants(id) ON DELETE SET NULL,
  participant_name        VARCHAR(255),
  worker_name             VARCHAR(255),
  worker_role             VARCHAR(100),
  witness_names           TEXT,
  title                   VARCHAR(255) NOT NULL,
  description             TEXT NOT NULL,
  location                VARCHAR(500),
  incident_date           TIMESTAMPTZ NOT NULL,
  discovered_date         TIMESTAMPTZ,
  reported_internally     BOOLEAN NOT NULL DEFAULT false,
  internal_report_date    DATE,
  commission_notified     BOOLEAN NOT NULL DEFAULT false,
  commission_notify_date  DATE,
  commission_ref_number   VARCHAR(100),
  police_notified         BOOLEAN NOT NULL DEFAULT false,
  police_report_number    VARCHAR(100),
  immediate_actions       TEXT,
  root_cause              TEXT,
  outcome_description     TEXT,
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
  action_type  VARCHAR(100) DEFAULT 'corrective',
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

INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled, created_at, updated_at)
SELECT t.id, 38, 'NDIS Reportable Incidents', true, NOW(), NOW()
FROM tenants t WHERE t.is_active = true
ON CONFLICT (tenant_id, module_id) DO UPDATE
  SET is_enabled = true, module_name = 'NDIS Reportable Incidents', updated_at = NOW();
