import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants, tenantModules, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email/resend'
import { newTenantOnboardedEmail } from '@/lib/email/templates'

// POST /api/super-admin/intake
// Creates a client from a completed intake form.
// Accepts the same shape as the intake form state.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const {
      tradingName, legalName, slug: rawSlug,
      registrationNumber, industry,
      country = 'AU', currency = 'AUD', timezone = 'UTC',
      headcount, addressLine1, city, state, postcode,
      contactName, contactTitle, contactEmail, contactPhone,
      billingEmail, billingPhone,
      adminEmail, adminPassword,
      tier = 'enterprise',
      primaryColor = '#6d28d9',
      selectedModules = [] as number[],
      notes,
    } = body

    if (!tradingName || !contactEmail) {
      return NextResponse.json({ error: 'tradingName and contactEmail are required' }, { status: 400 })
    }

    // Auto-generate slug from trading name if not provided
    const slug = (rawSlug || tradingName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))

    // Check slug uniqueness
    const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug))
    if (existing.length > 0) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken — choose a different name` }, { status: 409 })
    }

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name:         tradingName,
      slug,
      tier,
      primaryColor,
      isActive:     true,
      settings: {
        country, currency, timezone,
        headcount:          headcount ? Number(headcount) : undefined,
        legalName:          legalName || tradingName,
        registrationNumber: registrationNumber || undefined,
        industry:           industry || undefined,
        notes:              notes || undefined,
        contact: {
          name:  contactName,
          title: contactTitle,
          email: contactEmail,
          phone: contactPhone,
        },
        billing: {
          email: billingEmail || contactEmail,
          phone: billingPhone || contactPhone,
        },
        address: {
          line1: addressLine1, city, state, postcode, country,
        },
      },
    }).returning()

    // Enable selected modules (or all if none selected)
    const ALL_MODULES = [
      { id: 1, name: 'Dashboard' }, { id: 2, name: 'Employee Management' },
      { id: 3, name: 'Roles & Access' }, { id: 4, name: 'Audit Logs' },
      { id: 5, name: 'Documents' }, { id: 6, name: 'Compliance - Screening' },
      { id: 7, name: 'Compliance - Lock' }, { id: 8, name: 'Compliance - Tracking' },
      { id: 9, name: 'Onboarding' }, { id: 10, name: 'Training' },
      { id: 11, name: 'Competencies' }, { id: 12, name: 'Supervision' },
      { id: 13, name: 'Workforce Planning' }, { id: 14, name: 'Recruitment' },
      { id: 15, name: 'Contracts' }, { id: 16, name: 'Performance Reviews' },
      { id: 17, name: 'WHS & Safety' }, { id: 18, name: 'Grievances' },
      { id: 19, name: 'Separation' }, { id: 20, name: 'Analytics' },
      { id: 21, name: 'Benefits' }, { id: 22, name: 'Recognition' },
      { id: 23, name: 'Referrals' }, { id: 24, name: 'DEI' },
      { id: 25, name: 'Engagement' }, { id: 26, name: 'Assets' },
      { id: 27, name: 'Rostering' }, { id: 28, name: 'Payroll' },
      { id: 29, name: 'Leave Management' }, { id: 30, name: 'Public Holidays' },
    ]

    const enabledIds = new Set<number>(
      selectedModules.length > 0 ? [1, ...selectedModules] : ALL_MODULES.map(m => m.id)
    )

    await db.insert(tenantModules).values(
      ALL_MODULES.map(m => ({
        tenantId:   tenant.id,
        moduleId:   m.id,
        moduleName: m.name,
        isEnabled:  enabledIds.has(m.id),
      }))
    )

    // Create admin user if provided
    let adminUser = null
    if (adminEmail && adminPassword) {
      const hash = await bcrypt.hash(adminPassword, 12)
      const [user] = await db.insert(users).values({
        tenantId:     tenant.id,
        email:        adminEmail,
        passwordHash: hash,
        role:         'director',
        isActive:     true,
      }).returning({ id: users.id, email: users.email })
      adminUser = user

      const deploymentUrl = `https://${slug}-hrmsapp.vercel.app`
      const loginUrl = `${deploymentUrl}/login`
      const tmpl = newTenantOnboardedEmail({
        recipientName: contactName ?? adminEmail,
        orgName:       tradingName,
        tier,
        loginUrl,
        adminEmail,
        tempPassword:  adminPassword,
      })
      sendEmail({ to: adminEmail, ...tmpl }).catch(console.error)
    }

    return NextResponse.json({
      tenant,
      adminUser,
      modulesEnabled: enabledIds.size,
      message: `Client "${tradingName}" created successfully${adminUser ? ` with admin account ${adminEmail}` : ''}.`,
    }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/super-admin/intake', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create client' }, { status: 500 })
  }
}
