/**
 * Seed: Test Users — One per RBAC Role (YPC Tenant)
 *
 * Creates one user account for each tenant role so we can impersonate
 * them from the super-admin panel and test every module.
 *
 * Password for every user: Test@12345
 *
 * Run from your Mac terminal:
 *   node database/seeds/test_users.js
 *
 * Idempotent — ON CONFLICT DO NOTHING, so safe to re-run.
 */

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env.local') })

const sql = neon(process.env.DATABASE_URL)

const YPC = '00000000-0000-0000-0000-000000000002'
const PASSWORD = 'Test@12345'

// Hardcoded UUIDs so the script is idempotent across runs
const TEST_USERS = [
  { id: '00000000-0000-0000-0001-000000000001', role: 'director',            email: 'director@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000002', role: 'hr_officer',          email: 'hr@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000003', role: 'compliance_manager',  email: 'compliance@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000004', role: 'operations_manager',  email: 'operations@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000005', role: 'team_leader',         email: 'teamlead@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000006', role: 'payroll_officer',     email: 'payroll@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000007', role: 'employee',            email: 'employee@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000008', role: 'auditor',             email: 'auditor@test.yahwehpc.com' },
  { id: '00000000-0000-0000-0001-000000000009', role: 'it_admin',            email: 'itadmin@test.yahwehpc.com' },
]

async function run() {
  console.log('🔑 Hashing password...')
  const hash = await bcrypt.hash(PASSWORD, 10)

  console.log('👤 Inserting test users...')
  for (const u of TEST_USERS) {
    await sql`
      INSERT INTO users (id, tenant_id, email, password_hash, role, is_active)
      VALUES (
        ${u.id}::uuid,
        ${YPC}::uuid,
        ${u.email},
        ${hash},
        ${u.role},
        true
      )
      ON CONFLICT (tenant_id, email) DO UPDATE
        SET role = EXCLUDED.role, is_active = true
    `
    console.log(`  ✅  ${u.role.padEnd(22)} → ${u.email}`)
  }

  // ── Link test users to employee records ─────────────────────────────────
  // My-Profile / My-Payslips / My-Documents look up employees.user_id = session.sub
  // so each test user must be linked to an employee row.
  console.log('\n🔗 Linking test users to employee records...')

  // Link existing YPC demo employees (YPC-001 to YPC-006) to test user accounts
  const empUserLinks = [
    // employee_number  → test user UUID                           → label
    ['YPC-001', '00000000-0000-0000-0001-000000000001', 'director'],
    ['YPC-002', '00000000-0000-0000-0001-000000000002', 'hr_officer'],
    ['YPC-003', '00000000-0000-0000-0001-000000000003', 'compliance_manager'],
    ['YPC-004', '00000000-0000-0000-0001-000000000004', 'operations_manager'],
    ['YPC-005', '00000000-0000-0000-0001-000000000006', 'payroll_officer'],
    ['YPC-006', '00000000-0000-0000-0001-000000000007', 'employee'],
  ]
  for (const [empNum, userId, label] of empUserLinks) {
    await sql`
      UPDATE employees
         SET user_id = ${userId}::uuid
       WHERE tenant_id = ${YPC}::uuid
         AND employee_number = ${empNum}
    `
    console.log(`  ✅  ${label.padEnd(22)} → linked to ${empNum}`)
  }

  // Create new employee records for team_leader, auditor, it_admin
  // (no demo employee exists for these roles)
  const YPC_OPS_DEPT = 'a0000002-0000-0000-0000-000000000001'
  const YPC_COORD_POS = 'b0000002-0000-0000-0000-000000000003'

  const newEmps = [
    {
      id:     'c0000002-0000-0000-0000-000000000007',
      userId: '00000000-0000-0000-0001-000000000005',
      empNum: 'YPC-007',
      first:  'Alex',  last: 'Morgan',
      email:  'alex.morgan@yahwehpc.com.au',
      role:   'team_leader',
    },
    {
      id:     'c0000002-0000-0000-0000-000000000008',
      userId: '00000000-0000-0000-0001-000000000008',
      empNum: 'YPC-008',
      first:  'Jordan', last: 'Ellis',
      email:  'jordan.ellis@yahwehpc.com.au',
      role:   'auditor',
    },
    {
      id:     'c0000002-0000-0000-0000-000000000009',
      userId: '00000000-0000-0000-0001-000000000009',
      empNum: 'YPC-009',
      first:  'Sam',  last: 'Nguyen',
      email:  'sam.nguyen@yahwehpc.com.au',
      role:   'it_admin',
    },
  ]

  for (const e of newEmps) {
    await sql`
      INSERT INTO employees
        (id, tenant_id, employee_number, first_name, last_name, email,
         entity_name, department_id, position_id, employment_type,
         start_date, is_active, compliance_status, ndis_worker, user_id)
      VALUES (
        ${e.id}::uuid,
        ${YPC}::uuid,
        ${e.empNum},
        ${e.first},
        ${e.last},
        ${e.email},
        'Yahweh Property Care Pty Ltd',
        ${YPC_OPS_DEPT}::uuid,
        ${YPC_COORD_POS}::uuid,
        'full_time',
        CURRENT_DATE,
        true,
        'green',
        false,
        ${e.userId}::uuid
      )
      ON CONFLICT (tenant_id, employee_number) DO UPDATE
        SET user_id = EXCLUDED.user_id
    `
    console.log(`  ✅  ${e.role.padEnd(22)} → created ${e.empNum} (${e.first} ${e.last})`)
  }

  console.log('✅  Employee linking complete.\n')

  // Print a summary table for the impersonation session
  console.log('\n' + '─'.repeat(70))
  console.log('Test Users Created — copy these IDs for impersonation\n')
  console.log('Role'.padEnd(24) + 'Email'.padEnd(36) + 'User ID')
  console.log('─'.repeat(70))
  for (const u of TEST_USERS) {
    console.log(u.role.padEnd(24) + u.email.padEnd(36) + u.id)
  }
  console.log('─'.repeat(70))
  console.log(`\nPassword for all: ${PASSWORD}`)
  console.log('Tenant ID (YPC):  ' + YPC)
  console.log('\n✅ Done.\n')
}

run().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
