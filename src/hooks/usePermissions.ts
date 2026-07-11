'use client'
/**
 * usePermissions — client-side permission checks based on the current user's role.
 *
 * The role is embedded in the JWT and exposed via /api/auth/me.
 * Use this hook to conditionally show/hide UI actions.
 *
 * Usage:
 *   const { can, role } = usePermissions()
 *   if (can('employees:write')) { ... }
 */
import { useState, useEffect } from 'react'
import { hasPermission, getRolePermissions, ROLE_LABELS, type Permission, type UserRole } from '@/lib/auth/permissions'

type UsePermissionsReturn = {
  role:    string | null
  label:   string
  loading: boolean
  can:     (permission: Permission) => boolean
  canAny:  (...permissions: Permission[]) => boolean
  canAll:  (...permissions: Permission[]) => boolean
}

export function usePermissions(): UsePermissionsReturn {
  const [role, setRole]       = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { setRole(d.userRole ?? d.role ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return {
    role,
    label:   role ? (ROLE_LABELS[role as UserRole] ?? role) : '',
    loading,
    can:     (perm)    => !loading && !!role && hasPermission(role, perm),
    canAny:  (...perms) => !loading && !!role && perms.some(p => hasPermission(role, p)),
    canAll:  (...perms) => !loading && !!role && perms.every(p => hasPermission(role, p)),
  }
}
