-- =============================================================
-- YAHWEH HRMS — Delete all users and recreate per credentials
-- Run in Supabase SQL Editor
-- Requires: pgcrypto extension (enabled by default in Supabase)
-- Bcrypt rounds: 12 (matches app's bcryptjs config)
-- =============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── STEP 1: Wipe existing users ─────────────────────────────

DELETE FROM hrms_super_admins;
DELETE FROM hrms_users;

-- ─── STEP 2: Get tenant IDs (run this SELECT first to verify) ─
-- SELECT id, name, slug FROM hrms_tenants ORDER BY name;

-- ─── STEP 3: Insert Super Admin ──────────────────────────────

INSERT INTO hrms_super_admins (
  email,
  password_hash,
  name,
  is_active,
  created_at,
  updated_at
) VALUES (
  'superadmin@yahwehhrms.com.au',
  crypt('SuperAdmin2024!', gen_salt('bf', 12)),
  'Super Admin',
  true,
  now(),
  now()
);

-- ─── STEP 4: Insert Yahweh Care users ────────────────────────
-- Uses a DO block to look up the tenant_id dynamically by slug

DO $$
DECLARE
  care_tenant_id uuid;
  pc_tenant_id   uuid;
BEGIN

  -- Look up tenant IDs by slug (adjust slug values if different in your DB)
  SELECT id INTO care_tenant_id FROM hrms_tenants WHERE slug ILIKE '%care%' OR name ILIKE '%yahweh care%' LIMIT 1;
  SELECT id INTO pc_tenant_id   FROM hrms_tenants WHERE slug ILIKE '%pc%'   OR name ILIKE '%property%'   LIMIT 1;

  IF care_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Yahweh Care tenant — check hrms_tenants.slug values';
  END IF;
  IF pc_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Yahweh Property Care tenant — check hrms_tenants.slug values';
  END IF;

  -- ── Yahweh Care users ──────────────────────────────────────

  INSERT INTO hrms_users (tenant_id, email, password_hash, role, is_active, totp_enabled, created_at, updated_at) VALUES
    (care_tenant_id, 'director@yahwehcare.com.au',    crypt('Director@2024',   gen_salt('bf', 12)), 'director',             true, false, now(), now()),
    (care_tenant_id, 'hr@yahwehcare.com.au',           crypt('HROfficer@2024',  gen_salt('bf', 12)), 'hr_officer',           true, false, now(), now()),
    (care_tenant_id, 'compliance@yahwehcare.com.au',   crypt('Manager@2024',    gen_salt('bf', 12)), 'compliance_manager',   true, false, now(), now()),
    (care_tenant_id, 'ops@yahwehcare.com.au',          crypt('Manager@2024',    gen_salt('bf', 12)), 'operations_manager',   true, false, now(), now()),
    (care_tenant_id, 'teamlead@yahwehcare.com.au',     crypt('TeamLead@2024',   gen_salt('bf', 12)), 'team_leader',          true, false, now(), now()),
    (care_tenant_id, 'payroll@yahwehcare.com.au',      crypt('Payroll@2024',    gen_salt('bf', 12)), 'payroll_officer',      true, false, now(), now()),
    (care_tenant_id, 'employee@yahwehcare.com.au',     crypt('Employee@2024',   gen_salt('bf', 12)), 'employee',             true, false, now(), now()),
    (care_tenant_id, 'contractor@yahwehcare.com.au',   crypt('Contractor@2024', gen_salt('bf', 12)), 'contractor',           true, false, now(), now()),
    (care_tenant_id, 'auditor@yahwehcare.com.au',      crypt('Auditor@2024',    gen_salt('bf', 12)), 'auditor',              true, false, now(), now()),
    (care_tenant_id, 'itadmin@yahwehcare.com.au',      crypt('ItAdmin@2024',    gen_salt('bf', 12)), 'it_admin',             true, false, now(), now());

  -- ── Yahweh Property Care users ────────────────────────────

  INSERT INTO hrms_users (tenant_id, email, password_hash, role, is_active, totp_enabled, created_at, updated_at) VALUES
    (pc_tenant_id, 'director@yahwehpc.com.au',    crypt('Director@2024',   gen_salt('bf', 12)), 'director',             true, false, now(), now()),
    (pc_tenant_id, 'hr@yahwehpc.com.au',           crypt('HROfficer@2024',  gen_salt('bf', 12)), 'hr_officer',           true, false, now(), now()),
    (pc_tenant_id, 'compliance@yahwehpc.com.au',   crypt('Manager@2024',    gen_salt('bf', 12)), 'compliance_manager',   true, false, now(), now()),
    (pc_tenant_id, 'ops@yahwehpc.com.au',          crypt('Manager@2024',    gen_salt('bf', 12)), 'operations_manager',   true, false, now(), now()),
    (pc_tenant_id, 'teamlead@yahwehpc.com.au',     crypt('TeamLead@2024',   gen_salt('bf', 12)), 'team_leader',          true, false, now(), now()),
    (pc_tenant_id, 'payroll@yahwehpc.com.au',      crypt('Payroll@2024',    gen_salt('bf', 12)), 'payroll_officer',      true, false, now(), now()),
    (pc_tenant_id, 'employee@yahwehpc.com.au',     crypt('Employee@2024',   gen_salt('bf', 12)), 'employee',             true, false, now(), now()),
    (pc_tenant_id, 'contractor@yahwehpc.com.au',   crypt('Contractor@2024', gen_salt('bf', 12)), 'contractor',           true, false, now(), now()),
    (pc_tenant_id, 'auditor@yahwehpc.com.au',      crypt('Auditor@2024',    gen_salt('bf', 12)), 'auditor',              true, false, now(), now()),
    (pc_tenant_id, 'itadmin@yahwehpc.com.au',      crypt('ItAdmin@2024',    gen_salt('bf', 12)), 'it_admin',             true, false, now(), now());

  RAISE NOTICE 'Done! care_tenant_id=%, pc_tenant_id=%', care_tenant_id, pc_tenant_id;
END $$;

-- ─── STEP 5: Verify ──────────────────────────────────────────

SELECT 'super_admins' AS tbl, COUNT(*) FROM hrms_super_admins
UNION ALL
SELECT 'hrms_users',           COUNT(*) FROM hrms_users;

SELECT u.email, u.role, t.name AS tenant
FROM hrms_users u
JOIN hrms_tenants t ON t.id = u.tenant_id
ORDER BY t.name, u.role;
