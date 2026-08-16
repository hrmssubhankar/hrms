-- ─── NDIS Practice Standards Audit Module (ID 37) ───────────────────────────
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ndis_audits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  audit_type          VARCHAR(100) NOT NULL,          -- internal, external, certification, surveillance
  standard            VARCHAR(255) NOT NULL,           -- NDIS Practice Standard reference
  outcome_group       VARCHAR(100),                   -- rights_protection, governance, support_provision, workforce
  status              VARCHAR(50)  NOT NULL DEFAULT 'scheduled',  -- scheduled, in_progress, completed, overdue
  result              VARCHAR(50),                    -- conformant, non_conformant, not_applicable, partial
  risk_rating         VARCHAR(50),                    -- low, medium, high, critical
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
  priority     VARCHAR(50) NOT NULL DEFAULT 'medium',  -- low, medium, high, critical
  status       VARCHAR(50) NOT NULL DEFAULT 'open',    -- open, in_progress, resolved, closed
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

-- Enable module ID 37 for all existing tenants
INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled, created_at, updated_at)
SELECT
  t.id,
  37,
  'NDIS Practice Standards Audit',
  true,
  NOW(),
  NOW()
FROM tenants t
WHERE t.is_active = true
ON CONFLICT (tenant_id, module_id) DO UPDATE
  SET is_enabled = true,
      module_name = 'NDIS Practice Standards Audit',
      updated_at  = NOW();
