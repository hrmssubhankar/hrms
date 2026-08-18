-- ─── Module 42: Roster & Shift Management ────────────────────────────────────
-- Run in Supabase SQL Editor
-- Note: FK references use plain UUID to match Supabase structure.

-- Roster templates
CREATE TABLE IF NOT EXISTS roster_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by  VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roster_templates_tenant_idx ON roster_templates (tenant_id);

-- Roster template slots (day/time patterns within a template)
CREATE TABLE IF NOT EXISTS roster_template_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  template_id     UUID NOT NULL,
  day_of_week     INTEGER NOT NULL, -- 0=Mon … 6=Sun
  start_time      VARCHAR(5) NOT NULL, -- HH:MM
  end_time        VARCHAR(5) NOT NULL,
  shift_type      VARCHAR(100) NOT NULL DEFAULT 'standard',
  location        VARCHAR(255),
  participant_id  UUID,
  required_staff  INTEGER NOT NULL DEFAULT 1,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS roster_template_slots_template_idx ON roster_template_slots (template_id);

-- Shift swap requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  shift_id         UUID NOT NULL,
  requested_by_id  UUID NOT NULL,
  swap_with_id     UUID,
  reason           TEXT,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewed_by      VARCHAR(255),
  reviewed_at      TIMESTAMPTZ,
  review_notes     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shift_swap_requests_tenant_idx ON shift_swap_requests (tenant_id);
CREATE INDEX IF NOT EXISTS shift_swap_requests_shift_idx  ON shift_swap_requests (shift_id);
