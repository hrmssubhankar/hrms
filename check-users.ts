import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL || ''
const sql = postgres(DATABASE_URL, { prepare: false })

const DEMO_TENANT_SLUG = 'demo'

const USERS = [
  { email: 'superadmin@yahwehhrms.com.au', password: 'SuperAdmin@2024', role: 'super_admin', tenantSlug: null },
  { email: 'director@demo.com', password: 'Director@2024', role: 'director', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'hr@demo.com', password: 'HROfficer@2024', role: 'hr_officer', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'compliance@demo.com', password: 'Manager@2024', role: 'compliance_manager', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'ops@demo.com', password: 'Manager@2024', role: 'operations_manager', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'teamlead@demo.com', password: 'TeamLead@2024', role: 'team_leader', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'payroll@demo.com', password: 'Payroll@2024', role: 'payroll_officer', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'employee@demo.com', password: 'Employee@2024', role: 'employee', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'contractor@demo.com', password: 'Contractor@2024', role: 'contractor', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'auditor@demo.com', password: 'Auditor@2024', role: 'auditor', tenantSlug: DEMO_TENANT_SLUG },
  { email: 'itadmin@demo.com', password: 'ItAdmin@2024', role: 'it_admin', tenantSlug: DEMO_TENANT_SLUG },
]

async function main() {
  console.log('Checking users...\n')
  const tenants = await sql`SELECT id, slug FROM hrms_tenants`
  const tenantMap: Record<string, string> = {}
  for (const t of tenants) tenantMap[t.slug] = t.id
  console.log('Tenants found:', Object.keys(tenantMap))

  const existing = await sql`SELECT email, role, tenant_id, is_active FROM hrms_users`
  const existingEmails = new Set(existing.map((u: any) => u.email))

  console.log('\nExisting users:')
  for (const u of existing) console.log(`  ✓ ${u.email} (${u.role}) active=${u.is_active}`)

  const missing = USERS.filter(u => !existingEmails.has(u.email))
  console.log(`\nMissing users (${missing.length}):`)
  for (const u of missing) console.log(`  ✗ ${u.email} (${u.role})`)

  if (missing.length === 0) {
    console.log('\nAll users already exist!')
    await sql.end()
    return
  }

  console.log('\nCreating missing users...')
  for (const u of missing) {
    const hash = await bcrypt.hash(u.password, 10)
    const tenantId = u.tenantSlug ? tenantMap[u.tenantSlug] : null
    await sql`INSERT INTO hrms_users (email, password_hash, role, tenant_id, is_active) VALUES (${u.email}, ${hash}, ${u.role}, ${tenantId}, true)`
    console.log(`  ✓ Created ${u.email} (${u.role})`)
  }

  console.log('\nDone!')
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
