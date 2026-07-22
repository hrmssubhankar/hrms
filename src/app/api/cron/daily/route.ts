/**
 * GET /api/cron/daily
 *
 * Vercel Cron Job — runs at 01:00 UTC daily (vercel.json: "0 1 * * *").
 * Protected by CRON_SECRET header set in Vercel dashboard.
 *
 * Scans ALL active tenants for:
 *   1. Documents expiring in 1, 7, or 30 days → email employee + compliance managers
 *   2. Training certificate expiries → email employee
 *   3. Screening record expiries → email employee + compliance managers
 *
 * Each email is fire-and-forget (non-blocking).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, documents, employees, trainingRecords, courses, screeningRecords, users } from '@/lib/db/schema'
import { eq, and, lte, gte, isNotNull, ne, inArray } from 'drizzle-orm'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import {
  documentExpiryEmail,
  documentExpiredEmail,
  trainingExpiringEmail,
  genericNotificationEmail,
} from '@/lib/email/templates'

export const dynamic = 'force-dynamic'
// Vercel cron functions have a 60-second max; configured in vercel.json functions block

const ALERT_DAYS = [1, 7, 30] // send alerts on these days-before-expiry

function isAlertDay(expiryDateStr: string, today: Date): { match: boolean; daysLeft: number } {
  const expiry   = new Date(expiryDateStr)
  expiry.setHours(0, 0, 0, 0)
  const todayMid = new Date(today)
  todayMid.setHours(0, 0, 0, 0)
  const msLeft   = expiry.getTime() - todayMid.getTime()
  const daysLeft = Math.round(msLeft / 86_400_000)
  return { match: ALERT_DAYS.includes(daysLeft), daysLeft }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret (set CRON_SECRET in Vercel dashboard)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const today  = new Date()
  const report = { tenants: 0, emailsSent: 0, errors: [] as string[] }

  // Fetch all active tenants
  const activeTenants = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.isActive, true))

  report.tenants = activeTenants.length

  for (const tenant of activeTenants) {
    try {
      const [ctx, complianceTeam] = await Promise.all([
        getTenantEmailCtx(tenant.id),
        // Fetch compliance managers + HR officers for this tenant
        db.select({ email: users.email, role: users.role })
          .from(users)
          .where(
            and(
              eq(users.tenantId, tenant.id),
              eq(users.isActive, true),
              inArray(users.role, ['compliance_manager', 'hr_officer', 'director']),
            )
          ),
      ])

      const managerEmails = complianceTeam.map(u => u.email)
      const loginUrl      = ctx.loginUrl

      // ── 1. Documents ────────────────────────────────────────────────────────

      if (ctx.notify.emailDocExpiry) {
        const cutoff30 = new Date(today)
        cutoff30.setDate(cutoff30.getDate() + 31)
        const todayStr  = today.toISOString().split('T')[0]
        const cutoffStr = cutoff30.toISOString().split('T')[0]

        const expiringDocs = await db
          .select({
            name:        documents.title,
            expiryDate:  documents.expiryDate,
            empFirst:    employees.firstName,
            empEmail:    employees.email,
          })
          .from(documents)
          .leftJoin(employees, eq(documents.employeeId, employees.id))
          .where(
            and(
              eq(documents.tenantId, tenant.id),
              ne(documents.status, 'archived'),
              isNotNull(documents.expiryDate),
              gte(documents.expiryDate, todayStr),
              lte(documents.expiryDate, cutoffStr),
            )
          )

        for (const doc of expiringDocs) {
          if (!doc.expiryDate || !doc.empEmail) continue
          const { match, daysLeft } = isAlertDay(doc.expiryDate, today)
          if (!match) continue

          // Email employee
          fireEmail(ctx, {
            to: doc.empEmail,
            ...documentExpiryEmail({
              recipientName: doc.empFirst ?? 'Team Member',
              orgName:       ctx.orgName,
              logoUrl:       ctx.logoUrl,
              primaryColor:  ctx.primaryColor,
              documentName:  doc.name,
              expiryDate:    fmtDate(doc.expiryDate),
              daysLeft,
              loginUrl,
            }),
          })
          report.emailsSent++

          // Alert compliance team
          if (managerEmails.length > 0 && ctx.notify.emailCompliance) {
            fireEmail(ctx, {
              to: managerEmails,
              ...genericNotificationEmail({
                recipientName: 'Compliance Team',
                orgName:       ctx.orgName,
                logoUrl:       ctx.logoUrl,
                primaryColor:  ctx.primaryColor,
                title:         `Document Expiry Alert — ${doc.name}`,
                message:       `<strong>${doc.empFirst ?? 'An employee'}</strong>'s document <strong>${doc.name}</strong> expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> (${fmtDate(doc.expiryDate)}).`,
                ctaLabel:      'Review Compliance',
                ctaUrl:        `${loginUrl}/tenant/compliance`,
              }),
            })
            report.emailsSent++
          }
        }

        // Also catch documents expired in the last 24 hrs (missed notifications)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const justExpired = await db
          .select({
            name:        documents.title,
            expiryDate:  documents.expiryDate,
            empFirst:    employees.firstName,
            empEmail:    employees.email,
          })
          .from(documents)
          .leftJoin(employees, eq(documents.employeeId, employees.id))
          .where(
            and(
              eq(documents.tenantId, tenant.id),
              ne(documents.status, 'archived'),
              isNotNull(documents.expiryDate),
              gte(documents.expiryDate, yesterdayStr),
              lte(documents.expiryDate, todayStr),
            )
          )

        for (const doc of justExpired) {
          if (!doc.expiryDate || !doc.empEmail) continue
          fireEmail(ctx, {
            to: doc.empEmail,
            ...documentExpiredEmail({
              recipientName: doc.empFirst ?? 'Team Member',
              orgName:       ctx.orgName,
              logoUrl:       ctx.logoUrl,
              primaryColor:  ctx.primaryColor,
              documentName:  doc.name,
              expiredDate:   fmtDate(doc.expiryDate),
              loginUrl,
            }),
          })
          report.emailsSent++
        }
      }

      // ── 2. Training certificate expiries ────────────────────────────────────

      if (ctx.notify.emailTraining) {
        const cutoff30 = new Date(today)
        cutoff30.setDate(cutoff30.getDate() + 31)
        const todayStr  = today.toISOString().split('T')[0]
        const cutoffStr = cutoff30.toISOString().split('T')[0]

        const expiringCerts = await db
          .select({
            courseTitle: courses.title,
            expiryDate:  trainingRecords.expiryDate,
            empFirst:    employees.firstName,
            empEmail:    employees.email,
          })
          .from(trainingRecords)
          .leftJoin(employees, eq(trainingRecords.employeeId, employees.id))
          .leftJoin(courses,   eq(trainingRecords.courseId,   courses.id))
          .where(
            and(
              eq(trainingRecords.tenantId, tenant.id),
              eq(trainingRecords.status, 'completed'),
              isNotNull(trainingRecords.expiryDate),
              gte(trainingRecords.expiryDate, todayStr),
              lte(trainingRecords.expiryDate, cutoffStr),
            )
          )

        for (const cert of expiringCerts) {
          if (!cert.expiryDate || !cert.empEmail) continue
          const { match, daysLeft } = isAlertDay(cert.expiryDate, today)
          if (!match) continue

          fireEmail(ctx, {
            to: cert.empEmail,
            ...trainingExpiringEmail({
              recipientName: cert.empFirst ?? 'Team Member',
              orgName:       ctx.orgName,
              logoUrl:       ctx.logoUrl,
              primaryColor:  ctx.primaryColor,
              courseTitle:   cert.courseTitle ?? 'Training',
              expiryDate:    fmtDate(cert.expiryDate),
              daysLeft,
              loginUrl,
            }),
          })
          report.emailsSent++
        }
      }

      // ── 3. Screening record expiries ────────────────────────────────────────

      if (ctx.notify.emailCompliance) {
        const cutoff30 = new Date(today)
        cutoff30.setDate(cutoff30.getDate() + 31)
        const todayStr  = today.toISOString().split('T')[0]
        const cutoffStr = cutoff30.toISOString().split('T')[0]

        const expiringScreenings = await db
          .select({
            checkType:   screeningRecords.checkType,
            expiryDate:  screeningRecords.expiryDate,
            empFirst:    employees.firstName,
            empLast:     employees.lastName,
            empEmail:    employees.email,
          })
          .from(screeningRecords)
          .leftJoin(employees, eq(screeningRecords.employeeId, employees.id))
          .where(
            and(
              eq(screeningRecords.tenantId, tenant.id),
              isNotNull(screeningRecords.expiryDate),
              gte(screeningRecords.expiryDate, todayStr),
              lte(screeningRecords.expiryDate, cutoffStr),
            )
          )

        for (const rec of expiringScreenings) {
          if (!rec.expiryDate) continue
          const { match, daysLeft } = isAlertDay(rec.expiryDate, today)
          if (!match) continue

          // Email the employee
          if (rec.empEmail) {
            fireEmail(ctx, {
              to: rec.empEmail,
              ...genericNotificationEmail({
                recipientName: rec.empFirst ?? 'Team Member',
                orgName:       ctx.orgName,
                logoUrl:       ctx.logoUrl,
                primaryColor:  ctx.primaryColor,
                title:         `Screening Check Expiring Soon — ${rec.checkType}`,
                message:       `Your <strong>${rec.checkType}</strong> screening check expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> (${fmtDate(rec.expiryDate)}). Please contact your HR team to arrange renewal.`,
                ctaLabel:      'View My Profile',
                ctaUrl:        `${loginUrl}/tenant/profile`,
              }),
            })
            report.emailsSent++
          }

          // Alert compliance managers
          if (managerEmails.length > 0) {
            const name = `${rec.empFirst ?? ''} ${rec.empLast ?? ''}`.trim()
            fireEmail(ctx, {
              to: managerEmails,
              ...genericNotificationEmail({
                recipientName: 'Compliance Team',
                orgName:       ctx.orgName,
                logoUrl:       ctx.logoUrl,
                primaryColor:  ctx.primaryColor,
                title:         `Screening Expiry Alert — ${rec.checkType}`,
                message:       `<strong>${name || 'An employee'}</strong>'s <strong>${rec.checkType}</strong> screening expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> (${fmtDate(rec.expiryDate)}).`,
                ctaLabel:      'Review Screening',
                ctaUrl:        `${loginUrl}/tenant/screening`,
              }),
            })
            report.emailsSent++
          }
        }
      }
    } catch (err: any) {
      console.error(`cron/daily: tenant ${tenant.id} error:`, err)
      report.errors.push(`${tenant.name}: ${err.message ?? 'unknown error'}`)
    }
  }

  console.log('cron/daily complete:', report)
  return NextResponse.json({ ok: true, ...report })
}
