/**
 * Unit tests — RBAC permission matrix
 * lib/auth/permissions.ts
 */
import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  ALL_ROLES,
  ROLE_LABELS,
  type UserRole,
  type Permission,
} from '@/lib/auth/permissions'

// ── hasPermission ──────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('returns true for director with any permission', () => {
    const checks: Permission[] = [
      'employees:read', 'employees:write', 'employees:delete',
      'payroll:read', 'payroll:write',
      'leave:approve',
      'settings:write',
      'audit_logs:read',
    ]
    checks.forEach(p => {
      expect(hasPermission('director', p)).toBe(true)
    })
  })

  it('returns false for unknown role', () => {
    expect(hasPermission('ghost', 'employees:read')).toBe(false)
  })

  it('returns false for empty string role', () => {
    expect(hasPermission('', 'employees:read')).toBe(false)
  })

  // hr_officer
  it('hr_officer can read/write employees but NOT delete', () => {
    expect(hasPermission('hr_officer', 'employees:read')).toBe(true)
    expect(hasPermission('hr_officer', 'employees:write')).toBe(true)
    expect(hasPermission('hr_officer', 'employees:delete')).toBe(false)
  })

  it('hr_officer cannot read payroll', () => {
    expect(hasPermission('hr_officer', 'payroll:read')).toBe(false)
    expect(hasPermission('hr_officer', 'payroll:write')).toBe(false)
  })

  it('hr_officer can approve leave', () => {
    expect(hasPermission('hr_officer', 'leave:approve')).toBe(true)
  })

  // payroll_officer
  it('payroll_officer can read+write payroll', () => {
    expect(hasPermission('payroll_officer', 'payroll:read')).toBe(true)
    expect(hasPermission('payroll_officer', 'payroll:write')).toBe(true)
  })

  it('payroll_officer cannot write employees', () => {
    expect(hasPermission('payroll_officer', 'employees:write')).toBe(false)
  })

  it('payroll_officer cannot approve leave', () => {
    expect(hasPermission('payroll_officer', 'leave:approve')).toBe(false)
  })

  // compliance_manager
  it('compliance_manager can read/write compliance and WHS', () => {
    expect(hasPermission('compliance_manager', 'compliance:read')).toBe(true)
    expect(hasPermission('compliance_manager', 'compliance:write')).toBe(true)
    expect(hasPermission('compliance_manager', 'whs:read')).toBe(true)
    expect(hasPermission('compliance_manager', 'whs:write')).toBe(true)
  })

  it('compliance_manager cannot write employees', () => {
    expect(hasPermission('compliance_manager', 'employees:write')).toBe(false)
  })

  // operations_manager
  it('operations_manager can approve leave', () => {
    expect(hasPermission('operations_manager', 'leave:approve')).toBe(true)
  })

  it('operations_manager cannot access payroll', () => {
    expect(hasPermission('operations_manager', 'payroll:read')).toBe(false)
  })

  // team_leader
  it('team_leader can approve timesheets', () => {
    expect(hasPermission('team_leader', 'timesheets:approve')).toBe(true)
  })

  it('team_leader cannot write payroll', () => {
    expect(hasPermission('team_leader', 'payroll:write')).toBe(false)
  })

  // employee
  it('employee can read+write own leave', () => {
    expect(hasPermission('employee', 'leave:read')).toBe(true)
    expect(hasPermission('employee', 'leave:write')).toBe(true)
  })

  it('employee cannot approve leave', () => {
    expect(hasPermission('employee', 'leave:approve')).toBe(false)
  })

  it('employee cannot write other employees', () => {
    expect(hasPermission('employee', 'employees:write')).toBe(false)
    expect(hasPermission('employee', 'employees:delete')).toBe(false)
  })

  it('employee cannot access payroll', () => {
    expect(hasPermission('employee', 'payroll:read')).toBe(false)
  })

  // contractor
  it('contractor cannot access payroll or leave write', () => {
    expect(hasPermission('contractor', 'payroll:read')).toBe(false)
    expect(hasPermission('contractor', 'leave:write')).toBe(false)
  })

  // auditor
  it('auditor can read audit_logs, compliance, documents', () => {
    expect(hasPermission('auditor', 'audit_logs:read')).toBe(true)
    expect(hasPermission('auditor', 'compliance:read')).toBe(true)
    expect(hasPermission('auditor', 'documents:read')).toBe(true)
  })

  it('auditor cannot write anything', () => {
    expect(hasPermission('auditor', 'compliance:write')).toBe(false)
    expect(hasPermission('auditor', 'documents:write')).toBe(false)
    expect(hasPermission('auditor', 'employees:write')).toBe(false)
  })

  // it_admin
  it('it_admin can manage roles and settings', () => {
    expect(hasPermission('it_admin', 'roles:read')).toBe(true)
    expect(hasPermission('it_admin', 'roles:write')).toBe(true)
    expect(hasPermission('it_admin', 'settings:read')).toBe(true)
    expect(hasPermission('it_admin', 'settings:write')).toBe(true)
  })

  it('it_admin cannot access payroll or leave', () => {
    expect(hasPermission('it_admin', 'payroll:read')).toBe(false)
    expect(hasPermission('it_admin', 'leave:approve')).toBe(false)
  })
})

// ── hasAllPermissions ──────────────────────────────────────────────────────────

describe('hasAllPermissions', () => {
  it('returns true when role has ALL listed permissions', () => {
    expect(hasAllPermissions('director', ['employees:read', 'payroll:write', 'leave:approve'])).toBe(true)
  })

  it('returns false when role is missing ONE permission', () => {
    // hr_officer lacks payroll:read
    expect(hasAllPermissions('hr_officer', ['employees:read', 'payroll:read'])).toBe(false)
  })

  it('returns true for empty permission array (vacuous truth)', () => {
    expect(hasAllPermissions('employee', [])).toBe(true)
  })
})

// ── hasAnyPermission ───────────────────────────────────────────────────────────

describe('hasAnyPermission', () => {
  it('returns true when role has at least one', () => {
    // employee has leave:read but not payroll:read
    expect(hasAnyPermission('employee', ['payroll:read', 'leave:read'])).toBe(true)
  })

  it('returns false when role has none', () => {
    expect(hasAnyPermission('employee', ['payroll:read', 'payroll:write'])).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(hasAnyPermission('director', [])).toBe(false)
  })
})

// ── getRolePermissions ─────────────────────────────────────────────────────────

describe('getRolePermissions', () => {
  it('returns non-empty array for every valid role', () => {
    ALL_ROLES.forEach(role => {
      const perms = getRolePermissions(role)
      expect(perms.length).toBeGreaterThan(0)
    })
  })

  it('returns empty array for unknown role', () => {
    expect(getRolePermissions('ghost')).toEqual([])
  })

  it('director has the most permissions of all roles', () => {
    const directorCount = getRolePermissions('director').length
    ALL_ROLES.filter(r => r !== 'director').forEach(role => {
      expect(directorCount).toBeGreaterThanOrEqual(getRolePermissions(role).length)
    })
  })
})

// ── Metadata ──────────────────────────────────────────────────────────────────

describe('ROLE_LABELS', () => {
  it('has a label for every role in ALL_ROLES', () => {
    ALL_ROLES.forEach(role => {
      expect(ROLE_LABELS[role]).toBeTruthy()
    })
  })
})

// ── Security invariants ───────────────────────────────────────────────────────

describe('security invariants', () => {
  const sensitivePerms: Permission[] = [
    'employees:delete',
    'payroll:write',
    'settings:write',
    'roles:write',
    'audit_logs:read',
  ]

  const restrictedRoles: UserRole[] = ['employee', 'contractor', 'auditor']

  it('employee and contractor have NO sensitive write permissions', () => {
    const writePerms: Permission[] = ['payroll:write', 'employees:delete', 'settings:write', 'roles:write']
    restrictedRoles.forEach(role => {
      writePerms.forEach(perm => {
        expect(
          hasPermission(role, perm),
          `${role} should NOT have ${perm}`
        ).toBe(false)
      })
    })
  })

  it('auditor has no write permissions at all', () => {
    const allPerms = getRolePermissions('auditor')
    const writes = allPerms.filter(p => p.endsWith(':write') || p.endsWith(':approve'))
    expect(writes).toHaveLength(0)
  })

  it('only director can delete employees', () => {
    const rolesWithDelete = ALL_ROLES.filter(r => hasPermission(r, 'employees:delete'))
    expect(rolesWithDelete).toEqual(['director'])
  })
})
