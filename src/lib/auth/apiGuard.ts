/**
 * apiGuard — drop-in helper for tenant API routes.
 *
 * Usage:
 *   const guard = await apiGuard('employees:write')
 *   if (guard.error) return guard.error          // NextResponse with 401/403
 *   const { session } = guard                    // typed session
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { hasPermission, type Permission } from './permissions'
import type { JWTPayload } from './jwt'

type GuardOk   = { error: null; session: JWTPayload & { tenantId: string; userRole: string } }
type GuardFail = { error: NextResponse; session: null }

export async function apiGuard(
  ...required: Permission[]
): Promise<GuardOk | GuardFail> {
  const session = await getSession()

  if (!session?.tenantId) {
    return {
      error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
      session: null,
    }
  }

  const role = session.userRole ?? 'employee'

  for (const perm of required) {
    if (!hasPermission(role, perm)) {
      return {
        error: NextResponse.json(
          { error: `Forbidden — requires permission: ${perm}`, role },
          { status: 403 },
        ),
        session: null,
      }
    }
  }

  return {
    error: null,
    session: session as JWTPayload & { tenantId: string; userRole: string },
  }
}

/** Guard that only checks authentication (no specific permission required) */
export async function apiAuth() {
  return apiGuard()
}
