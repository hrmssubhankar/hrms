import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// For Vercel serverless: disable prefetch (required for transaction pooler).
// max:1 ensures each cold-start lambda opens exactly ONE connection so we
// don't exhaust Neon's 15-connection session-mode pool across three deployments.
const client = postgres(connectionString, { prepare: false, max: 1 })

export const db = drizzle(client, { schema })

// Keep sql export for any raw queries (noop client for compatibility)
export const sql = client
