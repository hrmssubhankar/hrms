/**
 * POST /api/tenant/contracting/[id]/send
 *
 * Accepts multipart/form-data with an optional PDF file. Uploads the PDF to
 * Vercel Blob, sets status → 'sent', and emails the employee a signing link.
 *
 * Body (FormData):
 *   file?   — PDF binary (optional; skipped if contract already has a pdfUrl)
 *   baseUrl — the app base URL so we can build the signing link
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contracts, employees, tenants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { put } from '@vercel/blob'
import { getTenantEmailCtx, fireEmail } from '@/lib/email/emailHelper'
import { genericNotificationEmail } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  try {
    const guard = await apiGuard('contracts:write')
    if (guard.error) return guard.error
    const { session } = guard

    // Fetch contract + employee + tenant
    const [row] = await db
      .select({
        id:         contracts.id,
        status:     contracts.status,
        type:       contracts.type,
        pdfUrl:     contracts.pdfUrl,
        empFirst:   employees.firstName,
        empLast:    employees.lastName,
        empEmail:   employees.email,
        orgName:    tenants.name,
        orgLogo:    tenants.logoUrl,
        orgColor:   tenants.primaryColor,
      })
      .from(contracts)
      .leftJoin(employees, eq(contracts.employeeId, employees.id))
      .leftJoin(tenants,   eq(contracts.tenantId,   tenants.id))
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))

    if (!row) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    if (row.status === 'signed') return NextResponse.json({ error: 'Contract is already signed' }, { status: 409 })

    let pdfUrl = row.pdfUrl

    // Parse form data — PDF upload is optional
    const form = await req.formData().catch(() => null)
    const file = form?.get('file') as File | null
    const baseUrl = (form?.get('baseUrl') as string | null) ?? ''

    if (file && file.size > 0) {
      const bytes      = await file.arrayBuffer()
      const fileName   = `contracts/${session.tenantId}/${id}.pdf`
      const blob = await put(fileName, bytes, {
        access:          'public',
        contentType:     'application/pdf',
        addRandomSuffix: false,
      })
      pdfUrl = blob.url

      await db.update(contracts)
        .set({ pdfUrl })
        .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))
    }

    // Mark as sent
    await db.update(contracts)
      .set({ status: 'sent', sentAt: new Date() })
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))

    // Build signing link — /offer/[contractId] is the public e-signature page
    const signingUrl = baseUrl ? `${baseUrl}/offer/${id}` : `/offer/${id}`
    const employeeName = `${row.empFirst ?? ''} ${row.empLast ?? ''}`.trim() || 'Employee'
    const contractType = row.type.replace(/_/g, ' ')

    // Email employee
    ;(async () => {
      try {
        if (!row.empEmail) return
        const emailCtx = await getTenantEmailCtx(session.tenantId)
        fireEmail(emailCtx, {
          to: row.empEmail,
          ...genericNotificationEmail({
            recipientName: row.empFirst ?? employeeName,
            orgName:       emailCtx.orgName,
            logoUrl:       emailCtx.logoUrl,
            primaryColor:  emailCtx.primaryColor,
            title:         `Please sign your ${contractType} contract`,
            message:       `Hi ${row.empFirst ?? employeeName}, your <strong>${contractType}</strong> contract from <strong>${emailCtx.orgName}</strong> is ready for your signature. Please click the button below to review and sign your contract.`,
            ctaLabel:      'Review & Sign Contract',
            ctaUrl:        signingUrl,
          }),
        })
      } catch (e) { console.error('contract send email error:', e) }
    })()

    return NextResponse.json({ ok: true, signingUrl, pdfUrl })
  } catch (err) {
    console.error('POST /api/tenant/contracting/[id]/send', err)
    return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 })
  }
}
