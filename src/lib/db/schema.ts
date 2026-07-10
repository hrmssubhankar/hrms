/**
 * Drizzle ORM schema — reflects the full PostgreSQL schema.
 * Tables are organized by HRMS module.
 */
import {
  pgTable, uuid, varchar, text, boolean, integer, decimal,
  timestamp, date, jsonb, pgEnum, index, uniqueIndex,
} from 'drizzle-orm/pg-core'

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const tenantTierEnum = pgEnum('tenant_tier', ['starter', 'professional', 'enterprise'])
export const userRoleEnum   = pgEnum('user_role', [
  'super_admin', 'director', 'hr_officer', 'compliance_manager',
  'operations_manager', 'team_leader', 'payroll_officer',
  'employee', 'contractor', 'auditor', 'it_admin',
])
export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time', 'part_time', 'casual', 'contractor', 'volunteer',
])
export const complianceStatusEnum = pgEnum('compliance_status', ['green', 'amber', 'red', 'pending'])
export const documentStatusEnum   = pgEnum('document_status', ['active', 'expired', 'archived', 'pending_review'])

// ──────────────────────────────────────────────
// Module 01 — Tenants (Multi-Tenant Core)
// ──────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 255 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  tier:        tenantTierEnum('tier').notNull().default('starter'),
  logoUrl:     text('logo_url'),
  primaryColor:varchar('primary_color', { length: 7 }),
  isActive:    boolean('is_active').notNull().default(true),
  settings:    jsonb('settings').default({}),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

export const tenantModules = pgTable('tenant_modules', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId:  integer('module_id').notNull(),
  moduleName:varchar('module_name', { length: 100 }).notNull(),
  isEnabled: boolean('is_enabled').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
}, (t) => ({
  uniqueIdx: uniqueIndex('tenant_module_unique').on(t.tenantId, t.moduleId),
}))

// ──────────────────────────────────────────────
// Module 03 — Users & RBAC
// ──────────────────────────────────────────────

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:          varchar('email', { length: 255 }).notNull(),
  passwordHash:   text('password_hash').notNull(),
  role:           userRoleEnum('role').notNull().default('employee'),
  isActive:       boolean('is_active').notNull().default(true),
  totpSecret:     text('totp_secret'),
  totpEnabled:    boolean('totp_enabled').notNull().default(false),
  lastLoginAt:    timestamp('last_login_at'),
  passwordChangedAt: timestamp('password_changed_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_tenant').on(t.tenantId, t.email),
}))

// ──────────────────────────────────────────────
// Module 02 — Employee Master Profiles
// ──────────────────────────────────────────────

export const employees = pgTable('employees', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id').references(() => users.id),
  employeeNumber:   varchar('employee_number', { length: 50 }).notNull(),
  firstName:        varchar('first_name', { length: 100 }).notNull(),
  lastName:         varchar('last_name', { length: 100 }).notNull(),
  preferredName:    varchar('preferred_name', { length: 100 }),
  dateOfBirth:      date('date_of_birth'),
  gender:           varchar('gender', { length: 50 }),
  phone:            varchar('phone', { length: 20 }),
  email:            varchar('email', { length: 255 }).notNull(),
  address:          text('address'),
  photoUrl:         text('photo_url'),
  // Employment
  entityName:       varchar('entity_name', { length: 100 }), // Yahweh Care | Yahweh Property Care
  departmentId:     uuid('department_id'),
  positionId:       uuid('position_id'),
  managerId:        uuid('manager_id').references((): any => employees.id),
  employmentType:   employmentTypeEnum('employment_type').notNull(),
  awardClassification: varchar('award_classification', { length: 100 }),
  payLevel:         varchar('pay_level', { length: 50 }),
  startDate:        date('start_date').notNull(),
  probationEndDate: date('probation_end_date'),
  endDate:          date('end_date'),
  isActive:         boolean('is_active').notNull().default(true),
  // Compliance
  complianceStatus: complianceStatusEnum('compliance_status').notNull().default('pending'),
  ndisWorker:       boolean('ndis_worker').notNull().default(false),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  tenantIdx:     index('employees_tenant_idx').on(t.tenantId),
  empNumberIdx:  uniqueIndex('employees_number_tenant').on(t.tenantId, t.employeeNumber),
}))

export const emergencyContacts = pgTable('emergency_contacts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  name:         varchar('name', { length: 200 }).notNull(),
  relationship: varchar('relationship', { length: 100 }),
  phone:        varchar('phone', { length: 20 }),
  email:        varchar('email', { length: 255 }),
  isPrimary:    boolean('is_primary').notNull().default(false),
})

export const departments = pgTable('departments', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  parentId:    uuid('parent_id'),
  isActive:    boolean('is_active').notNull().default(true),
})

export const positions = pgTable('positions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  departmentId:        uuid('department_id').references(() => departments.id),
  title:               varchar('title', { length: 200 }).notNull(),
  description:         text('description'),
  isParticipantFacing: boolean('is_participant_facing').notNull().default(false),
  isRiskAssessed:      boolean('is_risk_assessed').notNull().default(false),
  isKeyPersonnel:      boolean('is_key_personnel').notNull().default(false),
  isWhsSensitive:      boolean('is_whs_sensitive').notNull().default(false),
  isActive:            boolean('is_active').notNull().default(true),
})

// ──────────────────────────────────────────────
// Module 04 — Audit Logging
// ──────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id:         uuid('id').primaryKey().defaultRandom(),
  tenantId:   uuid('tenant_id').notNull().references(() => tenants.id),
  userId:     uuid('user_id'),
  action:     varchar('action', { length: 100 }).notNull(),
  resource:   varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  oldValues:  jsonb('old_values'),
  newValues:  jsonb('new_values'),
  ipAddress:  varchar('ip_address', { length: 45 }),
  userAgent:  text('user_agent'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  tenantIdx:   index('audit_tenant_idx').on(t.tenantId),
  createdIdx:  index('audit_created_idx').on(t.createdAt),
}))

// ──────────────────────────────────────────────
// Module 05 — Document Management
// ──────────────────────────────────────────────

export const documents = pgTable('documents', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  employeeId:   uuid('employee_id').references(() => employees.id),
  category:     varchar('category', { length: 100 }).notNull(),
  title:        varchar('title', { length: 300 }).notNull(),
  blobUrl:      text('blob_url').notNull(),
  fileName:     varchar('file_name', { length: 255 }),
  fileSizeBytes:integer('file_size_bytes'),
  mimeType:     varchar('mime_type', { length: 100 }),
  status:       documentStatusEnum('status').notNull().default('active'),
  expiryDate:   date('expiry_date'),
  uploadedBy:   uuid('uploaded_by'),
  notes:        text('notes'),
  version:      integer('version').notNull().default(1),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  tenantIdx:   index('docs_tenant_idx').on(t.tenantId),
  employeeIdx: index('docs_employee_idx').on(t.employeeId),
}))

// ──────────────────────────────────────────────
// Module 06 — Pre-Employment Screening
// ──────────────────────────────────────────────

export const screeningRecords = pgTable('screening_records', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  employeeId:    uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  checkType:     varchar('check_type', { length: 100 }).notNull(), // police_check, wwcc, ndis_screening, etc.
  status:        complianceStatusEnum('status').notNull().default('pending'),
  referenceNumber: varchar('reference_number', { length: 100 }),
  issuedDate:    date('issued_date'),
  expiryDate:    date('expiry_date'),
  documentId:    uuid('document_id').references(() => documents.id),
  notes:         text('notes'),
  verifiedBy:    uuid('verified_by'),
  verifiedAt:    timestamp('verified_at'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 07 — Compliance Lock
// ──────────────────────────────────────────────

export const complianceLockExceptions = pgTable('compliance_lock_exceptions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:     uuid('employee_id').notNull().references(() => employees.id),
  reason:         text('reason').notNull(),
  expiresAt:      timestamp('expires_at').notNull(),
  approvedBy:     uuid('approved_by').notNull(),
  approvedAt:     timestamp('approved_at').notNull().defaultNow(),
  isActive:       boolean('is_active').notNull().default(true),
})

// ──────────────────────────────────────────────
// Module 08 — Ongoing Compliance Tracking
// ──────────────────────────────────────────────

export const complianceTracking = pgTable('compliance_tracking', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:      uuid('employee_id').notNull().references(() => employees.id),
  itemType:        varchar('item_type', { length: 100 }).notNull(),
  status:          complianceStatusEnum('status').notNull().default('green'),
  dueDate:         date('due_date'),
  lastCheckedAt:   timestamp('last_checked_at'),
  escalatedAt:     timestamp('escalated_at'),
  escalatedTo:     uuid('escalated_to'),
  notes:           text('notes'),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 09 — Onboarding & Induction
// ──────────────────────────────────────────────

export const onboardingRecords = pgTable('onboarding_records', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  stage:        varchar('stage', { length: 50 }).notNull(), // pre_start, day1, week1, weeks2_4, end_probation, fully_active
  status:       varchar('status', { length: 50 }).notNull().default('pending'),
  completedAt:  timestamp('completed_at'),
  buddyId:      uuid('buddy_id').references(() => employees.id),
  notes:        text('notes'),
  checklist:    jsonb('checklist').default([]),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 10 — Training Management & LMS
// ──────────────────────────────────────────────

export const courses = pgTable('courses', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  title:        varchar('title', { length: 300 }).notNull(),
  description:  text('description'),
  category:     varchar('category', { length: 100 }),
  isMandatory:  boolean('is_mandatory').notNull().default(false),
  validityMonths: integer('validity_months'), // null = no expiry
  content:      jsonb('content').default([]),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

export const trainingRecords = pgTable('training_records', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:     uuid('employee_id').notNull().references(() => employees.id),
  courseId:       uuid('course_id').notNull().references(() => courses.id),
  status:         varchar('status', { length: 50 }).notNull().default('enrolled'),
  completedAt:    timestamp('completed_at'),
  expiryDate:     date('expiry_date'),
  certificateUrl: text('certificate_url'),
  score:          decimal('score', { precision: 5, scale: 2 }),
  attempts:       integer('attempts').notNull().default(0),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 11 — Competency Management
// ──────────────────────────────────────────────

export const competencies = pgTable('competencies', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category:    varchar('category', { length: 100 }),
  isActive:    boolean('is_active').notNull().default(true),
})

export const competencyAssessments = pgTable('competency_assessments', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:      uuid('employee_id').notNull().references(() => employees.id),
  competencyId:    uuid('competency_id').notNull().references(() => competencies.id),
  assessorId:      uuid('assessor_id').references(() => employees.id),
  outcome:         varchar('outcome', { length: 50 }), // competent, not_yet_competent
  assessedAt:      timestamp('assessed_at'),
  expiryDate:      date('expiry_date'),
  evidence:        text('evidence'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 12 — Supervision Management
// ──────────────────────────────────────────────

export const supervisionRecords = pgTable('supervision_records', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  supervisorId: uuid('supervisor_id').notNull().references(() => employees.id),
  scheduledDate:date('scheduled_date').notNull(),
  conductedAt:  timestamp('conducted_at'),
  type:         varchar('type', { length: 50 }), // regular, probation, high_risk
  status:       varchar('status', { length: 50 }).notNull().default('scheduled'),
  notes:        text('notes'),
  actionItems:  jsonb('action_items').default([]),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 14 — Recruitment & ATS
// ──────────────────────────────────────────────

export const jobRequisitions = pgTable('job_requisitions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  positionId:     uuid('position_id').references(() => positions.id),
  title:          varchar('title', { length: 300 }).notNull(),
  description:    text('description'),
  status:         varchar('status', { length: 50 }).notNull().default('draft'),
  requestedBy:    uuid('requested_by'),
  approvedBy:     uuid('approved_by'),
  approvedAt:     timestamp('approved_at'),
  closedAt:       timestamp('closed_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
})

export const candidates = pgTable('candidates', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  firstName:    varchar('first_name', { length: 100 }).notNull(),
  lastName:     varchar('last_name', { length: 100 }).notNull(),
  email:        varchar('email', { length: 255 }).notNull(),
  phone:        varchar('phone', { length: 20 }),
  resumeUrl:    text('resume_url'),
  source:       varchar('source', { length: 100 }),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

export const applications = pgTable('applications', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  requisitionId:   uuid('requisition_id').notNull().references(() => jobRequisitions.id),
  candidateId:     uuid('candidate_id').notNull().references(() => candidates.id),
  status:          varchar('status', { length: 50 }).notNull().default('received'),
  // Statuses: received, shortlisted, interviewed, checks, offer, hired, rejected
  interviewScore:  decimal('interview_score', { precision: 5, scale: 2 }),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 15 — Contracting & E-Sign
// ──────────────────────────────────────────────

export const contracts = pgTable('contracts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:     uuid('employee_id').notNull().references(() => employees.id),
  type:           varchar('type', { length: 100 }).notNull(), // employment, casual, contractor
  pdfUrl:         text('pdf_url'),
  signedPdfUrl:   text('signed_pdf_url'),
  status:         varchar('status', { length: 50 }).notNull().default('draft'),
  sentAt:         timestamp('sent_at'),
  signedAt:       timestamp('signed_at'),
  signatureIp:    varchar('signature_ip', { length: 45 }),
  signatureData:  text('signature_data'), // PNG base64
  tfnProvided:    boolean('tfn_provided').notNull().default(false),
  superFund:      varchar('super_fund', { length: 200 }),
  bankBsb:        varchar('bank_bsb', { length: 10 }),
  bankAccount:    varchar('bank_account', { length: 20 }),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 16 — Probation & Performance
// ──────────────────────────────────────────────

export const performanceReviews = pgTable('performance_reviews', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:      uuid('employee_id').notNull().references(() => employees.id),
  reviewerId:      uuid('reviewer_id').references(() => employees.id),
  type:            varchar('type', { length: 50 }).notNull(), // probation_4wk, mid_probation, end_probation, annual, kpi
  status:          varchar('status', { length: 50 }).notNull().default('scheduled'),
  scheduledDate:   date('scheduled_date'),
  completedAt:     timestamp('completed_at'),
  overallRating:   decimal('overall_rating', { precision: 3, scale: 1 }),
  employeeInput:   jsonb('employee_input'),
  managerInput:    jsonb('manager_input'),
  kpis:            jsonb('kpis').default([]),
  developmentPlan: text('development_plan'),
  outcome:         varchar('outcome', { length: 100 }), // confirmed, extended, pip, terminated
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 17 — WHS & Injury Management
// ──────────────────────────────────────────────

export const whsIncidents = pgTable('whs_incidents', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  reportedBy:      uuid('reported_by').notNull().references(() => employees.id),
  employeeId:      uuid('employee_id').references(() => employees.id),
  type:            varchar('type', { length: 100 }).notNull(), // hazard, injury, near_miss, unsafe_condition
  severity:        varchar('severity', { length: 50 }), // low, medium, high, critical
  description:     text('description').notNull(),
  location:        varchar('location', { length: 200 }),
  occurredAt:      timestamp('occurred_at').notNull(),
  status:          varchar('status', { length: 50 }).notNull().default('open'),
  correctiveActions: jsonb('corrective_actions').default([]),
  closedAt:        timestamp('closed_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 18 — Grievance & Investigation
// ──────────────────────────────────────────────

export const grievances = pgTable('grievances', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  lodgedBy:       uuid('lodged_by').references(() => employees.id), // null = anonymous
  subjectId:      uuid('subject_id').references(() => employees.id),
  type:           varchar('type', { length: 100 }).notNull(), // grievance, misconduct, bullying, safety
  isAnonymous:    boolean('is_anonymous').notNull().default(false),
  riskRating:     varchar('risk_rating', { length: 20 }), // low, medium, high, critical
  description:    text('description').notNull(),
  status:         varchar('status', { length: 50 }).notNull().default('new'),
  // Status flow: new → triage → assigned → evidence → response → findings → outcome → closed
  assignedTo:     uuid('assigned_to'),
  outcome:        text('outcome'),
  closedAt:       timestamp('closed_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 19 — Separation & Exit Management
// ──────────────────────────────────────────────

export const separationRecords = pgTable('separation_records', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:       uuid('employee_id').notNull().references(() => employees.id),
  type:             varchar('type', { length: 100 }).notNull(), // resignation, termination, redundancy, contract_end
  reason:           text('reason'),
  noticeDate:       date('notice_date'),
  lastWorkingDay:   date('last_working_day'),
  exitInterviewAt:  timestamp('exit_interview_at'),
  exitInterviewNotes: text('exit_interview_notes'),
  checklistComplete: boolean('checklist_complete').notNull().default(false),
  assetsReturned:   boolean('assets_returned').notNull().default(false),
  systemAccessRevoked: boolean('system_access_revoked').notNull().default(false),
  status:           varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 26 — Assets & Equipment
// ──────────────────────────────────────────────

export const assets = pgTable('assets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  name:         varchar('name', { length: 200 }).notNull(),
  category:     varchar('category', { length: 100 }).notNull(), // uniform, ppe, laptop, keys, etc.
  serialNumber: varchar('serial_number', { length: 100 }),
  status:       varchar('status', { length: 50 }).notNull().default('available'),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

export const assetAssignments = pgTable('asset_assignments', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  assetId:      uuid('asset_id').notNull().references(() => assets.id),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  issuedAt:     timestamp('issued_at').notNull().defaultNow(),
  issuedBy:     uuid('issued_by'),
  returnedAt:   timestamp('returned_at'),
  returnedTo:   uuid('returned_to'),
  condition:    varchar('condition', { length: 50 }),
  notes:        text('notes'),
})

// ──────────────────────────────────────────────
// Module 25 — Employee Voice / Surveys
// ──────────────────────────────────────────────

export const surveys = pgTable('surveys', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  title:       varchar('title', { length: 300 }).notNull(),
  type:        varchar('type', { length: 100 }), // new_starter_30, probation_90, annual, exit
  isAnonymous: boolean('is_anonymous').notNull().default(true),
  questions:   jsonb('questions').default([]),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
})

export const surveyResponses = pgTable('survey_responses', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  surveyId:    uuid('survey_id').notNull().references(() => surveys.id),
  employeeId:  uuid('employee_id').references(() => employees.id), // null if anonymous
  answers:     jsonb('answers').notNull(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 22 — Recognition & Rewards
// ──────────────────────────────────────────────

export const recognitions = pgTable('recognitions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  recipientId:    uuid('recipient_id').notNull().references(() => employees.id),
  nominatedBy:    uuid('nominated_by').references(() => employees.id),
  type:           varchar('type', { length: 100 }).notNull(), // employee_of_quarter, peer, safety_champion, etc.
  reason:         text('reason'),
  certificateUrl: text('certificate_url'),
  period:         varchar('period', { length: 50 }), // e.g. Q1-2026
  isPublic:       boolean('is_public').notNull().default(true),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 23 — Referral Program
// ──────────────────────────────────────────────

export const referrals = pgTable('referrals', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  referrerId:       uuid('referrer_id').notNull().references(() => employees.id),
  referredEmployeeId: uuid('referred_employee_id').references(() => employees.id),
  referredName:     varchar('referred_name', { length: 200 }),
  referredEmail:    varchar('referred_email', { length: 255 }),
  status:           varchar('status', { length: 50 }).notNull().default('pending'),
  bonusAmount:      decimal('bonus_amount', { precision: 10, scale: 2 }),
  bonusPaidAt:      timestamp('bonus_paid_at'),
  notes:            text('notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 27 — Rostering
// ──────────────────────────────────────────────

export const shifts = pgTable('shifts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  startTime:    timestamp('start_time').notNull(),
  endTime:      timestamp('end_time').notNull(),
  location:     varchar('location', { length: 200 }),
  clientSite:   varchar('client_site', { length: 200 }),
  status:       varchar('status', { length: 50 }).notNull().default('scheduled'),
  compliancePassed: boolean('compliance_passed').notNull().default(false),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

export const timesheets = pgTable('timesheets', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:    uuid('employee_id').notNull().references(() => employees.id),
  shiftId:       uuid('shift_id').references(() => shifts.id),
  clockIn:       timestamp('clock_in'),
  clockOut:      timestamp('clock_out'),
  hoursWorked:   decimal('hours_worked', { precision: 5, scale: 2 }),
  approvedBy:    uuid('approved_by'),
  approvedAt:    timestamp('approved_at'),
  status:        varchar('status', { length: 50 }).notNull().default('pending'),
})

// ──────────────────────────────────────────────
// Module 28 — Payroll
// ──────────────────────────────────────────────

export const payrollRecords = pgTable('payroll_records', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:       uuid('employee_id').notNull().references(() => employees.id),
  periodStart:      date('period_start').notNull(),
  periodEnd:        date('period_end').notNull(),
  grossPay:         decimal('gross_pay', { precision: 10, scale: 2 }),
  netPay:           decimal('net_pay', { precision: 10, scale: 2 }),
  status:           varchar('status', { length: 50 }).notNull().default('pending'),
  exportedToXero:   boolean('exported_to_xero').notNull().default(false),
  exportedAt:       timestamp('exported_at'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 13 — Workforce Planning
// ──────────────────────────────────────────────

export const headcountPlan = pgTable('headcount_plan', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  departmentId:   uuid('department_id').references(() => departments.id),
  positionId:     uuid('position_id').references(() => positions.id),
  plannedCount:   integer('planned_count').notNull(),
  currentCount:   integer('current_count').notNull().default(0),
  vacancyCount:   integer('vacancy_count').notNull().default(0),
  targetDate:     date('target_date'),
  status:         varchar('status', { length: 50 }).notNull().default('open'),
  notes:          text('notes'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Module 24 — DEI
// ──────────────────────────────────────────────

export const diversityData = pgTable('diversity_data', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:           uuid('employee_id').notNull().references(() => employees.id),
  gender:               varchar('gender', { length: 50 }),
  indigenousStatus:     boolean('indigenous_status'),
  disabilityStatus:     boolean('disability_status'),
  culturalBackground:   varchar('cultural_background', { length: 100 }),
  adjustmentsRequired:  text('adjustments_required'),
  selfReported:         boolean('self_reported').notNull().default(true),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  empUnique: uniqueIndex('diversity_employee_unique').on(t.tenantId, t.employeeId),
}))

// ──────────────────────────────────────────────
// Module 21 — Employee Experience & Benefits
// ──────────────────────────────────────────────

export const employeeBenefits = pgTable('employee_benefits', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  type:         varchar('type', { length: 100 }).notNull(), // eap, study_support, discount, etc.
  description:  text('description'),
  startDate:    date('start_date'),
  endDate:      date('end_date'),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
})

// ──────────────────────────────────────────────
// Notifications (cross-module)
// ──────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  userId:      uuid('user_id').notNull().references(() => users.id),
  type:        varchar('type', { length: 100 }).notNull(),
  title:       varchar('title', { length: 300 }).notNull(),
  body:        text('body'),
  isRead:      boolean('is_read').notNull().default(false),
  link:        varchar('link', { length: 500 }),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('notifications_user_idx').on(t.userId),
}))

// ──────────────────────────────────────────────
// Platform — Super Admins (no tenant FK)
// ──────────────────────────────────────────────

export const superAdmins = pgTable('super_admins', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name:         varchar('name', { length: 255 }).notNull(),
  isActive:     boolean('is_active').notNull().default(true),
  lastLoginAt:  timestamp('last_login_at'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})
