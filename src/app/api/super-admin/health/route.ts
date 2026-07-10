import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, users, auditLogs } from '@/lib/db/schema'
import { count, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'warn' | 'error'; message: string; latencyMs?: number }> = {}

  // DB connectivity + latency
  try {
    const dbStart = Date.now()
    const [tenantCount] = await db.select({ total: count() }).from(tenants)
    const [userCount]   = await db.select({ total: count() }).from(users)
    const dbLatency = Date.now() - dbStart

    checks.database = {
      status: dbLatency < 300 ? 'ok' : dbLatency < 1000 ? 'warn' : 'error',
      message: `Connected · ${tenantCount.total} tenants · ${userCount.total} users`,
      latencyMs: dbLatency,
    }
  } catch (err: any) {
    checks.database = { status: 'error', message: err.message ?? 'Connection failed' }
  }

  // Audit log table
  try {
    const [last] = await db.select({ createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1)
    checks.auditLog = {
      status: 'ok',
      message: last ? `Last entry: ${new Date(last.createdAt).toLocaleString('en-AU')}` : 'No entries yet',
    }
  } catch {
    checks.auditLog = { status: 'error', message: 'Audit log table unreachable' }
  }

  // Environment
  const envChecks = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL']
  const missingEnv = envChecks.filter(k => !process.env[k])
  checks.environment = {
    status: missingEnv.length === 0 ? 'ok' : 'warn',
    message: missingEnv.length === 0 ? 'All required env vars set' : `Missing: ${missingEnv.join(', ')}`,
  }

  const overallStatus = Object.values(checks).some(c => c.status === 'error')
    ? 'error'
    : Object.values(checks).some(c => c.status === 'warn')
    ? 'warn'
    : 'ok'

  return NextResponse.json({
    status: overallStatus,
    checks,
    responseMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    platform: {
      nodeVersion:  process.version,
      nextVersion:  '15.x',
      environment:  process.env.NODE_ENV ?? 'unknown',
      appUrl:       process.env.NEXT_PUBLIC_APP_URL ?? 'not set',
    },
  })
}
