import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const statements = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS users_reset_token_idx ON users(password_reset_token) WHERE password_reset_token IS NOT NULL`,
]

async function migrate() {
  const { neon } = await import('@neondatabase/serverless')
  const url = process.env.DATABASE_URL
  if (!url || url.includes('placeholder')) { console.error('❌  DATABASE_URL missing'); process.exit(1) }
  const sql = neon(url)
  console.log(`Running ${statements.length} statements…\n`)
  for (const stmt of statements) {
    process.stdout.write(`  ${stmt.slice(0, 70)}… `)
    await sql(stmt)
    console.log('✓')
  }
  console.log('\n✅  Migration complete')
  process.exit(0)
}
migrate().catch(err => { console.error('❌', err.message); process.exit(1) })
