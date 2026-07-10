import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLogs, tenants, users } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, ilike, or } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')
  const action   = searchParams.get('action')
  const search   = searchParams.get('search')
  const from     = searchParams.get('from')
  const to       = searchParams.get('to')
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit    = 50

  try {
    const conditions = []
    if (tenantId) conditions.push(eq(auditLogs.tenantId, tenantId))
    if (action)   conditions.push(ilike(auditLogs.action, `%${action}%`))
    if (search)   conditions.push(or(
      ilike(auditLogs.action, `%${search}%`),
      ilike(auditLogs.resource, `%${search}%`),
    ))
    if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)))
    if (to)   conditions.push(lte(auditLogs.createdAt, new Date(to)))

    const rows = await db
      .select({
        id:         auditLogs.id,
        action:     auditLogs.action,
        resource:   auditLogs.resource,
        resourceId: auditLogs.resourceId,
        oldValues:  auditLogs.oldValues,
        newValues:  auditLogs.newValues,
        ipAddress:  auditLogs.ipAddress,
        createdAt:  auditLogs.createdAt,
        tenantId:   auditLogs.tenantId,
        tenantName: tenants.name,
      })
      .from(auditLogs)
      .leftJoin(tenants, eq(auditLogs.tenantId, tenants.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    // Fetch distinct tenants for filter dropdown
    const allTenants = await db.select({ id: tenants.id, name: tenants.name }).from(tenants)

    return NextResponse.json({ logs: rows, tenants: allTenants, page, limit })
  } catch (err) {
    console.error('GET /api/super-admin/audit-logs error:', err)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
