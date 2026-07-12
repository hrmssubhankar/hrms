-- ── Enable Additional Modules ──────────────────────────────────────────────────
-- Yahweh Care Pty Ltd          00000000-0000-0000-0000-000000000001
-- Yahweh Property Care Pty Ltd 00000000-0000-0000-0000-000000000002
-- Run: psql "$DATABASE_URL" -f database/seeds/enable_modules.sql

-- Module 9  — Onboarding & Induction
-- Module 5  — Document Management
-- Module 6  — Pre-Employment Screening / Compliance
-- Module 27 — Rostering & Timesheets

INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled) VALUES
  -- Yahweh Care
  ('00000000-0000-0000-0000-000000000001',  9, 'Onboarding & Induction',     true),
  ('00000000-0000-0000-0000-000000000001',  5, 'Document Management',        true),
  ('00000000-0000-0000-0000-000000000001',  6, 'Compliance Screening',       true),
  ('00000000-0000-0000-0000-000000000001', 27, 'Rostering & Timesheets',     true),
  -- Yahweh Property Care
  ('00000000-0000-0000-0000-000000000002',  9, 'Onboarding & Induction',     true),
  ('00000000-0000-0000-0000-000000000002',  5, 'Document Management',        true),
  ('00000000-0000-0000-0000-000000000002',  6, 'Compliance Screening',       true),
  ('00000000-0000-0000-0000-000000000002', 27, 'Rostering & Timesheets',     true)
ON CONFLICT (tenant_id, module_id) DO UPDATE SET is_enabled = true, module_name = EXCLUDED.module_name;
