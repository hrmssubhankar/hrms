/**
 * RBAC Permission Matrix
 *
 * Defines what each role can do across all HRMS modules.
 * Used by API routes (requirePermission) and UI components (usePermissions).
 */

export type UserRole =
  | 'director'
  | 'hr_officer'
  | 'compliance_manager'
  | 'operations_manager'
  | 'team_leader'
  | 'payroll_officer'
  | 'employee'
  | 'contractor'
  | 'auditor'
  | 'it_admin'

/** Every permission key in the system */
export type Permission =
  // Employees
  | 'employees:read'
  | 'employees:write'
  | 'employees:delete'
  // Roles & Users
  | 'roles:read'
  | 'roles:write'
  // Payroll
  | 'payroll:read'
  | 'payroll:write'
  // Audit Logs
  | 'audit_logs:read'
  // Compliance
  | 'compliance:read'
  | 'compliance:write'
  // Documents
  | 'documents:read'
  | 'documents:write'
  // Onboarding
  | 'onboarding:read'
  | 'onboarding:write'
  // Training
  | 'training:read'
  | 'training:write'
  // Recruitment
  | 'recruitment:read'
  | 'recruitment:write'
  // Contracts
  | 'contracts:read'
  | 'contracts:write'
  // Performance
  | 'performance:read'
  | 'performance:write'
  // WHS (Safety)
  | 'whs:read'
  | 'whs:write'
  // Grievances
  | 'grievances:read'
  | 'grievances:write'
  // Separation
  | 'separation:read'
  | 'separation:write'
  // Supervision
  | 'supervision:read'
  | 'supervision:write'
  // Rostering
  | 'rostering:read'
  | 'rostering:write'
  // Workforce Planning
  | 'workforce_planning:read'
  | 'workforce_planning:write'
  // Analytics & Reporting
  | 'analytics:read'
  // Benefits
  | 'benefits:read'
  | 'benefits:write'
  // Competencies
  | 'competencies:read'
  | 'competencies:write'
  // Assets
  | 'assets:read'
  | 'assets:write'
  // DEI
  | 'dei:read'
  | 'dei:write'
  // Engagement
  | 'engagement:read'
  | 'engagement:write'
  // Recognition
  | 'recognition:read'
  | 'recognition:write'
  // Referrals
  | 'referrals:read'
  | 'referrals:write'
  // Settings (tenant branding / config)
  | 'settings:read'
  | 'settings:write'

/** Permission matrix — every role mapped to its allowed permissions */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  director: [
    // Full access to everything
    'employees:read', 'employees:write', 'employees:delete',
    'roles:read', 'roles:write',
    'payroll:read', 'payroll:write',
    'audit_logs:read',
    'compliance:read', 'compliance:write',
    'documents:read', 'documents:write',
    'onboarding:read', 'onboarding:write',
    'training:read', 'training:write',
    'recruitment:read', 'recruitment:write',
    'contracts:read', 'contracts:write',
    'performance:read', 'performance:write',
    'whs:read', 'whs:write',
    'grievances:read', 'grievances:write',
    'separation:read', 'separation:write',
    'supervision:read', 'supervision:write',
    'rostering:read', 'rostering:write',
    'workforce_planning:read', 'workforce_planning:write',
    'analytics:read',
    'benefits:read', 'benefits:write',
    'competencies:read', 'competencies:write',
    'assets:read', 'assets:write',
    'dei:read', 'dei:write',
    'engagement:read', 'engagement:write',
    'recognition:read', 'recognition:write',
    'referrals:read', 'referrals:write',
    'settings:read', 'settings:write',
  ],

  hr_officer: [
    'employees:read', 'employees:write',
    'roles:read',
    'audit_logs:read',
    'compliance:read', 'compliance:write',
    'documents:read', 'documents:write',
    'onboarding:read', 'onboarding:write',
    'training:read', 'training:write',
    'recruitment:read', 'recruitment:write',
    'contracts:read', 'contracts:write',
    'performance:read', 'performance:write',
    'whs:read', 'whs:write',
    'grievances:read', 'grievances:write',
    'separation:read', 'separation:write',
    'supervision:read', 'supervision:write',
    'workforce_planning:read',
    'analytics:read',
    'benefits:read', 'benefits:write',
    'competencies:read', 'competencies:write',
    'dei:read', 'dei:write',
    'engagement:read', 'engagement:write',
    'recognition:read', 'recognition:write',
    'referrals:read',
    'settings:read',
  ],

  compliance_manager: [
    'employees:read',
    'audit_logs:read',
    'compliance:read', 'compliance:write',
    'documents:read', 'documents:write',
    'whs:read', 'whs:write',
    'training:read',
    'performance:read',
    'analytics:read',
    'settings:read',
  ],

  operations_manager: [
    'employees:read',
    'rostering:read', 'rostering:write',
    'workforce_planning:read', 'workforce_planning:write',
    'assets:read', 'assets:write',
    'supervision:read', 'supervision:write',
    'training:read',
    'performance:read',
    'analytics:read',
    'whs:read',
    'documents:read',
  ],

  team_leader: [
    'employees:read',
    'supervision:read', 'supervision:write',
    'performance:read', 'performance:write',
    'rostering:read', 'rostering:write',
    'training:read',
    'documents:read',
    'whs:read',
    'recognition:read', 'recognition:write',
    'engagement:read',
  ],

  payroll_officer: [
    'employees:read',
    'payroll:read', 'payroll:write',
    'benefits:read', 'benefits:write',
    'documents:read',
    'analytics:read',
  ],

  auditor: [
    'audit_logs:read',
    'compliance:read',
    'documents:read',
    'employees:read',
    'analytics:read',
    'whs:read',
    'training:read',
    'performance:read',
  ],

  it_admin: [
    'roles:read', 'roles:write',
    'audit_logs:read',
    'employees:read',
    'assets:read', 'assets:write',
    'settings:read', 'settings:write',
  ],

  employee: [
    'employees:read',   // own profile only (enforced per-route)
    'training:read',
    'documents:read',   // own documents only
    'recognition:read', 'recognition:write',
    'referrals:read', 'referrals:write',
    'engagement:read', 'engagement:write',
    'whs:read',
    'benefits:read',
    'competencies:read',
  ],

  contractor: [
    'employees:read',   // own profile only
    'training:read',
    'documents:read',
    'whs:read',
  ],
}

/** Check if a role has a given permission */
export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as UserRole]
  if (!perms) return false
  return perms.includes(permission)
}

/** Check if a role has ALL of the given permissions */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/** Check if a role has ANY of the given permissions */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/** Get all permissions for a role (useful for UI) */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? []
}

/** All defined roles */
export const ALL_ROLES: UserRole[] = [
  'director', 'hr_officer', 'compliance_manager', 'operations_manager',
  'team_leader', 'payroll_officer', 'employee', 'contractor', 'auditor', 'it_admin',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  director:           'Director',
  hr_officer:         'HR Officer',
  compliance_manager: 'Compliance Manager',
  operations_manager: 'Operations Manager',
  team_leader:        'Team Leader',
  payroll_officer:    'Payroll Officer',
  employee:           'Employee',
  contractor:         'Contractor',
  auditor:            'Auditor',
  it_admin:           'IT Admin',
}
