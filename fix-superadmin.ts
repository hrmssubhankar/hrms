import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const sql = postgres(process.env.DATABASE_URL || '', { prepare: false })

async function main() {
  await sql`ALTER TABLE hrms_users ALTER COLUMN tenant_id DROP NOT NULL`
  console.log('Made tenant_id nullable')
  const hash = await bcrypt.hash('SuperAdmin@2024', 10)
  await sql`INSERT INTO hrms_users (email, password_hash, role, tenant_id, is_active) VALUES ('superadmin@yahwehhrms.com.au', ${hash}, 'super_admin', null, true)`
  console.log('Created superadmin@yahwehhrms.com.au')
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
