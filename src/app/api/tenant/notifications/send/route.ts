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
import { documents, employees, users, tenants } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull, ne } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { sendEmail } from '@/lib/email/resend'
import { documentExpiryEmail, genericNotificationEmail } from '@/lib/email/templates'

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
    // 1. Get tenant info
    const [tenant] = await db
      .select({ name: tenants.name, slug: tenants.slug, primaryColor: tenants.primaryColor })
      .from(tenants)
      .where(eq(tenants.id, session.tenantId))

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? `https://${process.env.VERCEL_URL ?? 'hrms.app'}`

    // 2. Find documents expiring within the window (not already expired)
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

    // 3. Get compliance managers and HR officers to notify
    const notifyRoles = ['compliance_manager', 'hr_officer', 'director'] as const
    const managers = await db
      .select({ email: users.email, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.tenantId, session.tenantId),
          eq(users.isActive, true),
        )
      )
    const alertRecipients = managers
      .filter(u => notifyRoles.includes(u.role as any))
      .map(u => u.email)

    // 4. Send per-document alerts to the employee + compliance managers
    const sent: string[] = []
    const failed: string[] = []

    for (const doc of expiringDocs) {
      if (!doc.expiryDate) continue

      const expiry    = new Date(doc.expiryDate)
      const msPerDay  = 1000 * 60 * 60 * 24
      const daysLeft  = Math.round((expiry.getTime() - today.getTime()) / msPerDay)
      const expiryStr = expiry.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

      // Email the employee
      if (doc.employeeEmail) {
        const tmpl = documentExpiryEmail({
          recipientName: doc.employeeFirst ?? 'Team Member',
          orgName:       tenant?.name ?? 'Your Organisation',
          documentName:  doc.name,
          expiryDate:    expiryStr,
          daysLeft,
          loginUrl,
          primaryColor:  tenant?.primaryColor ?? '#1a4fff',
        })
        const result = await sendEmail({ to: doc.employeeEmail, ...tmpl })
        if (result.ok) sent.push(`${doc.name} → ${doc.employeeEmail}`)
        else failed.push(`${doc.name} → ${doc.employeeEmail}: ${result.error}`)
      }

      // Email compliance managers (batched — one email per doc listing all recipients)
      if (alertRecipients.length > 0) {
        const tmpl = genericNotificationEmail({
          recipientName: 'Team',
          orgName:       tenant?.name ?? 'Your Organisation',
          title:         `Document Expiry Alert: ${doc.name}`,
          message:       `<strong>${doc.employeeFirst ?? ''} ${doc.employeeLast ?? ''}</strong>'s document <strong>${doc.name}</strong> expires on <strong>${expiryStr}</strong> (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining). Please take action to renew it.`,
          ctaLabel:      'Manage Compliance →',
          ctaUrl:        `${loginUrl}/tenant/compliance`,
          primaryColor:  tenant?.primaryColor ?? '#1a4fff',
        })
        const result = await sendEmail({ to: alertRecipients, ...tmpl })
        if (result.ok) sent.push(`${doc.name} → managers`)
        else failed.push(`${doc.name} → managers: ${result.error}`)
      }
    }

    return NextResponse.json({
      ok:      true,
      scanned: expiringDocs.length,
      sent:    sent.length,
      failed:  failed.length,
      details: { sent, failed },
    })
  } catch (err: any) {
    console.error('notifications/send error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 })
  }
}
