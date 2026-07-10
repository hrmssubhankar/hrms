-- ─────────────────────────────────────────────────────────────
-- Migration 003: Platform Announcements
-- Adds a persistent announcements table for super admin
-- broadcasts to all tenants or specific clients.
-- ─────────────────────────────────────────────────────────────

-- Enum for announcement priority
DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Platform announcements table (no tenant FK — platform-level)
CREATE TABLE IF NOT EXISTS platform_announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(300)          NOT NULL,
  body            TEXT                  NOT NULL,
  priority        announcement_priority NOT NULL DEFAULT 'info',
  -- 'all' OR a JSON array of tenant IDs e.g. '["uuid1","uuid2"]'
  target_tenants  TEXT                  NOT NULL DEFAULT 'all',
  expires_at      TIMESTAMP WITH TIME ZONE,
  is_active       BOOLEAN               NOT NULL DEFAULT TRUE,
  created_by      VARCHAR(255)          NOT NULL,   -- super admin email
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS announcements_active_idx  ON platform_announcements (is_active);
CREATE INDEX IF NOT EXISTS announcements_created_idx ON platform_announcements (created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON platform_announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON platform_announcements
  FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at();

-- ─── Seed: welcome announcement ───────────────────────────────
INSERT INTO platform_announcements (title, body, priority, target_tenants, is_active, created_by)
VALUES (
  'Welcome to HRMS Platform',
  'Your HRMS platform is now live. All modules are configured and ready for use. Contact your super administrator if you need any assistance.',
  'info',
  'all',
  TRUE,
  'admin@yahwehhrms.com'
) ON CONFLICT DO NOTHING;
