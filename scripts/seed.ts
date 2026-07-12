/**
 * HRMS Production Seed Script
 *
 * Run from project root:
 *   npx tsx scripts/seed.ts
 *
 * What it does:
 *  1. Creates all DB tables via Drizzle push (must be done first via drizzle-kit push)
 *  2. Upserts both tenants (Yahweh Care + Yahweh Property Care)
 *  3. Enables all 30 modules for each tenant
 *  4. Creates super-admin account
 *  5. Creates initial director account for each tenant
 *
 * Safe to re-run — uses upsert/conflict handling throughout.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })  // Next.js uses .env.local
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import {
  tenants, tenantModules, users, superAdmins,
} from '../src/lib/db/schema'

// ── Config ────────────────────────────────────────────────────────────────

const YAHWEH_CARE_ID     = '00000000-0000-0000-0000-000000000001'
const YAHWEH_PC_ID       = '00000000-0000-0000-0000-000000000002'

const TENANT_DEFS = [
  {
    id:           YAHWEH_CARE_ID,
    name:         'Yahweh Care Pty Ltd',
    slug:         'yahweh-care',
    primaryColor: '#6d28d9',
    tier:         'professional' as const,
    directorEmail: 'director@yahwehcare.com.au',
    directorPass:  'YahwehCare2024!',
  },
  {
    id:           YAHWEH_PC_ID,
    name:         'Yahweh Property Care Pty Ltd',
    slug:         'yahweh-property-care',
    primaryColor: '#0ea5e9',
    tier:         'professional' as const,
    directorEmail: 'director@yahwehpropertycare.com.au',
    directorPass:  'YahwehPC2024!',
  },
]

// All 30 SOW modules
const MODULES = [
  { id: 1,  name: 'Dashboard' },
  { id: 2,  name: 'Employee Management' },
  { id: 3,  name: 'Roles & Access' },
  { id: 4,  name: 'Audit Logs' },
  { id: 5,  name: 'Documents' },
  { id: 6,  name: 'Compliance - Screening' },
  { id: 7,  name: 'Compliance - Lock' },
  { id: 8,  name: 'Compliance - Tracking' },
  { id: 9,  name: 'Onboarding' },
  { id: 10, name: 'Training' },
  { id: 11, name: 'Competencies' },
  { id: 12, name: 'Supervision' },
  { id: 13, name: 'Workforce Planning' },
  { id: 14, name: 'Recruitment' },
  { id: 15, name: 'Contracts' },
  { id: 16, name: 'Performance Reviews' },
  { id: 17, name: 'WHS & Safety' },
  { id: 18, name: 'Grievances' },
  { id: 19, name: 'Separation' },
  { id: 20, name: 'Analytics' },
  { id: 21, name: 'Benefits' },
  { id: 22, name: 'Recognition' },
  { id: 23, name: 'Referrals' },
  { id: 24, name: 'DEI' },
  { id: 25, name: 'Engagement' },
  { id: 26, name: 'Assets' },
  { id: 27, name: 'Rostering' },
  { id: 28, name: 'Payroll' },
  { id: 29, name: 'Leave Management' },
  { id: 30, name: 'Public Holidays' },
]

const SUPER_ADMIN = {
  email:    'admin@yahwehhrms.com.au',
  password: 'SuperAdmin2024!',
  name:     'System Administrator',
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set — check .env.local')

  const sql = neon(url)
  const db  = drizzle(sql)

  console.log('\n🌱 Starting HRMS seed...\n')

  // ── 1. Tenants ──────────────────────────────────────────────────────────
  for (const t of TENANT_DEFS) {
    const existing = await db.select({ id: tenants.id })
      .from(tenants).where(eq(tenants.id, t.id))

    if (existing.length > 0) {
      await db.update(tenants).set({
        name:         t.name,
        slug:         t.slug,
        primaryColor: t.primaryColor,
        tier:         t.tier,
        isActive:     true,
      }).where(eq(tenants.id, t.id))
      console.log(`✓ Tenant updated: ${t.name}`)
    } else {
      await db.insert(tenants).values({
        id:           t.id,
        name:         t.name,
        slug:         t.slug,
        primaryColor: t.primaryColor,
        tier:         t.tier,
        isActive:     true,
        settings:     {},
      })
      console.log(`✓ Tenant created: ${t.name}`)
    }
  }

  // ── 2. Modules ──────────────────────────────────────────────────────────
  console.log('\n📦 Enabling modules...')
  for (const tenant of TENANT_DEFS) {
    for (const mod of MODULES) {
      const existing = await db.select({ id: tenantModules.id })
        .from(tenantModules)
        .where(and(
          eq(tenantModules.tenantId, tenant.id),
          eq(tenantModules.moduleId, mod.id),
        ))

      if (existing.length > 0) {
        await db.update(tenantModules)
          .set({ isEnabled: true, moduleName: mod.name })
          .where(eq(tenantModules.id, existing[0].id))
      } else {
        await db.insert(tenantModules).values({
          tenantId:   tenant.id,
          moduleId:   mod.id,
          moduleName: mod.name,
          isEnabled:  true,
        })
      }
    }
    console.log(`  ✓ ${tenant.name} — all ${MODULES.length} modules enabled`)
  }

  // ── 3. Super-admin ──────────────────────────────────────────────────────
  console.log('\n👑 Super-admin...')
  const existingSA = await db.select({ id: superAdmins.id })
    .from(superAdmins).where(eq(superAdmins.email, SUPER_ADMIN.email))

  const saHash = await bcrypt.hash(SUPER_ADMIN.password, 12)
  if (existingSA.length > 0) {
    await db.update(superAdmins)
      .set({ passwordHash: saHash, name: SUPER_ADMIN.name, isActive: true })
      .where(eq(superAdmins.email, SUPER_ADMIN.email))
    console.log(`  ✓ Super-admin updated: ${SUPER_ADMIN.email}`)
  } else {
    await db.insert(superAdmins).values({
      email:        SUPER_ADMIN.email,
      passwordHash: saHash,
      name:         SUPER_ADMIN.name,
      isActive:     true,
    })
    console.log(`  ✓ Super-admin created: ${SUPER_ADMIN.email}`)
  }

  // ── 4. Director users per tenant ────────────────────────────────────────
  console.log('\n👔 Director accounts...')
  for (const t of TENANT_DEFS) {
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.tenantId, t.id), eq(users.email, t.directorEmail)))

    const hash = await bcrypt.hash(t.directorPass, 12)
    if (existing.length > 0) {
      await db.update(users)
        .set({ passwordHash: hash, role: 'director', isActive: true })
        .where(eq(users.id, existing[0].id))
      console.log(`  ✓ Director updated: ${t.directorEmail}`)
    } else {
      await db.insert(users).values({
        tenantId:     t.id,
        email:        t.directorEmail,
        passwordHash: hash,
        role:         'director',
        isActive:     true,
      })
      console.log(`  ✓ Director created: ${t.directorEmail}`)
    }
  }

  console.log(`
✅ Seed complete!

── Login Credentials ─────────────────────────────────────────
Super Admin   (superadmin-hrmsapp):
  Email:    ${SUPER_ADMIN.email}
  Password: ${SUPER_ADMIN.password}

Yahweh Care (yahwehcare-hrmsapp):
  Email:    ${TENANT_DEFS[0].directorEmail}
  Password: ${TENANT_DEFS[0].directorPass}
  URL:      https://yahwehcare-hrmsapp.vercel.app/login?tenant=yahweh-care

Yahweh Property Care (yahwehpc-hrmsapp):
  Email:    ${TENANT_DEFS[1].directorEmail}
  Password: ${TENANT_DEFS[1].directorPass}
  URL:      https://yahwehpc-hrmsapp.vercel.app/login?tenant=yahweh-property-care
──────────────────────────────────────────────────────────────
  `)
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
