-- Expense Claims Table Migration
-- Run this in your Neon/Railway PostgreSQL console

CREATE TABLE IF NOT EXISTS "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
	"employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'AUD',
	"expense_date" date NOT NULL,
	"description" text,
	"receipt_url" varchar(1000),
	"status" varchar(50) NOT NULL DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"review_notes" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "expense_claims_tenant_idx"   ON "expense_claims" ("tenant_id");
CREATE INDEX IF NOT EXISTS "expense_claims_employee_idx" ON "expense_claims" ("employee_id");
CREATE INDEX IF NOT EXISTS "expense_claims_status_idx"   ON "expense_claims" ("status");
