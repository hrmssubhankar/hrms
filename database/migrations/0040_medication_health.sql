-- ─── Module 40: Medication & Health Support Register ─────────────────────────
-- Run in Supabase SQL Editor
-- Note: tenant_id / participant_id use plain UUID (no FK) to match Supabase structure.

-- Medications register
CREATE TABLE IF NOT EXISTS participant_medications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  participant_id   UUID NOT NULL,
  medication_name  VARCHAR(255) NOT NULL,
  generic_name     VARCHAR(255),
  dosage           VARCHAR(100),
  form             VARCHAR(50)  NOT NULL DEFAULT 'tablet',
  route            VARCHAR(50)  NOT NULL DEFAULT 'oral',
  frequency        VARCHAR(100),
  prescribed_by    VARCHAR(255),
  indication       TEXT,
  instructions     TEXT,
  start_date       DATE,
  end_date         DATE,
  status           VARCHAR(50)  NOT NULL DEFAULT 'active',
  requires_assist  BOOLEAN NOT NULL DEFAULT true,
  refrigerated     BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participant_medications_tenant_idx      ON participant_medications (tenant_id);
CREATE INDEX IF NOT EXISTS participant_medications_participant_idx ON participant_medications (participant_id);

-- Medication administration logs
CREATE TABLE IF NOT EXISTS participant_medication_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  medication_id    UUID NOT NULL,
  participant_id   UUID NOT NULL,
  scheduled_time   TIMESTAMPTZ NOT NULL,
  administered_at  TIMESTAMPTZ,
  outcome          VARCHAR(50)  NOT NULL DEFAULT 'given',
  administered_by  VARCHAR(255),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medication_logs_tenant_idx      ON participant_medication_logs (tenant_id);
CREATE INDEX IF NOT EXISTS medication_logs_medication_idx  ON participant_medication_logs (medication_id);
CREATE INDEX IF NOT EXISTS medication_logs_participant_idx ON participant_medication_logs (participant_id);

-- Health conditions / diagnoses
CREATE TABLE IF NOT EXISTS participant_health_conditions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  participant_id   UUID NOT NULL,
  condition_name   VARCHAR(255) NOT NULL,
  condition_type   VARCHAR(100) NOT NULL DEFAULT 'chronic',
  icd_code         VARCHAR(20),
  severity         VARCHAR(50)  NOT NULL DEFAULT 'moderate',
  diagnosed_date   DATE,
  diagnosed_by     VARCHAR(255),
  status           VARCHAR(50)  NOT NULL DEFAULT 'active',
  description      TEXT,
  management_plan  TEXT,
  alerts           TEXT,
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS health_conditions_tenant_idx      ON participant_health_conditions (tenant_id);
CREATE INDEX IF NOT EXISTS health_conditions_participant_idx ON participant_health_conditions (participant_id);

-- Health appointments
CREATE TABLE IF NOT EXISTS participant_health_appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  participant_id        UUID NOT NULL,
  appointment_type      VARCHAR(100) NOT NULL DEFAULT 'gp',
  provider_name         VARCHAR(255),
  provider_org          VARCHAR(255),
  appointment_date      DATE NOT NULL,
  appointment_time      VARCHAR(10),
  location              VARCHAR(255),
  purpose               TEXT,
  outcome               TEXT,
  follow_up_date        DATE,
  follow_up_notes       TEXT,
  status                VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  requires_transport    BOOLEAN NOT NULL DEFAULT false,
  support_worker_needed BOOLEAN NOT NULL DEFAULT false,
  created_by            VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS health_appointments_tenant_idx      ON participant_health_appointments (tenant_id);
CREATE INDEX IF NOT EXISTS health_appointments_participant_idx ON participant_health_appointments (participant_id);
