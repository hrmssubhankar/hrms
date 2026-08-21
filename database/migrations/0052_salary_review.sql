-- Migration 0052: Salary Review & Increment Workflow
-- Manages salary review cycles, increment proposals and approval workflow.

CREATE TABLE IF NOT EXISTS hrms_salary_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  employee_id         uuid NOT NULL,

  -- Review metadata
  review_type         varchar(50)  NOT NULL DEFAULT 'annual',
  -- annual | probation | merit | market | promotion | out_of_cycle
  review_date         date NOT NULL,
  effective_date      date,

  -- Current vs proposed
  current_salary      numeric(12,2) NOT NULL DEFAULT 0,
  current_basis       varchar(20)  NOT NULL DEFAULT 'annual',
  -- annual | hourly | daily
  proposed_salary     numeric(12,2),
  proposed_basis      varchar(20),
  increment_amount    numeric(12,2),
  increment_percent   numeric(5,2),

  -- Justification
  justification       text,
  performance_rating  varchar(50),
  -- outstanding | exceeds | meets | below | unsatisfactory
  market_data         text,

  -- Workflow
  status              varchar(50)  NOT NULL DEFAULT 'draft',
  -- draft | submitted | under_review | approved | rejected | implemented
  submitted_by        varchar(255),
  submitted_at        timestamp,
  reviewed_by         varchar(255),
  reviewed_at         timestamp,
  approved_by         varchar(255),
  approved_at         timestamp,
  rejection_reason    text,
  hr_notes            text,

  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hrms_salary_reviews_tenant_idx   ON hrms_salary_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS hrms_salary_reviews_employee_idx ON hrms_salary_reviews(employee_id);
CREATE INDEX IF NOT EXISTS hrms_salary_reviews_status_idx   ON hrms_salary_reviews(status);
