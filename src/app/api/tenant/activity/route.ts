import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLogs, employees } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  const rows = await db
    .select({
      id:         auditLogs.id,
      action:     auditLogs.action,
      resource:   auditLogs.resource,
      resourceId: auditLogs.resourceId,
      newValues:  auditLogs.newValues,
      createdAt:  auditLogs.createdAt,
      actorFirst: employees.firstName,
      actorLast:  employees.lastName,
    })
    .from(auditLogs)
    .leftJoin(employees, eq(auditLogs.userId, employees.userId))
    .where(eq(auditLogs.tenantId, session.tenantId!))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20)

  return NextResponse.json(rows)
}
