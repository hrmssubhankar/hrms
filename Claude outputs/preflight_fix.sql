-- =============================================================
-- YAHWEH HRMS — Pre-flight schema alignment
-- Run this ONCE in Supabase SQL Editor BEFORE drizzle-kit push
-- Safe to re-run: every block checks current column type first
-- =============================================================

-- ─── 1. CREATE ENUMS (if they don't exist yet) ───────────────

DO $$ BEGIN
  CREATE TYPE "public"."tenant_tier" AS ENUM('starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('super_admin','director','hr_officer','compliance_manager','operations_manager','team_leader','payroll_officer','employee','contractor','auditor','it_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."employment_type" AS ENUM('full_time','part_time','casual','contractor','volunteer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."compliance_status" AS ENUM('green','amber','red','pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."document_status" AS ENUM('active','expired','archived','pending_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."leave_type" AS ENUM('annual','sick','personal','unpaid','long_service','carer','compassionate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."leave_status" AS ENUM('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."announcement_priority" AS ENUM('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─── 2. CAST HELPER: only alters if column is still varchar/text ──

-- hrms_employees.employment_type  (enum, no default)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_employees'
      AND column_name = 'employment_type' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_employees" ALTER COLUMN "employment_type" DROP DEFAULT;
    ALTER TABLE "hrms_employees" ALTER COLUMN "employment_type"
      SET DATA TYPE "public"."employment_type"
      USING "employment_type"::"public"."employment_type";
  END IF;
END $$;

-- hrms_employees.compliance_status  (enum, default 'pending')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_employees'
      AND column_name = 'compliance_status' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_employees" ALTER COLUMN "compliance_status" DROP DEFAULT;
    ALTER TABLE "hrms_employees" ALTER COLUMN "compliance_status"
      SET DATA TYPE "public"."compliance_status"
      USING "compliance_status"::"public"."compliance_status";
    ALTER TABLE "hrms_employees" ALTER COLUMN "compliance_status"
      SET DEFAULT 'pending'::"public"."compliance_status";
  END IF;
END $$;

-- hrms_tenants.tier  (enum, default 'starter')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_tenants'
      AND column_name = 'tier' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_tenants" ALTER COLUMN "tier" DROP DEFAULT;
    ALTER TABLE "hrms_tenants" ALTER COLUMN "tier"
      SET DATA TYPE "public"."tenant_tier"
      USING "tier"::"public"."tenant_tier";
    ALTER TABLE "hrms_tenants" ALTER COLUMN "tier"
      SET DEFAULT 'starter'::"public"."tenant_tier";
  END IF;
END $$;

-- hrms_users.role  (enum, default 'employee')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_users'
      AND column_name = 'role' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "hrms_users" ALTER COLUMN "role"
      SET DATA TYPE "public"."user_role"
      USING "role"::"public"."user_role";
    ALTER TABLE "hrms_users" ALTER COLUMN "role"
      SET DEFAULT 'employee'::"public"."user_role";
  END IF;
END $$;

-- hrms_documents.status  (document_status enum, default 'active')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_documents'
      AND column_name = 'status' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_documents" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "hrms_documents" ALTER COLUMN "status"
      SET DATA TYPE "public"."document_status"
      USING "status"::"public"."document_status";
    ALTER TABLE "hrms_documents" ALTER COLUMN "status"
      SET DEFAULT 'active'::"public"."document_status";
  END IF;
END $$;

-- hrms_screening_records.status  (compliance_status enum, default 'pending')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_screening_records'
      AND column_name = 'status' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_screening_records" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "hrms_screening_records" ALTER COLUMN "status"
      SET DATA TYPE "public"."compliance_status"
      USING "status"::"public"."compliance_status";
    ALTER TABLE "hrms_screening_records" ALTER COLUMN "status"
      SET DEFAULT 'pending'::"public"."compliance_status";
  END IF;
END $$;

-- hrms_compliance_tracking.status  (compliance_status enum, default 'green')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_compliance_tracking'
      AND column_name = 'status' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_compliance_tracking" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "hrms_compliance_tracking" ALTER COLUMN "status"
      SET DATA TYPE "public"."compliance_status"
      USING "status"::"public"."compliance_status";
    ALTER TABLE "hrms_compliance_tracking" ALTER COLUMN "status"
      SET DEFAULT 'green'::"public"."compliance_status";
  END IF;
END $$;

-- hrms_leave_requests.leave_type  (leave_type enum, no default)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_leave_requests'
      AND column_name = 'leave_type' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_leave_requests" ALTER COLUMN "leave_type" DROP DEFAULT;
    ALTER TABLE "hrms_leave_requests" ALTER COLUMN "leave_type"
      SET DATA TYPE "public"."leave_type"
      USING "leave_type"::"public"."leave_type";
  END IF;
END $$;

-- hrms_leave_requests.status  (leave_status enum, default 'pending')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_leave_requests'
      AND column_name = 'status' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_leave_requests" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "hrms_leave_requests" ALTER COLUMN "status"
      SET DATA TYPE "public"."leave_status"
      USING "status"::"public"."leave_status";
    ALTER TABLE "hrms_leave_requests" ALTER COLUMN "status"
      SET DEFAULT 'pending'::"public"."leave_status";
  END IF;
END $$;

-- hrms_platform_announcements.priority  (announcement_priority enum, default 'info')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_platform_announcements'
      AND column_name = 'priority' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_platform_announcements" ALTER COLUMN "priority" DROP DEFAULT;
    ALTER TABLE "hrms_platform_announcements" ALTER COLUMN "priority"
      SET DATA TYPE "public"."announcement_priority"
      USING "priority"::"public"."announcement_priority";
    ALTER TABLE "hrms_platform_announcements" ALTER COLUMN "priority"
      SET DEFAULT 'info'::"public"."announcement_priority";
  END IF;
END $$;


-- ─── 3. JSONB CASTS (only if still text/varchar) ─────────────

-- hrms_audit_logs.old_values / new_values
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_audit_logs'
      AND column_name = 'old_values' AND data_type IN ('character varying','text','character')
  ) THEN
    ALTER TABLE "hrms_audit_logs"
      ALTER COLUMN "old_values" SET DATA TYPE jsonb USING old_values::jsonb,
      ALTER COLUMN "new_values" SET DATA TYPE jsonb USING new_values::jsonb;
  END IF;
END $$;

-- hrms_survey_responses.answers
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_survey_responses'
      AND column_name = 'answers' AND data_type IN ('character varying','text','character')
  ) THEN
    ALTER TABLE "hrms_survey_responses" ALTER COLUMN "answers" DROP DEFAULT;
    ALTER TABLE "hrms_survey_responses" ALTER COLUMN "answers"
      SET DATA TYPE jsonb USING answers::jsonb;
  END IF;
END $$;

-- hrms_employee_experience.employment_type  (varchar→enum, default 'full_time')
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hrms_employee_experience'
      AND column_name = 'employment_type' AND data_type IN ('character varying','text')
  ) THEN
    ALTER TABLE "hrms_employee_experience" ALTER COLUMN "employment_type" DROP DEFAULT;
    ALTER TABLE "hrms_employee_experience" ALTER COLUMN "employment_type"
      SET DATA TYPE "public"."employment_type"
      USING "employment_type"::"public"."employment_type";
    ALTER TABLE "hrms_employee_experience" ALTER COLUMN "employment_type"
      SET DEFAULT 'full_time'::"public"."employment_type";
  END IF;
END $$;


-- ─── 4. UNIQUE CONSTRAINTS (safe add — skips if already exists) ──

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hrms_tenants_slug_unique' AND conrelid = 'hrms_tenants'::regclass
  ) THEN
    ALTER TABLE "hrms_tenants" ADD CONSTRAINT "hrms_tenants_slug_unique" UNIQUE ("slug");
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hrms_super_admins_email_unique' AND conrelid = 'hrms_super_admins'::regclass
  ) THEN
    ALTER TABLE "hrms_super_admins" ADD CONSTRAINT "hrms_super_admins_email_unique" UNIQUE ("email");
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ─── 5. FIX NULL tenant_id rows blocking NOT NULL constraint ──

-- Already fixed (superadmin@yahwehhrms.com.au deleted), but kept as safety net:
-- DELETE FROM hrms_users WHERE tenant_id IS NULL;


-- Done. You can now run drizzle-kit push safely.
-- Answer prompts: N (hrms_tenants truncate), N (hrms_super_admins truncate), Y (accept column drops)
