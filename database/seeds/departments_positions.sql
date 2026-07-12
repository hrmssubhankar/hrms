-- ── Departments & Positions Seed ─────────────────────────────────────────────
-- Yahweh Care Pty Ltd         00000000-0000-0000-0000-000000000001
-- Yahweh Property Care Pty Ltd 00000000-0000-0000-0000-000000000002
-- Run: psql "$DATABASE_URL" -f database/seeds/departments_positions.sql

-- ── Enable Employee Management module (2) for both tenants ───────────────────
INSERT INTO tenant_modules (tenant_id, module_id, is_enabled)
VALUES
  ('00000000-0000-0000-0000-000000000001', 2, true),
  ('00000000-0000-0000-0000-000000000002', 2, true)
ON CONFLICT (tenant_id, module_id) DO UPDATE SET is_enabled = true;

-- ── Departments — Yahweh Care ────────────────────────────────────────────────
INSERT INTO departments (id, tenant_id, name, description, is_active) VALUES
  ('10000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Direct Support',          'Front-line disability support workers',            true),
  ('10000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Community Access',        'Community participation and social inclusion',      true),
  ('10000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Supported Independent Living', 'SIL houses and residential support',          true),
  ('10000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Allied Health',           'Therapy and clinical support services',             true),
  ('10000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'HR & People',             'Human resources, recruitment and compliance',       true),
  ('10000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Finance & Admin',         'Finance, payroll and administrative functions',     true),
  ('10000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Quality & Compliance',    'NDIS quality, audit and compliance',               true),
  ('10000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Operations',              'Scheduling, rostering and operational management', true)
ON CONFLICT DO NOTHING;

-- ── Departments — Yahweh Property Care ──────────────────────────────────────
INSERT INTO departments (id, tenant_id, name, description, is_active) VALUES
  ('10000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Garden & Grounds',        'Lawn mowing, gardening and landscaping',            true),
  ('10000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Cleaning Services',       'Domestic and commercial cleaning',                 true),
  ('10000002-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Property Maintenance',    'Repairs, handyperson and maintenance services',    true),
  ('10000002-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'HR & Admin',              'Human resources and administration',               true),
  ('10000002-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Operations',              'Scheduling and operational management',            true)
ON CONFLICT DO NOTHING;

-- ── Positions — Yahweh Care ──────────────────────────────────────────────────
INSERT INTO positions (id, tenant_id, department_id, title, description, is_active) VALUES
  -- Direct Support
  ('20000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 'Support Worker',              'Provides direct support to NDIS participants',           true),
  ('20000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 'Senior Support Worker',       'Leads support shifts and mentors junior staff',          true),
  ('20000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 'Team Leader — Support',       'Manages a team of support workers',                     true),
  -- Community Access
  ('20000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002', 'Community Access Worker',     'Facilitates community participation activities',         true),
  -- SIL
  ('20000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000003', 'SIL Support Worker',          'Residential support in SIL properties',                 true),
  ('20000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000003', 'House Coordinator',           'Coordinates day-to-day operations of SIL houses',       true),
  -- Allied Health
  ('20000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000004', 'Occupational Therapist',      'Provides OT assessments and therapy',                   true),
  ('20000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000004', 'Speech Pathologist',          'Delivers speech and communication therapy',             true),
  ('20000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000004', 'Behaviour Support Practitioner', 'Develops positive behaviour support plans',           true),
  -- HR & People
  ('20000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000005', 'HR Officer',                  'Manages recruitment, onboarding and HR admin',          true),
  ('20000001-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000005', 'HR Manager',                  'Leads the HR & People function',                        true),
  -- Finance
  ('20000001-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000006', 'Finance Officer',             'Handles accounts payable, receivable and payroll',      true),
  -- Quality
  ('20000001-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000007', 'Quality & Compliance Officer','Manages NDIS audits and quality frameworks',            true),
  -- Operations
  ('20000001-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000008', 'Rostering Officer',           'Manages staff schedules and shift coverage',            true),
  ('20000001-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000008', 'Operations Manager',          'Oversees day-to-day service delivery operations',       true),
  ('20000001-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', NULL,                                   'Director',                    'Executive director of the organisation',                true)
ON CONFLICT DO NOTHING;

-- ── Positions — Yahweh Property Care ────────────────────────────────────────
INSERT INTO positions (id, tenant_id, department_id, title, description, is_active) VALUES
  ('20000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000001', 'Gardener',                    'Performs lawn mowing, weeding and garden care',         true),
  ('20000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000001', 'Senior Gardener',             'Leads garden teams and complex landscaping',            true),
  ('20000002-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000002', 'Cleaner',                     'Provides domestic and commercial cleaning services',    true),
  ('20000002-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000002', 'Cleaning Team Leader',        'Supervises cleaning crews and quality standards',       true),
  ('20000002-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000003', 'Handyperson',                 'General property maintenance and minor repairs',        true),
  ('20000002-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000003', 'Maintenance Supervisor',      'Oversees property maintenance works',                  true),
  ('20000002-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000004', 'HR & Admin Officer',          'Manages HR admin and staff coordination',               true),
  ('20000002-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', '10000002-0000-0000-0000-000000000005', 'Operations Manager',          'Manages scheduling and service delivery',               true),
  ('20000002-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', NULL,                                   'Director',                    'Executive director of the organisation',                true)
ON CONFLICT DO NOTHING;
