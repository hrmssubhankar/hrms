-- CRM Tables Migration
-- Run this in your Neon/Railway PostgreSQL console to add CRM tables

CREATE TABLE IF NOT EXISTS "crm_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(100),
	"website" varchar(500),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"abn" varchar(20),
	"revenue" numeric(15, 2),
	"employees" integer,
	"type" varchar(50) DEFAULT 'prospect',
	"status" varchar(50) DEFAULT 'active',
	"assigned_to" varchar(255),
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"notes" text,
	"due_date" timestamp,
	"completed_at" timestamp,
	"is_done" boolean DEFAULT false,
	"related_type" varchar(50),
	"related_id" uuid,
	"assigned_to" varchar(255),
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_id" uuid,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"mobile" varchar(50),
	"job_title" varchar(255),
	"department" varchar(255),
	"is_primary" boolean DEFAULT false,
	"assigned_to" varchar(255),
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "crm_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_id" uuid,
	"contact_id" uuid,
	"title" varchar(255) NOT NULL,
	"value" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'AUD',
	"stage" varchar(50) DEFAULT 'prospecting' NOT NULL,
	"probability" integer DEFAULT 0,
	"close_date" date,
	"source" varchar(100),
	"assigned_to" varchar(255),
	"notes" text,
	"lost_reason" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "crm_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"job_title" varchar(255),
	"source" varchar(100),
	"status" varchar(50) DEFAULT 'new' NOT NULL,
	"stage" varchar(50) DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0,
	"assigned_to" varchar(255),
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"converted_at" timestamp,
	"converted_to_id" uuid,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "crm_leads_tenant_idx" ON "crm_leads" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads" ("status");
CREATE INDEX IF NOT EXISTS "crm_leads_assigned_idx" ON "crm_leads" ("assigned_to");
CREATE INDEX IF NOT EXISTS "crm_contacts_tenant_idx" ON "crm_contacts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_contacts_account_idx" ON "crm_contacts" ("account_id");
CREATE INDEX IF NOT EXISTS "crm_accounts_tenant_idx" ON "crm_accounts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_accounts_name_idx" ON "crm_accounts" ("name");
CREATE INDEX IF NOT EXISTS "crm_deals_tenant_idx" ON "crm_deals" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_deals_stage_idx" ON "crm_deals" ("stage");
CREATE INDEX IF NOT EXISTS "crm_deals_account_idx" ON "crm_deals" ("account_id");
CREATE INDEX IF NOT EXISTS "crm_activities_tenant_idx" ON "crm_activities" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_activities_related_idx" ON "crm_activities" ("related_type", "related_id");
CREATE INDEX IF NOT EXISTS "crm_activities_assigned_idx" ON "crm_activities" ("assigned_to");
