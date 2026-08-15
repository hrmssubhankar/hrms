import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Convert Npgsql/ADO.NET connection string to a standard PostgreSQL URL.
// Railway injects DATABASE_URL at build time; if it is in .NET format
// (Host=...;Port=...;Username=...) neon() rejects it.  This helper normalises
// it so both formats are accepted.
function toPostgresUrl(raw: string): string {
  if (!raw) return 'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder'
    if (raw.startsWith('postgresql://') || raw.startsWith('postgres://')) return raw

      // Parse key=value pairs separated by semicolons (Npgsql format)
        const params: Record<string, string> = {}
          raw.split(';').forEach(part => {
              const idx = part.indexOf('=')
                  if (idx > 0) {
                        const key = part.substring(0, idx).trim().toLowerCase()
                              const value = part.substring(idx + 1).trim()
                                    params[key] = value
                                        }
                                          })

                                            const host = params['host'] || params['server'] || ''
                                              const port = params['port'] || '5432'
                                                const database = params['database'] || 'postgres'
                                                  const username = encodeURIComponent(params['username'] || params['user id'] || params['userid'] || 'postgres')
                                                    const password = encodeURIComponent(params['password'] || '')
                                                      const ssl = (params['ssl mode'] || params['sslmode'] || '').toLowerCase()
                                                        const sslParam = ssl === 'require' || ssl === 'verify-full' ? '?sslmode=require' : ''

                                                          return `postgresql://${username}:${password}@${host}:${port}/${database}${sslParam}`
                                                          }

                                                          const connectionString = toPostgresUrl(process.env.DATABASE_URL || '')
                                                          const sql = neon(connectionString)

                                                          export const db = drizzle(sql, { schema })

                                                          export { sql }
                                                          