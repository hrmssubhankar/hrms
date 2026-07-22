import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'


// Use || (not ??) so an empty string DATABASE_URL also falls back to the placeholder.
// neon() validates the connection string format at import time — the fallback
// is only used during Vercel's build phase (no DB calls happen then).
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder'
const sql = neon(connectionString)

export const db = drizzle(sql, { schema })

export { sql }
