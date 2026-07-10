-- ============================================================
--  YAHWEH HRMS — Full Database Schema v1.0
--  28 Modules | Multi-Tenant | PostgreSQL RLS
--  Run against: Neon PostgreSQL
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tenant_tier AS ENUM ('starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin', 'director', 'hr_officer', 'compliance_manager',
    'operations_manager', 'team_leader', 'payroll_officer',
    'employee', 'contractor', 'auditor', 'it_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM (
    'full_time', 'part_time', 'casual', 'contractor', 'volunteer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE compliance_status AS ENUM ('green', 'amber', 'red', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('active', 'expired', 'archived', 'pending_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
--  MODULE 01 — TENANTS (Multi-Tenant Core)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  tier          tenant_tier  NOT NULL DEFAULT 'starter',
  logo_url      TEXT,
  primary_color VARCHAR(7),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  settings      JSONB   NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: Yahweh Care and Yahweh Property Care tenants
INSERT INTO tenants (id, name, slug, tier) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Yahweh Care Pty Ltd',          'yahweh-care',          'enterprise'),
  ('00000000-0000-0000-0000-000000000002', 'Yahweh Property Care Pty Ltd', 'yahweh-property-care', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS tenant_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id   INTEGER NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID,
  UNIQUE(tenant_id, module_id)
);

-- Seed all 28 modules as enabled (Enterprise tier) for both tenants
INSERT INTO tenant_modules (tenant_id, module_id, module_name, is_enabled)
SELECT t.id, m.module_id, m.module_name, TRUE
FROM tenants t
CROSS JOIN (VALUES
  (1,  'Enterprise Dashboard'),
  (2,  'Employee Master Profiles'),
  (3,  'RBAC & Custom Authentication'),
  (4,  'Audit Logging'),
  (5,  'Document Management System'),
  (6,  'Pre-Employment Screening'),
  (7,  'Compliance Lock System'),
  (8,  'Ongoing Compliance Tracking'),
  (9,  'Onboarding & Induction'),
  (10, 'Training Management & LMS'),
  (11, 'Competency Management'),
  (12, 'Supervision Management'),
  (13, 'Workforce Planning & Role Design'),
  (14, 'Recruitment & Applicant Tracking'),
  (15, 'Employment Contracting & E-Sign'),
  (16, 'Probation & Performance Management'),
  (17, 'WHS & Injury Management'),
  (18, 'Grievance & Investigation Management'),
  (19, 'Separation & Exit Management'),
  (20, 'Reporting & Analytics'),
  (21, 'Employee Experience & Benefits'),
  (22, 'Recognition & Rewards'),
  (23, 'Referral Program'),
  (24, 'Diversity, Equity & Inclusion'),
  (25, 'Employee Voice & Engagement'),
  (26, 'Asset & Equipment Register'),
  (27, 'Rostering & Attendance Integration'),
  (28, 'Payroll & Award Compliance Integration')
) AS m(module_id, module_name)
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  MODULE 03 — RBAC & AUTHENTICATION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email                VARCHAR(255) NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 user_role NOT NULL DEFAULT 'employee',
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  totp_secret          TEXT,
  totp_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at        TIMESTAMPTZ,
  password_changed_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);

-- Seed super-admin user (password: Admin@123 — CHANGE IN PRODUCTION)
INSERT INTO users (tenant_id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@yahwehcare.com.au',
  '$2a$12$placeholder_bcrypt_hash_change_before_prod',
  'super_admin',
  TRUE
) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  MODULE 02 — EMPLOYEE MASTER PROFILES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  parent_id   UUID REFERENCES departments(id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS positions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id         UUID REFERENCES departments(id),
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  is_participant_facing BOOLEAN NOT NULL DEFAULT FALSE,
  is_risk_assessed      BOOLEAN NOT NULL DEFAULT FALSE,
  is_key_personnel      BOOLEAN NOT NULL DEFAULT FALSE,
  is_whs_sensitive      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS employees (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id),
  employee_number       VARCHAR(50) NOT NULL,
  first_name            VARCHAR(100) NOT NULL,
  last_name             VARCHAR(100) NOT NULL,
  preferred_name        VARCHAR(100),
  date_of_birth         DATE,
  gender                VARCHAR(50),
  phone                 VARCHAR(20),
  email                 VARCHAR(255) NOT NULL,
  address               TEXT,
  photo_url             TEXT,
  -- Employment
  entity_name           VARCHAR(100),
  department_id         UUID REFERENCES departments(id),
  position_id           UUID REFERENCES positions(id),
  manager_id            UUID REFERENCES employees(id),
  employment_type       employment_type NOT NULL,
  award_classification  VARCHAR(100),
  pay_level             VARCHAR(50),
  start_date            DATE NOT NULL,
  probation_end_date    DATE,
  end_date              DATE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  -- Compliance
  compliance_status     compliance_status NOT NULL DEFAULT 'pending',
  ndis_worker           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant    ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager   ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status    ON employees(compliance_status);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  relationship VARCHAR(100),
  phone        VARCHAR(20),
  email        VARCHAR(255),
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 04 — AUDIT LOGGING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  user_id      UUID,
  action       VARCHAR(100) NOT NULL,
  resource     VARCHAR(100) NOT NULL,
  resource_id  UUID,
  old_values   JSONB,
  new_values   JSONB,
  ip_address   VARCHAR(45),
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
-- Audit logs cannot be updated or deleted (enforced via application layer + DB trigger)

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are tamper-evident and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ─────────────────────────────────────────────────────────────
--  MODULE 05 — DOCUMENT MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id),
  category        VARCHAR(100) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  blob_url        TEXT NOT NULL,
  file_name       VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type       VARCHAR(100),
  status          document_status NOT NULL DEFAULT 'active',
  expiry_date     DATE,
  uploaded_by     UUID,
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant   ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry   ON documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
--  MODULE 06 — PRE-EMPLOYMENT SCREENING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS screening_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_type       VARCHAR(100) NOT NULL,
  -- check_type values: police_check, wwcc, ndis_screening, identity, right_to_work,
  --                    visa, qualification, registration, drivers_licence, first_aid,
  --                    infection_control, manual_handling, immunisation
  status           compliance_status NOT NULL DEFAULT 'pending',
  reference_number VARCHAR(100),
  issued_date      DATE,
  expiry_date      DATE,
  document_id      UUID REFERENCES documents(id),
  notes            TEXT,
  verified_by      UUID,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_employee ON screening_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_screening_expiry   ON screening_records(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_screening_type     ON screening_records(check_type);

-- ─────────────────────────────────────────────────────────────
--  MODULE 07 — COMPLIANCE LOCK
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_lock_exceptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  reason       TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  approved_by  UUID NOT NULL,
  approved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 08 — ONGOING COMPLIANCE TRACKING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  item_type       VARCHAR(100) NOT NULL,
  status          compliance_status NOT NULL DEFAULT 'green',
  due_date        DATE,
  last_checked_at TIMESTAMPTZ,
  escalated_at    TIMESTAMPTZ,
  escalated_to    UUID,
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_tracking_emp    ON compliance_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_due    ON compliance_tracking(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON compliance_tracking(status);

-- ─────────────────────────────────────────────────────────────
--  MODULE 09 — ONBOARDING & INDUCTION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  stage        VARCHAR(50) NOT NULL,
  -- stages: pre_start, day1, week1, weeks2_4, end_probation, fully_active
  status       VARCHAR(50) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  buddy_id     UUID REFERENCES employees(id),
  notes        TEXT,
  checklist    JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 10 — TRAINING MANAGEMENT & LMS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  category         VARCHAR(100),
  is_mandatory     BOOLEAN NOT NULL DEFAULT FALSE,
  validity_months  INTEGER,
  content          JSONB NOT NULL DEFAULT '[]',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard NDIS courses
INSERT INTO courses (tenant_id, title, category, is_mandatory, validity_months) VALUES
  ('00000000-0000-0000-0000-000000000001', 'NDIS Worker Orientation Module',   'ndis',       TRUE, 36),
  ('00000000-0000-0000-0000-000000000001', 'Code of Conduct',                  'compliance', TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'WHS Induction',                    'safety',     TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'Manual Handling',                  'safety',     TRUE, 24),
  ('00000000-0000-0000-0000-000000000001', 'Infection Control',                'health',     TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'First Aid / CPR',                  'health',     TRUE, 36),
  ('00000000-0000-0000-0000-000000000001', 'Client Rights & Responsibilities', 'ndis',       TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'Safeguarding',                     'compliance', TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'Fire & Emergency Procedures',      'safety',     TRUE, 12),
  ('00000000-0000-0000-0000-000000000001', 'Medication Support',               'clinical',   FALSE, 24),
  ('00000000-0000-0000-0000-000000000001', 'Behaviour Support',                'clinical',   FALSE, 24),
  ('00000000-0000-0000-0000-000000000001', 'Cleaning Chemical Safety',         'safety',     TRUE, 12)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS training_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  employee_id      UUID NOT NULL REFERENCES employees(id),
  course_id        UUID NOT NULL REFERENCES courses(id),
  status           VARCHAR(50) NOT NULL DEFAULT 'enrolled',
  -- statuses: enrolled, in_progress, completed, failed, expired
  completed_at     TIMESTAMPTZ,
  expiry_date      DATE,
  certificate_url  TEXT,
  score            DECIMAL(5,2),
  attempts         INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_employee ON training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_expiry   ON training_records(expiry_date);

-- ─────────────────────────────────────────────────────────────
--  MODULE 11 — COMPETENCY MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS competency_assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  competency_id  UUID NOT NULL REFERENCES competencies(id),
  assessor_id    UUID REFERENCES employees(id),
  outcome        VARCHAR(50),  -- competent, not_yet_competent
  assessed_at    TIMESTAMPTZ,
  expiry_date    DATE,
  evidence       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 12 — SUPERVISION MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS supervision_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  supervisor_id   UUID NOT NULL REFERENCES employees(id),
  scheduled_date  DATE NOT NULL,
  conducted_at    TIMESTAMPTZ,
  type            VARCHAR(50),  -- regular, probation, high_risk
  status          VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  action_items    JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 13 — WORKFORCE PLANNING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS headcount_plan (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  department_id  UUID REFERENCES departments(id),
  position_id    UUID REFERENCES positions(id),
  planned_count  INTEGER NOT NULL,
  current_count  INTEGER NOT NULL DEFAULT 0,
  vacancy_count  INTEGER NOT NULL DEFAULT 0,
  target_date    DATE,
  status         VARCHAR(50) NOT NULL DEFAULT 'open',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 14 — RECRUITMENT & ATS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_requisitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  position_id  UUID REFERENCES positions(id),
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  status       VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- statuses: draft, pending_approval, approved, advertised, closed
  requested_by UUID,
  approved_by  UUID,
  approved_at  TIMESTAMPTZ,
  closed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  resume_url  TEXT,
  source      VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  requisition_id  UUID NOT NULL REFERENCES job_requisitions(id),
  candidate_id    UUID NOT NULL REFERENCES candidates(id),
  status          VARCHAR(50) NOT NULL DEFAULT 'received',
  -- statuses: received, shortlisted, interviewed, pre_employment_checks, offer, hired, rejected
  interview_score DECIMAL(5,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  application_id  UUID NOT NULL REFERENCES applications(id),
  interviewer_id  UUID REFERENCES employees(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  type            VARCHAR(50),  -- phone, video, in_person, panel
  scorecard       JSONB,
  notes           TEXT,
  recommendation  VARCHAR(50)   -- proceed, hold, reject
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 15 — EMPLOYMENT CONTRACTING & E-SIGN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  employee_id      UUID NOT NULL REFERENCES employees(id),
  type             VARCHAR(100) NOT NULL,  -- employment, casual, contractor, variation
  pdf_url          TEXT,
  signed_pdf_url   TEXT,
  status           VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- statuses: draft, sent, signed, countersigned, archived
  sent_at          TIMESTAMPTZ,
  signed_at        TIMESTAMPTZ,
  signature_ip     VARCHAR(45),
  signature_data   TEXT,  -- PNG base64
  tfn_provided     BOOLEAN NOT NULL DEFAULT FALSE,
  super_fund       VARCHAR(200),
  bank_bsb         VARCHAR(10),
  bank_account     VARCHAR(20),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 16 — PROBATION & PERFORMANCE MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  employee_id      UUID NOT NULL REFERENCES employees(id),
  reviewer_id      UUID REFERENCES employees(id),
  type             VARCHAR(50) NOT NULL,
  -- types: probation_4wk, mid_probation, end_probation, annual, kpi, pip
  status           VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  scheduled_date   DATE,
  completed_at     TIMESTAMPTZ,
  overall_rating   DECIMAL(3,1),
  employee_input   JSONB,
  manager_input    JSONB,
  kpis             JSONB NOT NULL DEFAULT '[]',
  development_plan TEXT,
  outcome          VARCHAR(100),  -- confirmed, extended, pip, terminated
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pip_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  review_id      UUID REFERENCES performance_reviews(id),
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  objectives     JSONB NOT NULL DEFAULT '[]',
  status         VARCHAR(50) NOT NULL DEFAULT 'active',
  outcome        VARCHAR(100),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 17 — WHS & INJURY MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS whs_incidents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  reported_by        UUID NOT NULL REFERENCES employees(id),
  employee_id        UUID REFERENCES employees(id),
  type               VARCHAR(100) NOT NULL,  -- hazard, injury, near_miss, unsafe_condition
  severity           VARCHAR(50),            -- low, medium, high, critical
  description        TEXT NOT NULL,
  location           VARCHAR(200),
  occurred_at        TIMESTAMPTZ NOT NULL,
  status             VARCHAR(50) NOT NULL DEFAULT 'open',
  corrective_actions JSONB NOT NULL DEFAULT '[]',
  closed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  incident_id    UUID REFERENCES whs_incidents(id),
  title          VARCHAR(300) NOT NULL,
  hazard         TEXT NOT NULL,
  likelihood     INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  consequence    INTEGER CHECK (consequence BETWEEN 1 AND 5),
  risk_score     INTEGER GENERATED ALWAYS AS (likelihood * consequence) STORED,
  controls       JSONB NOT NULL DEFAULT '[]',
  residual_risk  INTEGER,
  reviewed_by    UUID,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whs_inspections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  type           VARCHAR(100),  -- workplace, client_home, site_safety
  location       VARCHAR(200),
  inspector_id   UUID REFERENCES employees(id),
  conducted_at   TIMESTAMPTZ NOT NULL,
  findings       JSONB NOT NULL DEFAULT '[]',
  actions        JSONB NOT NULL DEFAULT '[]',
  status         VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 18 — GRIEVANCE & INVESTIGATION MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grievances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  lodged_by    UUID REFERENCES employees(id),  -- NULL = anonymous
  subject_id   UUID REFERENCES employees(id),
  type         VARCHAR(100) NOT NULL,  -- grievance, misconduct, bullying, safety
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  risk_rating  VARCHAR(20),  -- low, medium, high, critical
  description  TEXT NOT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'new',
  -- flow: new → triage → assigned → evidence → response → findings → outcome → closed
  assigned_to  UUID,
  outcome      TEXT,
  closed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigation_evidence (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id   UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  document_id    UUID REFERENCES documents(id),
  submitted_by   UUID,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 19 — SEPARATION & EXIT MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS separation_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  employee_id             UUID NOT NULL REFERENCES employees(id),
  type                    VARCHAR(100) NOT NULL,  -- resignation, termination, redundancy, contract_end
  reason                  TEXT,
  notice_date             DATE,
  last_working_day        DATE,
  exit_interview_at       TIMESTAMPTZ,
  exit_interview_notes    TEXT,
  checklist_complete      BOOLEAN NOT NULL DEFAULT FALSE,
  assets_returned         BOOLEAN NOT NULL DEFAULT FALSE,
  system_access_revoked   BOOLEAN NOT NULL DEFAULT FALSE,
  status                  VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 20 — REPORTING & ANALYTICS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            VARCHAR(300) NOT NULL,
  type            VARCHAR(100) NOT NULL,
  parameters      JSONB NOT NULL DEFAULT '{}',
  schedule_cron   VARCHAR(100),  -- e.g. '0 8 * * 1' = Monday 8am
  recipients      JSONB NOT NULL DEFAULT '[]',
  last_run_at     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 21 — EMPLOYEE EXPERIENCE & BENEFITS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_benefits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  type         VARCHAR(100) NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 22 — RECOGNITION & REWARDS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recognitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  recipient_id     UUID NOT NULL REFERENCES employees(id),
  nominated_by     UUID REFERENCES employees(id),
  type             VARCHAR(100) NOT NULL,
  reason           TEXT,
  certificate_url  TEXT,
  period           VARCHAR(50),
  is_public        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 23 — REFERRAL PROGRAM
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  referrer_id           UUID NOT NULL REFERENCES employees(id),
  referred_employee_id  UUID REFERENCES employees(id),
  referred_name         VARCHAR(200),
  referred_email        VARCHAR(255),
  status                VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- statuses: pending, hired, probation_complete, bonus_approved, paid
  bonus_amount          DECIMAL(10,2),
  bonus_paid_at         TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 24 — DIVERSITY, EQUITY & INCLUSION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS diversity_data (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  employee_id            UUID NOT NULL REFERENCES employees(id),
  gender                 VARCHAR(50),
  indigenous_status      BOOLEAN,
  disability_status      BOOLEAN,
  cultural_background    VARCHAR(100),
  adjustments_required   TEXT,
  self_reported          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, employee_id)
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 25 — EMPLOYEE VOICE & ENGAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS surveys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  title        VARCHAR(300) NOT NULL,
  type         VARCHAR(100),  -- new_starter_30, probation_90, annual, exit
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  questions    JSONB NOT NULL DEFAULT '[]',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  survey_id    UUID NOT NULL REFERENCES surveys(id),
  employee_id  UUID REFERENCES employees(id),  -- NULL = anonymous
  answers      JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 26 — ASSET & EQUIPMENT REGISTER
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          VARCHAR(200) NOT NULL,
  category      VARCHAR(100) NOT NULL,  -- uniform, ppe, laptop, mobile, keys, cleaning_equipment
  serial_number VARCHAR(100),
  status        VARCHAR(50) NOT NULL DEFAULT 'available',  -- available, assigned, lost, damaged
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  asset_id     UUID NOT NULL REFERENCES assets(id),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by    UUID,
  returned_at  TIMESTAMPTZ,
  returned_to  UUID,
  condition    VARCHAR(50),
  notes        TEXT
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 27 — ROSTERING & ATTENDANCE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shifts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  employee_id         UUID NOT NULL REFERENCES employees(id),
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  location            VARCHAR(200),
  client_site         VARCHAR(200),
  status              VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  compliance_passed   BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timesheets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  shift_id     UUID REFERENCES shifts(id),
  clock_in     TIMESTAMPTZ,
  clock_out    TIMESTAMPTZ,
  hours_worked DECIMAL(5,2),
  approved_by  UUID,
  approved_at  TIMESTAMPTZ,
  status       VARCHAR(50) NOT NULL DEFAULT 'pending'
);

-- ─────────────────────────────────────────────────────────────
--  MODULE 28 — PAYROLL & AWARD COMPLIANCE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  employee_id       UUID NOT NULL REFERENCES employees(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  gross_pay         DECIMAL(10,2),
  net_pay           DECIMAL(10,2),
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  exported_to_xero  BOOLEAN NOT NULL DEFAULT FALSE,
  exported_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  NOTIFICATIONS (Cross-module)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(300) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ─────────────────────────────────────────────────────────────
--  ROW-LEVEL SECURITY (PostgreSQL RLS)
--  Enforces multi-tenant isolation at the database engine level.
--  App sets: SET app.current_tenant_id = '<uuid>';
-- ─────────────────────────────────────────────────────────────

-- Helper function to get current tenant from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tenant-scoped tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','employees','departments','positions','emergency_contacts',
    'tenant_modules','audit_logs','documents',
    'screening_records','compliance_lock_exceptions','compliance_tracking','onboarding_records',
    'courses','training_records','competencies','competency_assessments','supervision_records',
    'headcount_plan','job_requisitions','candidates','applications','interviews','contracts',
    'performance_reviews','pip_records',
    'whs_incidents','risk_assessments','whs_inspections',
    'grievances','investigation_evidence','separation_records',
    'scheduled_reports','employee_benefits','recognitions','referrals',
    'diversity_data','surveys','survey_responses',
    'assets','asset_assignments','shifts','timesheets','payroll_records','notifications'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Super-admin bypass policy
    EXECUTE format(
      'CREATE POLICY tenant_isolation_bypass ON %I
       AS PERMISSIVE FOR ALL
       TO postgres
       USING (TRUE)',
      tbl
    );

    -- Tenant isolation policy for application role
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
       AS PERMISSIVE FOR ALL
       USING (tenant_id = current_tenant_id())',
      tbl
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  updated_at TRIGGER (auto-updates timestamps)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tenants','users','employees','documents',
    'screening_records','onboarding_records','compliance_tracking',
    'applications','grievances'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;

-- Done
SELECT 'Yahweh HRMS schema v1.0 installed successfully.' AS result;
