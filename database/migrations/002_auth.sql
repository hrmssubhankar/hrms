-- Migration 002: Super Admins table + auth seed
-- Run: psql $DATABASE_URL -f database/migrations/002_auth.sql

-- ─────────────────────────────────────────────
-- Super Admins table (platform-level, no tenant)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_super_admins_updated_at ON super_admins;
CREATE TRIGGER trg_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW EXECUTE FUNCTION update_super_admins_updated_at();

-- ─────────────────────────────────────────────
-- Seed: default super admin
-- Email:    admin@yahwehhrms.com
-- Password: Admin@Yahweh2024!   (change after first login!)
-- ─────────────────────────────────────────────
INSERT INTO super_admins (email, password_hash, name)
VALUES (
  'admin@yahwehhrms.com',
  '$2a$12$la3kdBSqwi7Mtq04w1aF5eT1Cxmml33XtDhqprgIHbsBcXTNjtI9W',
  'Super Admin'
)
ON CONFLICT (email) DO NOTHING;
