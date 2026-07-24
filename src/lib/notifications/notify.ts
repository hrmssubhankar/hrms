/**
 * notify.ts — fire-and-forget in-app notification helpers.
 *
 * Usage:
 *   notify(tenantId, userId, { type, title, body?, link? })
 *   notifyRole(tenantId, ['hr_officer', 'director'], { type, title, body?, link? })
 *
 * Both functions are fire-and-forget: they never throw and never block
 * the calling API response. Import only what you need.
 */

import { db } from '@/lib/db'
import { notifications, users } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export type NotifyPayload = {
  type:   string   // 'leave' | 'document' | 'compliance' | 'onboarding' | 'payroll' | 'system' | etc.
  title:  string
  body?:  string
  link?:  string
}

/**
 * Notify a single user by their users.id UUID.
 * Safe to call without await — errors are swallowed.
 */
export function notify(
  tenantId: string,
  userId:   string,
  payload:  NotifyPayload,
): void {
  db.insert(notifications)
    .values({
      tenantId,
      userId,
      type:  payload.type,
      title: payload.title,
      body:  payload.body ?? null,
      link:  payload.link ?? null,
    })
    .catch(err => console.error('[notify]', err))
}

/**
 * Notify all active users in the tenant who hold one of the given roles.
 * Skips silently if no matching users are found.
 * Safe to call without await — errors are swallowed.
 */
export function notifyRole(
  tenantId: string,
  roles:    string[],
  payload:  NotifyPayload,
): void {
  ;(async () => {
    try {
      const targets = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.isActive, true),
            inArray(users.role, roles as any[]),
          )
        )

      if (targets.length === 0) return

      await db.insert(notifications).values(
        targets.map(u => ({
          tenantId,
          userId: u.id,
          type:   payload.type,
          title:  payload.title,
          body:   payload.body ?? null,
          link:   payload.link ?? null,
        }))
      )
    } catch (err) {
      console.error('[notifyRole]', err)
    }
  })()
}
