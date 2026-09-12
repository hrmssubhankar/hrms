-- Safe migration: only adds missing objects

-- Run in Supabase SQL Editor


ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "requisition_id" uuid NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "candidate_id" uuid NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'received' NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "interview_score" numeric(5, 2);

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_applications" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_applications handled above)

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "asset_id" uuid NOT NULL;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "issued_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "issued_by" uuid;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "returned_at" timestamp;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "returned_to" uuid;

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "condition" varchar(50);

ALTER TABLE "hrms_asset_assignments" ADD COLUMN IF NOT EXISTS "notes" text;

-- (table hrms_asset_assignments handled above)

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "name" varchar(200) NOT NULL;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "category" varchar(100) NOT NULL;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "serial_number" varchar(100);

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'available' NOT NULL;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_assets" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_assets handled above)

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "user_id" uuid;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "action" varchar(100) NOT NULL;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "resource" varchar(100) NOT NULL;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "resource_id" uuid;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "old_values" jsonb;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "new_values" jsonb;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "ip_address" varchar(45);

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "user_agent" text;

ALTER TABLE "hrms_audit_logs" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_audit_logs handled above)

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "first_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "last_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "email" varchar(255) NOT NULL;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "resume_url" text;

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "source" varchar(100);

ALTER TABLE "hrms_candidates" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_candidates handled above)

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "name" varchar(200) NOT NULL;

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "category" varchar(100);

ALTER TABLE "hrms_competencies" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

-- (table hrms_competencies handled above)

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "competency_id" uuid NOT NULL;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "assessor_id" uuid;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "outcome" varchar(50);

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "assessed_at" timestamp;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "evidence" text;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_competency_assessments" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_competency_assessments handled above)

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "reason" text NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "expires_at" timestamp NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "approved_by" uuid NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "approved_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_compliance_lock_exceptions" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

-- (table hrms_compliance_lock_exceptions handled above)

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "item_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "status" "compliance_status" DEFAULT 'green' NOT NULL;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "due_date" date;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "last_checked_at" timestamp;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "escalated_at" timestamp;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "escalated_to" uuid;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_compliance_tracking" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_compliance_tracking handled above)

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "pdf_url" text;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "signed_pdf_url" text;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "sent_at" timestamp;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "signed_at" timestamp;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "signature_ip" varchar(45);

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "signature_data" text;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "tfn_provided" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "super_fund" varchar(200);

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "bank_bsb" varchar(10);

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "bank_account" varchar(20);

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_contracts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_contracts handled above)

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "category" varchar(100);

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "is_mandatory" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "validity_months" integer;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "content" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_courses" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_courses handled above)

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "industry" varchar(100);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "website" varchar(500);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "phone" varchar(50);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "address" text;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "city" varchar(100);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "state" varchar(100);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "country" varchar(100);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "abn" varchar(20);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "revenue" numeric(15, 2);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "employees" integer;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "type" varchar(50) DEFAULT 'prospect';

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active';

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_crm_accounts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_crm_accounts handled above)

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "type" varchar(50) NOT NULL;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "subject" varchar(255) NOT NULL;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "due_date" timestamp;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "is_done" boolean DEFAULT false;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "related_type" varchar(50);

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "related_id" uuid;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_crm_activities" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_crm_activities handled above)

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "account_id" uuid;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "first_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "last_name" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "phone" varchar(50);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "mobile" varchar(50);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "job_title" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "department" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_crm_contacts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_crm_contacts handled above)

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "account_id" uuid;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "contact_id" uuid;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "value" numeric(15, 2);

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'AUD';

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "stage" varchar(50) DEFAULT 'prospecting' NOT NULL;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "probability" integer DEFAULT 0;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "close_date" date;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "source" varchar(100);

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "lost_reason" text;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_crm_deals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_crm_deals handled above)

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "first_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "last_name" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "phone" varchar(50);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "company" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "job_title" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "source" varchar(100);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'new' NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "stage" varchar(50) DEFAULT 'new' NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "score" integer DEFAULT 0;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "converted_at" timestamp;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "converted_to_id" uuid;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_crm_leads" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_crm_leads handled above)

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "name" varchar(200) NOT NULL;

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "parent_id" uuid;

ALTER TABLE "hrms_departments" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

-- (table hrms_departments handled above)

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "gender" varchar(50);

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "indigenous_status" boolean;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "disability_status" boolean;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "cultural_background" varchar(100);

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "adjustments_required" text;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "self_reported" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_diversity_data" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_diversity_data handled above)

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "employee_id" uuid;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "category" varchar(100) NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "blob_url" text NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "file_name" varchar(255);

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "file_size_bytes" integer;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "mime_type" varchar(100);

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "status" "document_status" DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "uploaded_by" uuid;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_documents" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_documents handled above)

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "name" varchar(200) NOT NULL;

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "relationship" varchar(100);

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_emergency_contacts" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL;

-- (table hrms_emergency_contacts handled above)

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "day_of_week" integer NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "start_time" varchar(5) NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "end_time" varchar(5) NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "is_available" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "note" text;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_employee_availability" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_employee_availability handled above)

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "start_date" date;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_employee_benefits" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_employee_benefits handled above)

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "company_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "job_title" varchar(255) NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "employment_type" varchar(50) DEFAULT 'full_time' NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "start_date" date NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "is_current" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "location" varchar(255);

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "reason_for_leaving" varchar(255);

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_employee_experience" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_employee_experience handled above)

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "author_id" uuid NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "author_email" varchar(255) NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "content" text NOT NULL;

ALTER TABLE "hrms_employee_notes" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_employee_notes handled above)

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "user_id" uuid;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "employee_number" varchar(50) NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "first_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "last_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "preferred_name" varchar(100);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "date_of_birth" date;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "gender" varchar(50);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "email" varchar(255) NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "address" text;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "photo_url" text;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "entity_name" varchar(100);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "department_id" uuid;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "position_id" uuid;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "manager_id" uuid;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "employment_type" "employment_type" NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "award_classification" varchar(100);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "pay_level" varchar(50);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10, 4);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "annual_salary" numeric(12, 2);

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "ordinary_hours_per_week" numeric(5, 2) DEFAULT '38';

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "start_date" date NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "probation_end_date" date;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "compliance_status" "compliance_status" DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "ndis_worker" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_employees" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_employees handled above)

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "body" text NOT NULL;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "priority" varchar(50) DEFAULT 'info' NOT NULL;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "target_role" varchar(100);

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "published_at" timestamp;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_ess_announcements" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ess_announcements handled above)

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "preferred_name" varchar(100);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "date_of_birth" date;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "gender" varchar(50);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "address" text;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "tfn_declared" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "tax_residency" varchar(50);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "tax_free_threshold" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "has_help_debt" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "tax_file_number" varchar(9);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "super_fund_name" varchar(255);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "super_fund_abn" varchar(20);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "super_usi" varchar(50);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "super_member_number" varchar(100);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "is_smsf" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "bank_name" varchar(100);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "bank_bsb" varchar(7);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "bank_account_number" varchar(20);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "bank_account_name" varchar(100);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "emergency_name" varchar(200);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "emergency_relation" varchar(100);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "emergency_phone" varchar(20);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "emergency_phone2" varchar(20);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "hr_notes" text;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_ess_onboarding" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ess_onboarding handled above)

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "label" varchar(255) NOT NULL;

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "url" varchar(1000) NOT NULL;

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "icon" varchar(50);

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;

ALTER TABLE "hrms_ess_quick_links" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ess_quick_links handled above)

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "category" varchar(100) NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "amount" numeric(15, 2) NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'AUD';

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "expense_date" date NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "receipt_url" varchar(1000);

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp DEFAULT now();

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "review_notes" text;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_expense_claims" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_expense_claims handled above)

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "lodged_by" uuid;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "subject_id" uuid;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "risk_rating" varchar(20);

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'new' NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "assigned_to" uuid;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "outcome" text;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_grievances" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_grievances handled above)

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "department_id" uuid;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "position_id" uuid;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "planned_count" integer NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "current_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "vacancy_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "target_date" date;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_headcount_plan" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_headcount_plan handled above)

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "position_id" uuid;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "requested_by" uuid;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "approved_by" uuid;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;

ALTER TABLE "hrms_job_requisitions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_job_requisitions handled above)

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "leave_type" "leave_type" NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "start_date" date NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "end_date" date NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "total_days" integer NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "reason" text;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "status" "leave_status" DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "review_note" text;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_leave_requests" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_leave_requests handled above)

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "audit_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "priority" varchar(50) DEFAULT 'medium' NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "due_date" date;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_ndis_audit_actions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ndis_audit_actions handled above)

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "audit_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "standard" varchar(255) NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "outcome_group" varchar(100);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'scheduled' NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "result" varchar(50);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "risk_rating" varchar(50);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "scheduled_date" date NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "completed_date" date;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "next_review_date" date;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "auditor_name" varchar(255);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "auditor_org" varchar(255);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "finding_summary" text;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "corrective_actions" text;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "evidence_url" varchar(1000);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_ndis_audits" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ndis_audits handled above)

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "incident_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "action_type" varchar(100) DEFAULT 'corrective';

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "priority" varchar(50) DEFAULT 'medium' NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "due_date" date;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_ndis_incident_actions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ndis_incident_actions handled above)

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "incident_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "incident_category" varchar(100);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "is_reportable" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "severity" varchar(50) DEFAULT 'medium' NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "participant_id" uuid;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "participant_name" varchar(255);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "worker_name" varchar(255);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "worker_role" varchar(100);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "witness_names" text;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "location" varchar(500);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "incident_date" timestamp NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "discovered_date" timestamp;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "reported_internally" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "internal_report_date" date;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "commission_notified" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "commission_notify_date" date;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "commission_ref_number" varchar(100);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "police_notified" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "police_report_number" varchar(100);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "immediate_actions" text;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "root_cause" text;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "outcome_description" text;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "evidence_url" varchar(1000);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_ndis_incidents" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_ndis_incidents handled above)

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "body" text;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "link" varchar(500);

ALTER TABLE "hrms_notifications" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_notifications handled above)

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "offer_id" uuid NOT NULL;

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "event" varchar(100) NOT NULL;

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "note" text;

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "performed_by" varchar(255);

ALTER TABLE "hrms_offer_letter_events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_offer_letter_events handled above)

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "content" text NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "file_url" text;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "created_by" text;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_offer_letter_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_offer_letter_templates handled above)

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "candidate_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "candidate_email" varchar(255) NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "position" varchar(255) NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "department" varchar(255);

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "employment_type" varchar(50) DEFAULT 'full_time' NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "start_date" date;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "salary_amount" integer;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "salary_cycle" varchar(20) DEFAULT 'annual' NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "template_content" text;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "pdf_url" text;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "sent_at" timestamp;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "acceptance_token" text;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "recruitment_id" uuid;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "employee_id" uuid;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_offer_letters" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_offer_letters handled above)

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "stage" varchar(50) NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "buddy_id" uuid;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "checklist" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_onboarding_records" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_onboarding_records handled above)

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "plan_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "behaviour_type" varchar(100);

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "triggers" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "early_warnings" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "prevention_strategies" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "de_escalation_strategies" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "response_strategies" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "post_incident_support" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "authorised_by" varchar(255);

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "review_date" date;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_behaviour_plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_behaviour_plans handled above)

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "contact_type" varchar(50) DEFAULT 'emergency' NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "first_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "last_name" varchar(100);

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "relationship" varchar(100);

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "address" text;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_contacts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_contacts handled above)

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "goal_category" varchar(100) DEFAULT 'daily_living' NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'not_started' NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "target_date" date;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "achieved_date" date;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "progress_notes" text;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_goals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_goals handled above)

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "appointment_type" varchar(100) DEFAULT 'gp' NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "provider_name" varchar(255);

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "provider_org" varchar(255);

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "appointment_date" date NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "appointment_time" varchar(10);

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "location" varchar(255);

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "purpose" text;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "outcome" text;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "follow_up_date" date;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "follow_up_notes" text;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'scheduled' NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "requires_transport" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "support_worker_needed" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_health_appointments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_health_appointments handled above)

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "condition_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "condition_type" varchar(100) DEFAULT 'chronic' NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "icd_code" varchar(20);

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "severity" varchar(50) DEFAULT 'moderate' NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "diagnosed_date" date;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "diagnosed_by" varchar(255);

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "management_plan" text;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "alerts" text;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_health_conditions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_health_conditions handled above)

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "incident_date" date NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "incident_time" varchar(10);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "location" varchar(255);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "incident_type" varchar(100) DEFAULT 'general' NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "severity" varchar(50) DEFAULT 'minor' NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "immediate_action" text;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "witnesses" text;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "reported_by" varchar(255);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "reported_to" varchar(255);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "ndis_reportable" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "police_report" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "police_report_number" varchar(100);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "outcome" text;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "follow_up_required" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "follow_up_date" date;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "follow_up_notes" text;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_incidents" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_incidents handled above)

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "medication_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "scheduled_time" timestamp NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "administered_at" timestamp;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "outcome" varchar(50) DEFAULT 'given' NOT NULL;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "administered_by" varchar(255);

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_medication_logs" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_medication_logs handled above)

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "medication_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "generic_name" varchar(255);

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "dosage" varchar(100);

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "form" varchar(50) DEFAULT 'tablet' NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "route" varchar(50) DEFAULT 'oral' NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "frequency" varchar(100);

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "prescribed_by" varchar(255);

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "indication" text;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "instructions" text;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "start_date" date;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "requires_assist" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "refrigerated" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_medications" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_medications handled above)

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "note_type" varchar(50) DEFAULT 'case_note' NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "title" varchar(255);

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "content" text NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "visibility" varchar(50) DEFAULT 'internal' NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_notes" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_notes handled above)

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "practice_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "authorised_by" varchar(255);

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "authorised_date" date;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "regulatory_approval" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "approval_reference" varchar(255);

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "monitoring_frequency" varchar(100);

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "last_review_date" date;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "next_review_date" date;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_restrictive_practices" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_restrictive_practices handled above)

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "participant_id" uuid NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "plan_type" varchar(50) DEFAULT 'initial' NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "plan_start_date" date;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "plan_end_date" date;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "review_date" date;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "total_budget" numeric(12, 2);

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "funded_supports" text;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "coordinator_name" varchar(255);

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "coordinator_org" varchar(255);

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "coordinator_email" varchar(255);

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participant_support_plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participant_support_plans handled above)

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "first_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "last_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "preferred_name" varchar(100);

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "ndis_number" varchar(20);

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "date_of_birth" date;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "address" text;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "support_level" varchar(100);

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "funding_body" varchar(100) DEFAULT 'NDIS';

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "plan_start_date" date;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "plan_end_date" date;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_participants" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_participants handled above)

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "period_start" date NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "period_end" date NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "hours_worked" numeric(8, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10, 4);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "gross_pay" numeric(10, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "payg_withholding" numeric(10, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "medicare_levy" numeric(10, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "super_contribution" numeric(10, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "net_pay" numeric(10, 2);

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "payslip_data" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "exported_to_xero" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "exported_at" timestamp;

ALTER TABLE "hrms_payroll_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_payroll_records handled above)

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "run_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "employee_number" varchar(50);

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "first_name" varchar(100);

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "last_name" varchar(100);

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "employment_type" varchar(50);

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "hours_worked" numeric(8, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10, 4) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "ordinary_pay" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "overtime_pay" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "allowances" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "gross_pay" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "payg_withholding" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "medicare_levy" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "other_deductions" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "super_contribution" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "net_pay" numeric(10, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "leave_accrued" numeric(8, 4) DEFAULT '0';

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_payroll_run_entries" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_payroll_run_entries handled above)

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "period_start" date NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "period_end" date NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "pay_date" date;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "frequency" varchar(50) DEFAULT 'fortnightly' NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "total_gross" numeric(12, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "total_net" numeric(12, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "total_tax" numeric(12, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "total_super" numeric(12, 2) DEFAULT '0';

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "employee_count" integer DEFAULT 0;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "finalised_by" varchar(255);

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "finalised_at" timestamp;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_payroll_runs" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_payroll_runs handled above)

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "review_id" uuid;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "title" varchar(255) NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "category" varchar(100);

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "target_date" date;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "progress" integer DEFAULT 0 NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "self_rating" integer;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "manager_rating" integer;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "manager_note" text;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_performance_goals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_performance_goals handled above)

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "reviewer_id" uuid;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "type" varchar(50) NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'scheduled' NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "scheduled_date" date;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "overall_rating" numeric(3, 1);

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "employee_input" jsonb;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "manager_input" jsonb;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "kpis" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "development_plan" text;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "outcome" varchar(100);

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_performance_reviews" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_performance_reviews handled above)

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "body" text NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "priority" "announcement_priority" DEFAULT 'info' NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "target_tenants" text DEFAULT 'all' NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "created_by" varchar(255) NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_platform_announcements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_platform_announcements handled above)

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "department_id" uuid;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "title" varchar(200) NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "is_participant_facing" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "is_risk_assessed" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "is_key_personnel" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "is_whs_sensitive" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_positions" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

-- (table hrms_positions handled above)

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "promotion_id" uuid NOT NULL;

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "event" varchar(100) NOT NULL;

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "note" text;

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "performed_by" varchar(255);

ALTER TABLE "hrms_promotion_events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_promotion_events handled above)

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "raised_by_id" varchar(255);

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "raised_by_name" varchar(255);

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "current_title" varchar(255);

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "current_salary" integer;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "proposed_title" varchar(255) NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "proposed_salary" integer;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "effective_date" date;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "justification" text NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "review_notes" text;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "implemented_at" timestamp;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_promotion_requests" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_promotion_requests handled above)

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "name" varchar(200) NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "date" date NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "country" varchar(10) DEFAULT 'AU' NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "state" varchar(10);

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "is_national" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_public_holidays" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_public_holidays handled above)

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "recipient_id" uuid NOT NULL;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "nominated_by" uuid;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "reason" text;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "certificate_url" text;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "period" varchar(50);

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_recognitions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_recognitions handled above)

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "referrer_id" uuid NOT NULL;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "referred_employee_id" uuid;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "referred_name" varchar(200);

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "referred_email" varchar(255);

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "bonus_amount" numeric(10, 2);

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "bonus_paid_at" timestamp;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_referrals" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_referrals handled above)

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "template_id" uuid NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "day_of_week" integer NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "start_time" varchar(5) NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "end_time" varchar(5) NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "shift_type" varchar(100) DEFAULT 'standard' NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "location" varchar(255);

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "participant_id" uuid;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "required_staff" integer DEFAULT 1 NOT NULL;

ALTER TABLE "hrms_roster_template_slots" ADD COLUMN IF NOT EXISTS "notes" text;

-- (table hrms_roster_template_slots handled above)

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_roster_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_roster_templates handled above)

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "review_type" varchar(50) DEFAULT 'annual' NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "review_date" date NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "effective_date" date;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "current_salary" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "current_basis" varchar(20) DEFAULT 'annual' NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "proposed_salary" numeric(12, 2);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "proposed_basis" varchar(20);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "increment_amount" numeric(12, 2);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "increment_percent" numeric(5, 2);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "justification" text;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "performance_rating" varchar(50);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "market_data" text;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "submitted_by" varchar(255);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "approved_by" varchar(255);

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "rejection_reason" text;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "hr_notes" text;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_salary_reviews" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_salary_reviews handled above)

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "report_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "filters" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "columns" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "sort_by" varchar(100);

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "sort_dir" varchar(10) DEFAULT 'asc';

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "is_shared" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "last_run_at" timestamp;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_saved_reports" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_saved_reports handled above)

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "check_type" varchar(100) NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "status" "compliance_status" DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "reference_number" varchar(100);

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "issued_date" date;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "document_id" uuid;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "verified_by" uuid;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_screening_records" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_screening_records handled above)

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "separation_id" uuid NOT NULL;

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "event" varchar(100) NOT NULL;

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "note" text;

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "performed_by" varchar(255);

ALTER TABLE "hrms_separation_events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_separation_events handled above)

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "reason" text;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "notice_date" date;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "last_working_day" date;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "exit_interview_at" timestamp;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "exit_interview_notes" text;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "checklist_complete" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "assets_returned" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "system_access_revoked" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_separation_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_separation_records handled above)

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "shift_id" uuid NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "requested_by_id" uuid NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "swap_with_id" uuid;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "reason" text;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(255);

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "review_notes" text;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_shift_swap_requests" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_shift_swap_requests handled above)

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "participant_id" uuid;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "start_time" timestamp NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "end_time" timestamp NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "shift_type" varchar(100) DEFAULT 'standard';

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "location" varchar(200);

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "client_site" varchar(200);

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'draft' NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "published_at" timestamp;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "compliance_passed" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_shifts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_shifts handled above)

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "email" varchar(255) NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "password_hash" text NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_super_admins" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_super_admins handled above)

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "super_fund_id" uuid NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "period_start" date NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "period_end" date NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "due_date" date NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "paid_date" date;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "gross_earnings" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "sg_rate" numeric(5, 4) DEFAULT '0.115' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "sg_amount" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "voluntary_amount" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "total_contribution" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(255);

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_super_contributions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_super_contributions handled above)

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "fund_name" varchar(255) NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "fund_abn" varchar(20);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "usi" varchar(50);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "member_number" varchar(100);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "is_smsf" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "smsf_bank_bsb" varchar(7);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "smsf_bank_account" varchar(20);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "smsf_esa" varchar(255);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'active' NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "effective_from" date;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "effective_to" date;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "source" varchar(50) DEFAULT 'employee' NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "verified_by" varchar(255);

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_super_funds" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_super_funds handled above)

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "supervisor_id" uuid NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "scheduled_date" date NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "conducted_at" timestamp;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "type" varchar(50);

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'scheduled' NOT NULL;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "action_items" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_supervision_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_supervision_records handled above)

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "survey_id" uuid NOT NULL;

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "employee_id" uuid;

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "answers" jsonb NOT NULL;

ALTER TABLE "hrms_survey_responses" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_survey_responses handled above)

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "title" varchar(300) NOT NULL;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "type" varchar(100);

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "questions" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_surveys" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_surveys handled above)

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "module_id" integer NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "module_name" varchar(100) NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_tenant_modules" ADD COLUMN IF NOT EXISTS "updated_by" uuid;

-- (table hrms_tenant_modules handled above)

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "slug" varchar(100) NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "tier" "tenant_tier" DEFAULT 'starter' NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "logo_url" text;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "primary_color" varchar(7);

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}'::jsonb;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_tenants" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_tenants handled above)

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "shift_id" uuid;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "clock_in" timestamp;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "clock_out" timestamp;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "break_minutes" integer DEFAULT 0 NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "hours_worked" numeric(5, 2);

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "approved_by" uuid;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "rejected_reason" text;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending' NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_timesheets" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_timesheets handled above)

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "balance_hours" numeric(8, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "total_accrued" numeric(8, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "total_taken" numeric(8, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_toil_balances" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_toil_balances handled above)

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "entry_type" varchar(20) DEFAULT 'accrual' NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "work_date" date NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "hours" numeric(6, 2) NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "multiplier" numeric(4, 2) DEFAULT '1.0' NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "shift_id" uuid;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "timesheet_id" uuid;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'approved' NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "requested_at" timestamp;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "approved_by" varchar(255);

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "rejected_reason" text;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "created_by" varchar(255);

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_toil_entries" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_toil_entries handled above)

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "employee_id" uuid NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "course_id" uuid NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'enrolled' NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "expiry_date" date;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "certificate_url" text;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "score" numeric(5, 2);

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;

ALTER TABLE "hrms_training_records" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_training_records handled above)

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "email" varchar(255) NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "password_hash" text NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'employee' NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "totp_secret" text;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "password_reset_token" text;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "password_reset_expiry" timestamp;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "hrms_users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_users handled above)

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "reported_by" uuid NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "employee_id" uuid;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "type" varchar(100) NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "severity" varchar(50);

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "location" varchar(200);

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "occurred_at" timestamp NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'open' NOT NULL;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "corrective_actions" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;

ALTER TABLE "hrms_whs_incidents" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- (table hrms_whs_incidents handled above)

DO $$ BEGIN
  ALTER TABLE "hrms_applications" ADD CONSTRAINT "hrms_applications_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_applications" ADD CONSTRAINT "hrms_applications_requisition_id_hrms_job_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."hrms_job_requisitions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_applications" ADD CONSTRAINT "hrms_applications_candidate_id_hrms_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."hrms_candidates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_asset_assignments" ADD CONSTRAINT "hrms_asset_assignments_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_asset_assignments" ADD CONSTRAINT "hrms_asset_assignments_asset_id_hrms_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."hrms_assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_asset_assignments" ADD CONSTRAINT "hrms_asset_assignments_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_assets" ADD CONSTRAINT "hrms_assets_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_audit_logs" ADD CONSTRAINT "hrms_audit_logs_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_candidates" ADD CONSTRAINT "hrms_candidates_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_competencies" ADD CONSTRAINT "hrms_competencies_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_competency_assessments" ADD CONSTRAINT "hrms_competency_assessments_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_competency_assessments" ADD CONSTRAINT "hrms_competency_assessments_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_competency_assessments" ADD CONSTRAINT "hrms_competency_assessments_competency_id_hrms_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."hrms_competencies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_competency_assessments" ADD CONSTRAINT "hrms_competency_assessments_assessor_id_hrms_employees_id_fk" FOREIGN KEY ("assessor_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_compliance_lock_exceptions" ADD CONSTRAINT "hrms_compliance_lock_exceptions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_compliance_lock_exceptions" ADD CONSTRAINT "hrms_compliance_lock_exceptions_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_compliance_tracking" ADD CONSTRAINT "hrms_compliance_tracking_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_compliance_tracking" ADD CONSTRAINT "hrms_compliance_tracking_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_contracts" ADD CONSTRAINT "hrms_contracts_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_contracts" ADD CONSTRAINT "hrms_contracts_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_courses" ADD CONSTRAINT "hrms_courses_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_crm_accounts" ADD CONSTRAINT "hrms_crm_accounts_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_crm_activities" ADD CONSTRAINT "hrms_crm_activities_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_crm_contacts" ADD CONSTRAINT "hrms_crm_contacts_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_crm_deals" ADD CONSTRAINT "hrms_crm_deals_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_crm_leads" ADD CONSTRAINT "hrms_crm_leads_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_departments" ADD CONSTRAINT "hrms_departments_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_diversity_data" ADD CONSTRAINT "hrms_diversity_data_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_diversity_data" ADD CONSTRAINT "hrms_diversity_data_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_documents" ADD CONSTRAINT "hrms_documents_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_documents" ADD CONSTRAINT "hrms_documents_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_emergency_contacts" ADD CONSTRAINT "hrms_emergency_contacts_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_availability" ADD CONSTRAINT "hrms_employee_availability_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_availability" ADD CONSTRAINT "hrms_employee_availability_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_benefits" ADD CONSTRAINT "hrms_employee_benefits_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_benefits" ADD CONSTRAINT "hrms_employee_benefits_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_experience" ADD CONSTRAINT "hrms_employee_experience_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_notes" ADD CONSTRAINT "hrms_employee_notes_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_notes" ADD CONSTRAINT "hrms_employee_notes_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employee_notes" ADD CONSTRAINT "hrms_employee_notes_author_id_hrms_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."hrms_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_user_id_hrms_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hrms_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_manager_id_hrms_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ess_onboarding" ADD CONSTRAINT "hrms_ess_onboarding_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ess_onboarding" ADD CONSTRAINT "hrms_ess_onboarding_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_grievances" ADD CONSTRAINT "hrms_grievances_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_grievances" ADD CONSTRAINT "hrms_grievances_lodged_by_hrms_employees_id_fk" FOREIGN KEY ("lodged_by") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_grievances" ADD CONSTRAINT "hrms_grievances_subject_id_hrms_employees_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_headcount_plan" ADD CONSTRAINT "hrms_headcount_plan_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_headcount_plan" ADD CONSTRAINT "hrms_headcount_plan_department_id_hrms_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."hrms_departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_headcount_plan" ADD CONSTRAINT "hrms_headcount_plan_position_id_hrms_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."hrms_positions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_job_requisitions" ADD CONSTRAINT "hrms_job_requisitions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_job_requisitions" ADD CONSTRAINT "hrms_job_requisitions_position_id_hrms_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."hrms_positions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_leave_requests" ADD CONSTRAINT "hrms_leave_requests_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_leave_requests" ADD CONSTRAINT "hrms_leave_requests_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_audit_actions" ADD CONSTRAINT "hrms_ndis_audit_actions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_audit_actions" ADD CONSTRAINT "hrms_ndis_audit_actions_audit_id_hrms_ndis_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."hrms_ndis_audits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_audits" ADD CONSTRAINT "hrms_ndis_audits_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_incident_actions" ADD CONSTRAINT "hrms_ndis_incident_actions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_incident_actions" ADD CONSTRAINT "hrms_ndis_incident_actions_incident_id_hrms_ndis_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."hrms_ndis_incidents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_incidents" ADD CONSTRAINT "hrms_ndis_incidents_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_ndis_incidents" ADD CONSTRAINT "hrms_ndis_incidents_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_notifications" ADD CONSTRAINT "hrms_notifications_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_notifications" ADD CONSTRAINT "hrms_notifications_user_id_hrms_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hrms_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_offer_letter_events" ADD CONSTRAINT "hrms_offer_letter_events_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_offer_letter_events" ADD CONSTRAINT "hrms_offer_letter_events_offer_id_hrms_offer_letters_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."hrms_offer_letters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_offer_letter_templates" ADD CONSTRAINT "hrms_offer_letter_templates_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_offer_letters" ADD CONSTRAINT "hrms_offer_letters_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_offer_letters" ADD CONSTRAINT "hrms_offer_letters_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_onboarding_records" ADD CONSTRAINT "hrms_onboarding_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_onboarding_records" ADD CONSTRAINT "hrms_onboarding_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_onboarding_records" ADD CONSTRAINT "hrms_onboarding_records_buddy_id_hrms_employees_id_fk" FOREIGN KEY ("buddy_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_behaviour_plans" ADD CONSTRAINT "hrms_participant_behaviour_plans_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_behaviour_plans" ADD CONSTRAINT "hrms_participant_behaviour_plans_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_contacts" ADD CONSTRAINT "hrms_participant_contacts_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_contacts" ADD CONSTRAINT "hrms_participant_contacts_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_goals" ADD CONSTRAINT "hrms_participant_goals_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_goals" ADD CONSTRAINT "hrms_participant_goals_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_health_appointments" ADD CONSTRAINT "hrms_participant_health_appointments_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_health_appointments" ADD CONSTRAINT "hrms_participant_health_appointments_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_health_conditions" ADD CONSTRAINT "hrms_participant_health_conditions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_health_conditions" ADD CONSTRAINT "hrms_participant_health_conditions_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_incidents" ADD CONSTRAINT "hrms_participant_incidents_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_incidents" ADD CONSTRAINT "hrms_participant_incidents_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_medication_logs" ADD CONSTRAINT "hrms_participant_medication_logs_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_medication_logs" ADD CONSTRAINT "hrms_participant_medication_logs_medication_id_hrms_participant_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."hrms_participant_medications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_medication_logs" ADD CONSTRAINT "hrms_participant_medication_logs_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_medications" ADD CONSTRAINT "hrms_participant_medications_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_medications" ADD CONSTRAINT "hrms_participant_medications_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_notes" ADD CONSTRAINT "hrms_participant_notes_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_notes" ADD CONSTRAINT "hrms_participant_notes_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_restrictive_practices" ADD CONSTRAINT "hrms_participant_restrictive_practices_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_restrictive_practices" ADD CONSTRAINT "hrms_participant_restrictive_practices_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_support_plans" ADD CONSTRAINT "hrms_participant_support_plans_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participant_support_plans" ADD CONSTRAINT "hrms_participant_support_plans_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_participants" ADD CONSTRAINT "hrms_participants_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_payroll_records" ADD CONSTRAINT "hrms_payroll_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_payroll_records" ADD CONSTRAINT "hrms_payroll_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_payroll_run_entries" ADD CONSTRAINT "hrms_payroll_run_entries_run_id_hrms_payroll_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."hrms_payroll_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_goals" ADD CONSTRAINT "hrms_performance_goals_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_goals" ADD CONSTRAINT "hrms_performance_goals_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_goals" ADD CONSTRAINT "hrms_performance_goals_review_id_hrms_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."hrms_performance_reviews"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_reviewer_id_hrms_employees_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_positions" ADD CONSTRAINT "hrms_positions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_positions" ADD CONSTRAINT "hrms_positions_department_id_hrms_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."hrms_departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_promotion_events" ADD CONSTRAINT "hrms_promotion_events_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_promotion_events" ADD CONSTRAINT "hrms_promotion_events_promotion_id_hrms_promotion_requests_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."hrms_promotion_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_promotion_requests" ADD CONSTRAINT "hrms_promotion_requests_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_promotion_requests" ADD CONSTRAINT "hrms_promotion_requests_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_public_holidays" ADD CONSTRAINT "hrms_public_holidays_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_recognitions" ADD CONSTRAINT "hrms_recognitions_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_recognitions" ADD CONSTRAINT "hrms_recognitions_recipient_id_hrms_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_recognitions" ADD CONSTRAINT "hrms_recognitions_nominated_by_hrms_employees_id_fk" FOREIGN KEY ("nominated_by") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_referrals" ADD CONSTRAINT "hrms_referrals_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_referrals" ADD CONSTRAINT "hrms_referrals_referrer_id_hrms_employees_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_referrals" ADD CONSTRAINT "hrms_referrals_referred_employee_id_hrms_employees_id_fk" FOREIGN KEY ("referred_employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_roster_template_slots" ADD CONSTRAINT "hrms_roster_template_slots_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_roster_template_slots" ADD CONSTRAINT "hrms_roster_template_slots_template_id_hrms_roster_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."hrms_roster_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_roster_templates" ADD CONSTRAINT "hrms_roster_templates_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_screening_records" ADD CONSTRAINT "hrms_screening_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_screening_records" ADD CONSTRAINT "hrms_screening_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_screening_records" ADD CONSTRAINT "hrms_screening_records_document_id_hrms_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."hrms_documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_separation_events" ADD CONSTRAINT "hrms_separation_events_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_separation_events" ADD CONSTRAINT "hrms_separation_events_separation_id_hrms_separation_records_id_fk" FOREIGN KEY ("separation_id") REFERENCES "public"."hrms_separation_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_separation_records" ADD CONSTRAINT "hrms_separation_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_separation_records" ADD CONSTRAINT "hrms_separation_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shift_swap_requests" ADD CONSTRAINT "hrms_shift_swap_requests_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shift_swap_requests" ADD CONSTRAINT "hrms_shift_swap_requests_shift_id_hrms_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."hrms_shifts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shift_swap_requests" ADD CONSTRAINT "hrms_shift_swap_requests_requested_by_id_hrms_employees_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."hrms_employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shift_swap_requests" ADD CONSTRAINT "hrms_shift_swap_requests_swap_with_id_hrms_employees_id_fk" FOREIGN KEY ("swap_with_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shifts" ADD CONSTRAINT "hrms_shifts_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shifts" ADD CONSTRAINT "hrms_shifts_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_shifts" ADD CONSTRAINT "hrms_shifts_participant_id_hrms_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."hrms_participants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_supervision_records" ADD CONSTRAINT "hrms_supervision_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_supervision_records" ADD CONSTRAINT "hrms_supervision_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_supervision_records" ADD CONSTRAINT "hrms_supervision_records_supervisor_id_hrms_employees_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_survey_responses" ADD CONSTRAINT "hrms_survey_responses_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_survey_responses" ADD CONSTRAINT "hrms_survey_responses_survey_id_hrms_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."hrms_surveys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_survey_responses" ADD CONSTRAINT "hrms_survey_responses_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_surveys" ADD CONSTRAINT "hrms_surveys_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_tenant_modules" ADD CONSTRAINT "hrms_tenant_modules_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_timesheets" ADD CONSTRAINT "hrms_timesheets_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_timesheets" ADD CONSTRAINT "hrms_timesheets_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_timesheets" ADD CONSTRAINT "hrms_timesheets_shift_id_hrms_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."hrms_shifts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_training_records" ADD CONSTRAINT "hrms_training_records_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_training_records" ADD CONSTRAINT "hrms_training_records_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_training_records" ADD CONSTRAINT "hrms_training_records_course_id_hrms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."hrms_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_users" ADD CONSTRAINT "hrms_users_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_whs_incidents" ADD CONSTRAINT "hrms_whs_incidents_tenant_id_hrms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."hrms_tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_whs_incidents" ADD CONSTRAINT "hrms_whs_incidents_reported_by_hrms_employees_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "hrms_whs_incidents" ADD CONSTRAINT "hrms_whs_incidents_employee_id_hrms_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrms_employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "audit_tenant_idx" ON "hrms_audit_logs" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "hrms_audit_logs" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "crm_accounts_tenant_idx" ON "hrms_crm_accounts" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "crm_accounts_name_idx" ON "hrms_crm_accounts" USING btree ("name");

CREATE INDEX IF NOT EXISTS "crm_activities_tenant_idx" ON "hrms_crm_activities" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "crm_activities_related_idx" ON "hrms_crm_activities" USING btree ("related_type","related_id");

CREATE INDEX IF NOT EXISTS "crm_activities_assigned_idx" ON "hrms_crm_activities" USING btree ("assigned_to");

CREATE INDEX IF NOT EXISTS "crm_contacts_tenant_idx" ON "hrms_crm_contacts" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "crm_contacts_account_idx" ON "hrms_crm_contacts" USING btree ("account_id");

CREATE INDEX IF NOT EXISTS "crm_deals_tenant_idx" ON "hrms_crm_deals" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "crm_deals_stage_idx" ON "hrms_crm_deals" USING btree ("stage");

CREATE INDEX IF NOT EXISTS "crm_deals_account_idx" ON "hrms_crm_deals" USING btree ("account_id");

CREATE INDEX IF NOT EXISTS "crm_leads_tenant_idx" ON "hrms_crm_leads" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "hrms_crm_leads" USING btree ("status");

CREATE INDEX IF NOT EXISTS "crm_leads_assigned_idx" ON "hrms_crm_leads" USING btree ("assigned_to");

CREATE UNIQUE INDEX IF NOT EXISTS "diversity_employee_unique" ON "hrms_diversity_data" USING btree ("tenant_id","employee_id");

CREATE INDEX IF NOT EXISTS "docs_tenant_idx" ON "hrms_documents" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "docs_employee_idx" ON "hrms_documents" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "availability_tenant_idx" ON "hrms_employee_availability" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "availability_emp_idx" ON "hrms_employee_availability" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "employee_experience_tenant_idx" ON "hrms_employee_experience" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "employee_experience_employee_idx" ON "hrms_employee_experience" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "employee_notes_tenant_idx" ON "hrms_employee_notes" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "employee_notes_employee_idx" ON "hrms_employee_notes" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "employees_tenant_idx" ON "hrms_employees" USING btree ("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "employees_number_tenant" ON "hrms_employees" USING btree ("tenant_id","employee_number");

CREATE INDEX IF NOT EXISTS "ess_announcements_tenant_idx" ON "hrms_ess_announcements" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ess_onboarding_tenant_idx" ON "hrms_ess_onboarding" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ess_onboarding_employee_idx" ON "hrms_ess_onboarding" USING btree ("employee_id");

CREATE UNIQUE INDEX IF NOT EXISTS "hrms_ess_onboarding_unique" ON "hrms_ess_onboarding" USING btree ("tenant_id","employee_id");

CREATE INDEX IF NOT EXISTS "ess_quick_links_tenant_idx" ON "hrms_ess_quick_links" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "expense_claims_tenant_idx" ON "hrms_expense_claims" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "expense_claims_employee_idx" ON "hrms_expense_claims" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "expense_claims_status_idx" ON "hrms_expense_claims" USING btree ("status");

CREATE INDEX IF NOT EXISTS "leave_tenant_idx" ON "hrms_leave_requests" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "leave_employee_idx" ON "hrms_leave_requests" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "leave_status_idx" ON "hrms_leave_requests" USING btree ("status");

CREATE INDEX IF NOT EXISTS "leave_date_idx" ON "hrms_leave_requests" USING btree ("start_date");

CREATE INDEX IF NOT EXISTS "ndis_audit_actions_tenant_idx" ON "hrms_ndis_audit_actions" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ndis_audit_actions_audit_idx" ON "hrms_ndis_audit_actions" USING btree ("audit_id");

CREATE INDEX IF NOT EXISTS "ndis_audits_tenant_idx" ON "hrms_ndis_audits" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ndis_audits_status_idx" ON "hrms_ndis_audits" USING btree ("status");

CREATE INDEX IF NOT EXISTS "ndis_audits_date_idx" ON "hrms_ndis_audits" USING btree ("scheduled_date");

CREATE INDEX IF NOT EXISTS "ndis_incident_actions_tenant_idx" ON "hrms_ndis_incident_actions" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ndis_incident_actions_incident_idx" ON "hrms_ndis_incident_actions" USING btree ("incident_id");

CREATE INDEX IF NOT EXISTS "ndis_incidents_tenant_idx" ON "hrms_ndis_incidents" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ndis_incidents_status_idx" ON "hrms_ndis_incidents" USING btree ("status");

CREATE INDEX IF NOT EXISTS "ndis_incidents_date_idx" ON "hrms_ndis_incidents" USING btree ("incident_date");

CREATE INDEX IF NOT EXISTS "ndis_incidents_participant_idx" ON "hrms_ndis_incidents" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "hrms_notifications" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "offer_events_offer_idx" ON "hrms_offer_letter_events" USING btree ("offer_id");

CREATE INDEX IF NOT EXISTS "offer_tmpl_tenant_idx" ON "hrms_offer_letter_templates" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "offer_letters_tenant_idx" ON "hrms_offer_letters" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "offer_letters_status_idx" ON "hrms_offer_letters" USING btree ("status");

CREATE INDEX IF NOT EXISTS "offer_letters_email_idx" ON "hrms_offer_letters" USING btree ("candidate_email");

CREATE INDEX IF NOT EXISTS "behaviour_plans_tenant_idx" ON "hrms_participant_behaviour_plans" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "behaviour_plans_participant_idx" ON "hrms_participant_behaviour_plans" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_contacts_tenant_idx" ON "hrms_participant_contacts" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_contacts_participant_idx" ON "hrms_participant_contacts" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_goals_tenant_idx" ON "hrms_participant_goals" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_goals_participant_idx" ON "hrms_participant_goals" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "health_appointments_tenant_idx" ON "hrms_participant_health_appointments" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "health_appointments_participant_idx" ON "hrms_participant_health_appointments" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "health_conditions_tenant_idx" ON "hrms_participant_health_conditions" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "health_conditions_participant_idx" ON "hrms_participant_health_conditions" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_incidents_tenant_idx" ON "hrms_participant_incidents" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_incidents_participant_idx" ON "hrms_participant_incidents" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "medication_logs_tenant_idx" ON "hrms_participant_medication_logs" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "medication_logs_medication_idx" ON "hrms_participant_medication_logs" USING btree ("medication_id");

CREATE INDEX IF NOT EXISTS "medication_logs_participant_idx" ON "hrms_participant_medication_logs" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_medications_tenant_idx" ON "hrms_participant_medications" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_medications_participant_idx" ON "hrms_participant_medications" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_notes_tenant_idx" ON "hrms_participant_notes" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_notes_participant_idx" ON "hrms_participant_notes" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "restrictive_practices_tenant_idx" ON "hrms_participant_restrictive_practices" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "restrictive_practices_participant_idx" ON "hrms_participant_restrictive_practices" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participant_support_plans_tenant_idx" ON "hrms_participant_support_plans" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "participant_support_plans_participant_idx" ON "hrms_participant_support_plans" USING btree ("participant_id");

CREATE INDEX IF NOT EXISTS "participants_tenant_idx" ON "hrms_participants" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "payroll_run_entries_tenant_idx" ON "hrms_payroll_run_entries" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "payroll_run_entries_run_idx" ON "hrms_payroll_run_entries" USING btree ("run_id");

CREATE INDEX IF NOT EXISTS "payroll_runs_tenant_idx" ON "hrms_payroll_runs" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "payroll_runs_status_idx" ON "hrms_payroll_runs" USING btree ("status");

CREATE INDEX IF NOT EXISTS "perf_goals_tenant_idx" ON "hrms_performance_goals" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "perf_goals_employee_idx" ON "hrms_performance_goals" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "perf_goals_review_idx" ON "hrms_performance_goals" USING btree ("review_id");

CREATE INDEX IF NOT EXISTS "announcements_active_idx" ON "hrms_platform_announcements" USING btree ("is_active");

CREATE INDEX IF NOT EXISTS "announcements_created_idx" ON "hrms_platform_announcements" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "promotion_events_promo_idx" ON "hrms_promotion_events" USING btree ("promotion_id");

CREATE INDEX IF NOT EXISTS "promotions_tenant_idx" ON "hrms_promotion_requests" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "promotions_employee_idx" ON "hrms_promotion_requests" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "promotions_status_idx" ON "hrms_promotion_requests" USING btree ("status");

CREATE INDEX IF NOT EXISTS "ph_tenant_idx" ON "hrms_public_holidays" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "ph_date_idx" ON "hrms_public_holidays" USING btree ("date");

CREATE UNIQUE INDEX IF NOT EXISTS "ph_unique" ON "hrms_public_holidays" USING btree ("tenant_id","date","name");

CREATE INDEX IF NOT EXISTS "roster_template_slots_template_idx" ON "hrms_roster_template_slots" USING btree ("template_id");

CREATE INDEX IF NOT EXISTS "roster_templates_tenant_idx" ON "hrms_roster_templates" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "salary_reviews_tenant_idx" ON "hrms_salary_reviews" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "salary_reviews_employee_idx" ON "hrms_salary_reviews" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "salary_reviews_status_idx" ON "hrms_salary_reviews" USING btree ("status");

CREATE INDEX IF NOT EXISTS "saved_reports_tenant_idx" ON "hrms_saved_reports" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "separation_events_sep_idx" ON "hrms_separation_events" USING btree ("separation_id");

CREATE INDEX IF NOT EXISTS "shift_swap_requests_tenant_idx" ON "hrms_shift_swap_requests" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "shift_swap_requests_shift_idx" ON "hrms_shift_swap_requests" USING btree ("shift_id");

CREATE INDEX IF NOT EXISTS "shifts_tenant_idx" ON "hrms_shifts" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "shifts_employee_idx" ON "hrms_shifts" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "shifts_time_idx" ON "hrms_shifts" USING btree ("start_time","end_time");

CREATE INDEX IF NOT EXISTS "super_contributions_tenant_idx" ON "hrms_super_contributions" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "super_contributions_employee_idx" ON "hrms_super_contributions" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "super_funds_tenant_idx" ON "hrms_super_funds" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "super_funds_employee_idx" ON "hrms_super_funds" USING btree ("employee_id");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_module_unique" ON "hrms_tenant_modules" USING btree ("tenant_id","module_id");

CREATE INDEX IF NOT EXISTS "timesheets_tenant_idx" ON "hrms_timesheets" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "timesheets_employee_idx" ON "hrms_timesheets" USING btree ("employee_id");

CREATE UNIQUE INDEX IF NOT EXISTS "toil_balances_unique" ON "hrms_toil_balances" USING btree ("tenant_id","employee_id");

CREATE INDEX IF NOT EXISTS "toil_balances_tenant_idx" ON "hrms_toil_balances" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "toil_entries_tenant_idx" ON "hrms_toil_entries" USING btree ("tenant_id");

CREATE INDEX IF NOT EXISTS "toil_entries_employee_idx" ON "hrms_toil_entries" USING btree ("employee_id");

CREATE INDEX IF NOT EXISTS "toil_entries_date_idx" ON "hrms_toil_entries" USING btree ("work_date");

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_tenant" ON "hrms_users" USING btree ("tenant_id","email");
