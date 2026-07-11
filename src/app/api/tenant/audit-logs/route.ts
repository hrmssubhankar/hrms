import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLogs, users } from '@/lib/db/schema'
import { eq, and, desc, gte, ilike } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('audit_logs:read')
    if (guard.error) return guard.error
    const { session } = guard

    const { searchParams } = req.nextUrl
    const resource = searchParams.get('resource')
    const action   = searchParams.get('action')
    const since    = searchParams.get('since') // ISO date string
    const limit    = Math.min(Number(searchParams.get('limit') ?? 100), 500)
    const offset   = Number(searchParams.get('offset') ?? 0)

    const conditions = [eq(auditLogs.tenantId, session.tenantId)]
    if (resource) conditions.push(eq(auditLogs.resource, resource))
    if (action)   conditions.push(eq(auditLogs.action, action))
    if (since)    conditions.push(gte(auditLogs.createdAt, new Date(since)))

    const rows = await db
      .select({
        id:         auditLogs.id,
        userId:     auditLogs.userId,
        action:     auditLogs.action,
        resource:   auditLogs.resource,
        resourceId: auditLogs.resourceId,
        oldValues:  auditLogs.oldValues,
        newValues:  auditLogs.newValues,
        ipAddress:  auditLogs.ipAddress,
        createdAt:  auditLogs.createdAt,
        userEmail:  users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Unique resources for filter dropdown
    const allResources = await db
      .selectDistinct({ resource: auditLogs.resource })
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, session.tenantId))

    return NextResponse.json({ logs: rows, resources: allResources.map(r => r.resource) })
  } catch (err) {
    console.error('GET /api/tenant/audit-logs', err)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST — write a new audit log entry (called internally by other APIs)
export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('audit_logs:read')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { action, resource, resourceId, oldValues, newValues } = body
    if (!action || !resource) return NextResponse.json({ error: 'action and resource required' }, { status: 400 })

    const [record] = await db.insert(auditLogs).values({
      tenantId:   session.tenantId,
      userId:     session.sub ?? null,
      action,
      resource,
      resourceId: resourceId ?? null,
      oldValues:  oldValues  ?? null,
      newValues:  newValues  ?? null,
    }).returning()

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/audit-logs', err)
    return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 })
  }
}
