import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recognitions, employees } from '@/lib/db/schema'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { recognitionAwardEmail } from '@/lib/email/templates'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('recognition:read')
    if (guard.error) return guard.error
    const { session } = guard
    const nominator = { id: employees.id, firstName: employees.firstName, lastName: employees.lastName }
    const rows = await db.select({
      id: recognitions.id, recipientId: recognitions.recipientId,
      nominatedBy: recognitions.nominatedBy, type: recognitions.type,
      reason: recognitions.reason, period: recognitions.period,
      isPublic: recognitions.isPublic, createdAt: recognitions.createdAt,
      recipientFirstName: employees.firstName, recipientLastName: employees.lastName,
    }).from(recognitions)
      .leftJoin(employees, eq(recognitions.recipientId, employees.id))
      .where(eq(recognitions.tenantId, session.tenantId))
      .orderBy(desc(recognitions.createdAt))
    return NextResponse.json({ recognitions: rows })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('recognition:write')
    if (guard.error) return guard.error
    const { session } = guard
    const { recipientId, nominatedBy, type, reason, period, isPublic } = await req.json()
    if (!recipientId || !type) return NextResponse.json({ error: 'recipientId and type required' }, { status: 400 })
    const [record] = await db.insert(recognitions).values({
      tenantId: session.tenantId, recipientId, type,
      nominatedBy: nominatedBy || null, reason: reason || null,
      period: period || null, isPublic: isPublic ?? true,
    }).returning()
    // Email the recipient
    try {
      const ctx = await getTenantEmailCtx(session.tenantId)
      if (ctx.notify.emailRecognition) {
        const [recipient] = await db.select({ firstName: employees.firstName, email: employees.email })
          .from(employees).where(eq(employees.id, record.recipientId))
        let nominatorName: string | undefined
        if (record.nominatedBy) {
          const [nom] = await db.select({ firstName: employees.firstName, lastName: employees.lastName })
            .from(employees).where(eq(employees.id, record.nominatedBy))
          if (nom) nominatorName = `${nom.firstName} ${nom.lastName}`
        }
        if (recipient?.email) {
          fireEmail(ctx, { to: recipient.email, ...recognitionAwardEmail({
            recipientName: recipient.firstName, orgName: ctx.orgName, logoUrl: ctx.logoUrl, primaryColor: ctx.primaryColor,
            awardType: record.type, reason: record.reason ?? undefined, nominatorName, loginUrl: ctx.loginUrl,
          }) })
        }
      }
    } catch (emailErr) { console.error('Recognition email error:', emailErr) }

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
