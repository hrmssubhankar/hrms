/**
 * Unit tests — RBAC permission matrix
 * src/lib/auth/permissions.ts
 */
import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  ALL_ROLES,
} from '@/lib/auth/permissions'

// ── hasPermission ─────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('returns true for a permission the role has', () => {
    expect(hasPermission('director', 'employees:write')).toBe(true)
    expect(hasPermission('hr_officer', 'employees:read')).toBe(true)
    expect(hasPermission('employee', 'leave:write')).toBe(true)
    expect(hasPermission('payroll_officer', 'payroll:write')).toBe(true)
  })

  it('returns false for a permission the role does not have', () => {
    expect(hasPermission('employee', 'employees:write')).toBe(false)
    expect(hasPermission('contractor', 'payroll:read')).toBe(false)
    expect(hasPermission('auditor', 'payroll:write')).toBe(false)
    expect(hasPermission('it_admin', 'leave:approve')).toBe(false)
  })

  it('returns false for an unknown role', () => {
    expect(hasPermission('supervillain', 'employees:read')).toBe(false)
  })

  it('employee cannot approve leave or timesheets', () => {
    expect(hasPermission('employee', 'leave:approve')).toBe(false)
    expect(hasPermission('employee', 'timesheets:approve')).toBe(false)
  })

  it('contractor cannot approve leave or timesheets', () => {
    expect(hasPermission('contractor', 'leave:approve')).toBe(false)
    expect(hasPermission('contractor', 'timesheets:approve')).toBe(false)
  })

  it('director has full access', () => {
    expect(hasPermission('director', 'employees:delete')).toBe(true)
    expect(hasPermission('director', 'payroll:write')).toBe(true)
    expect(hasPermission('director', 'audit_logs:read')).toBe(true)
    expect(hasPermission('director', 'settings:write')).toBe(true)
    expect(hasPermission('director', 'leave:approve')).toBe(true)
  })

  it('it_admin only has role/asset/settings access', () => {
    expect(hasPermission('it_admin', 'roles:write')).toBe(true)
    expect(hasPermission('it_admin', 'assets:write')).toBe(true)
    expect(hasPermission('it_admin', 'settings:write')).toBe(true)
    expect(hasPermission('it_admin', 'payroll:read')).toBe(false)
    expect(hasPermission('it_admin', 'employees:write')).toBe(false)
  })

  it('auditor has read-only access across compliance areas', () => {
    expect(hasPermission('auditor', 'audit_logs:read')).toBe(true)
    expect(hasPermission('auditor', 'employees:read')).toBe(true)
    expect(hasPermission('auditor', 'ndis_audits:read')).toBe(true)
    expect(hasPermission('auditor', 'employees:write')).toBe(false)
    expect(hasPermission('auditor', 'compliance:write')).toBe(false)
  })

  it('team_leader can approve leave and timesheets but not write payroll', () => {
    expect(hasPermission('team_leader', 'leave:approve')).toBe(true)
    expect(hasPermission('team_leader', 'timesheets:approve')).toBe(true)
    expect(hasPermission('team_leader', 'payroll:write')).toBe(false)
  })
})

// ── hasAllPermissions ─────────────────────────────────────────────────────────

describe('hasAllPermissions', () => {
  it('returns true when role has all listed permissions', () => {
    expect(hasAllPermissions('director', ['employees:read', 'employees:write', 'payroll:read'])).toBe(true)
    expect(hasAllPermissions('hr_officer', ['employees:read', 'onboarding:write'])).toBe(true)
  })

  it('returns false when role is missing any permission', () => {
    expect(hasAllPermissions('employee', ['leave:read', 'leave:approve'])).toBe(false)
    expect(hasAllPermissions('it_admin', ['roles:write', 'payroll:read'])).toBe(false)
  })

  it('returns true for empty permission list', () => {
    expect(hasAllPermissions('employee', [])).toBe(true)
  })
})

// ── hasAnyPermission ──────────────────────────────────────────────────────────

describe('hasAnyPermission', () => {
  it('returns true when role has at least one permission', () => {
    expect(hasAnyPermission('employee', ['leave:approve', 'leave:write'])).toBe(true)
    expect(hasAnyPermission('it_admin', ['payroll:read', 'roles:write'])).toBe(true)
  })

  it('returns false when role has none of the listed permissions', () => {
    expect(hasAnyPermission('contractor', ['payroll:read', 'audit_logs:read'])).toBe(false)
    expect(hasAnyPermission('it_admin', ['payroll:write', 'leave:approve'])).toBe(false)
  })

  it('returns false for empty permission list', () => {
    expect(hasAnyPermission('director', [])).toBe(false)
  })
})

// ── getRolePermissions ────────────────────────────────────────────────────────

describe('getRolePermissions', () => {
  it('returns non-empty array for every defined role', () => {
    for (const role of ALL_ROLES) {
      const perms = getRolePermissions(role)
      expect(perms.length).toBeGreaterThan(0)
    }
  })

  it('returns empty array for unknown role', () => {
    expect(getRolePermissions('ghost')).toEqual([])
  })

  it('director permissions are a superset of hr_officer permissions', () => {
    const directorPerms  = new Set(getRolePermissions('director'))
    const hrOfficerPerms = getRolePermissions('hr_officer')
    for (const p of hrOfficerPerms) {
      expect(directorPerms.has(p)).toBe(true)
    }
  })
})
