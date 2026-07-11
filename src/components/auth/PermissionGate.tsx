'use client'
/**
 * PermissionGate — renders children only if the current user has the required permission.
 *
 * Usage:
 *   <PermissionGate permission="employees:write">
 *     <button>Add Employee</button>
 *   </PermissionGate>
 *
 *   <PermissionGate permission="payroll:write" fallback={<p>No access</p>}>
 *     <PayrollRunButton />
 *   </PermissionGate>
 */
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/lib/auth/permissions'

type Props = {
  permission:  Permission
  children:    React.ReactNode
  fallback?:   React.ReactNode
}

export default function PermissionGate({ permission, children, fallback = null }: Props) {
  const { can, loading } = usePermissions()
  if (loading) return null
  return can(permission) ? <>{children}</> : <>{fallback}</>
}
