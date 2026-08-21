import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// For Vercel serverless: disable prefetch as it is not supported for transaction pooler
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

// Keep sql export for any raw queries (noop client for compatibility)
export const sql = client
