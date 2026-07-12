/**
 * POST /api/tenant/notifications/send
 *
 * Scans for documents expiring within N days and sends alert emails
 * to the compliance manager / HR officer for the tenant.
 *
 * Call this from a Vercel Cron Job (vercel.json) once daily:
 *   { "path": "/api/tenant/notifications/send", "schedule": "0 7 * * *" }
 *
 * Or trigger manually from the Notifications page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, employees, users } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { documentExpiryEmail, documentExpiredEmail, genericNotificationEmail } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await apiGuard('compliance:read')
  if (guard.error) return guard.error
  const { session } = guard

  const body = await req.json().catch(() => ({}))
  const daysAhead = Number(body.daysAhead ?? 7)

  const today   = new Date()
  const cutoff  = new Date(today)
  cutoff.setDate(cutoff.getDate() + daysAhead)

  const todayStr  = today.toISOString().split('T')[0]
  const cutoffStr = cutoff.toISOString().split('T')[0]

  try {
    // 1. Get tenant email context
    const ctx = await getTenantEmailCtx(session.tenantId)
    const loginUrl = ctx.loginUrl

    // 2a. Find documents ALREADY expired (to notify if missed)
    const alreadyExpiredDocs = await db
      .select({
        id:           documents.id,
        name:         documents.title,
        expiryDate:   documents.expiryDate,
        employeeId:   documents.employeeId,
        employeeFirst:employees.firstName,
        employeeLast: employees.lastName,
        employeeEmail:employees.email,
      })
      .from(documents)
      .leftJoin(employees, eq(documents.employeeId, employees.id))
      .where(
        and(
          eq(documents.tenantId, session.tenantId),
          ne(documents.status, 'archived'),
          isNotNull(documents.expiryDate),
          lte(documents.expiryDate, todayStr),
          gte(documents.expiryDate, new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]), // only last 7 days
        )
      )

    // 2b. Find documents expiring within the window (not already expired)
    const expiringDocs = await db
      .select({
        id:           documents.id,
        name:         documents.title,
        expiryDate:   documents.expiryDate,
        employeeId:   documents.employeeId,
        employeeFirst:employees.firstName,
        employeeLast: employees.lastName,
        employeeEmail:employees.email,
      })
      .from(documents)
      .leftJoin(employees, eq(documents.employeeId, employees.id))
      .where(
        and(
          eq(documents.tenantId, session.tenantId),
          ne(documents.status, 'expired'),
          ne(documents.status, 'archived'),
          isNotNull(documents.expiryDate),
          gte(documents.expiryDate, todayStr),
          lte(documents.expiryDate, cutoffStr),
        )
      )

    // 3. Get compliance managers and HR officers
    const notifyRoles = ['compliance_manager', 'hr_officer', 'director'] as const
    const managers = await db
      .select({ email: users.email, role: users.role })
      .from(users)
      .where(and(eq(users.tenantId, session.tenantId), eq(users.isActive, true)))
    const alertRecipients = managers
      .filter(u => notifyRoles.includes(u.role as any))
      .map(u => u.email)

    const sent: string[] = []
    const failed: string[] = []
    const msPerDay = 1000 * 60 * 60 * 24

    // 4a. Send EXPIRED document alerts (missed, expired in last 7 days)
    for (const doc of alreadyExpiredDocs) {
      if (!doc.expiryDate || !doc.employeeEmail) continue
      const expiredStr = new Date(doc.expiryDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
      if (ctx.notify.emailDocExpiry) {
        const tmpl = documentExpiredEmail({
          recipientName: doc.employeeFirst ?? 'Team Member',
          orgName:       ctx.orgName,
          logoUrl:       ctx.logoUrl,
          primaryColor:  ctx.primaryColor,
          documentName:  doc.name,
          expiredDate:   expiredStr,
          loginUrl,
        })
        fireEmail(ctx, { to: doc.employeeEmail, ...tmpl })
        sent.push(`EXPIRED: ${doc.name} → ${doc.employeeEmail}`)
      }
    }

    // 4b. Send EXPIRING document alerts
    for (const doc of expiringDocs) {
      if (!doc.expiryDate) continue

      const expiry   = new Date(doc.expiryDate)
      const daysLeft = Math.round((expiry.getTime() - today.getTime()) / msPerDay)
      const expiryStr = expiry.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

      // Email the employee
      if (doc.employeeEmail && ctx.notify.emailDocExpiry) {
        const tmpl = documentExpiryEmail({
          recipientName: doc.employeeFirst ?? 'Team Member',
          orgName:       ctx.orgName,
          logoUrl:       ctx.logoUrl,
          primaryColor:  ctx.primaryColor,
          documentName:  doc.name,
          expiryDate:    expiryStr,
          daysLeft,
          loginUrl,
        })
        fireEmail(ctx, { to: doc.employeeEmail, ...tmpl })
        sent.push(`${doc.name} → ${doc.employeeEmail}`)
      }

      // Alert compliance managers
      if (alertRecipients.length > 0 && ctx.notify.emailCompliance) {
        const tmpl = genericNotificationEmail({
          recipientName: 'Compliance Team',
          orgName:       ctx.orgName,
          logoUrl:       ctx.logoUrl,
          primaryColor:  ctx.primaryColor,
          title:         `Document Expiry Alert: ${doc.name}`,
          message:       `<strong>${doc.employeeFirst ?? ''} ${doc.employeeLast ?? ''}</strong>'s document <strong>${doc.name}</strong> expires on <strong>${expiryStr}</strong> (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining). Please take action to renew it before it expires.`,
          ctaLabel:      'Manage Compliance',
          ctaUrl:        `${loginUrl}/tenant/compliance`,
        })
        fireEmail(ctx, { to: alertRecipients, ...tmpl })
        sent.push(`${doc.name} → managers (${alertRecipients.length})`)
      }
    }

    return NextResponse.json({
      ok:      true,
      scanned: expiringDocs.length + alreadyExpiredDocs.length,
      sent:    sent.length,
      failed:  failed.length,
      details: { sent, failed },
    })
  } catch (err: any) {
    console.error('notifications/send error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 })
  }
}
