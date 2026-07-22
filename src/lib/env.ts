/**
 * env.ts — startup environment variable validation.
 *
 * Import this at the top of any server-side entry point that needs validated env vars.
 * In Next.js App Router, import from src/lib/db/index.ts or a root layout server component.
 *
 * Usage:
 *   import '@/lib/env'   // throws at startup if required vars are missing
 */

type EnvVar = {
  key:      string
  required: boolean
  secret?:  boolean   // mask value in logs
  validate?: (v: string) => boolean
  hint?:    string
}

const VARS: EnvVar[] = [
  // Core
  { key: 'DATABASE_URL',        required: true,  secret: true,  validate: v => v.startsWith('postgres'),       hint: 'Should start with "postgres"' },
  { key: 'JWT_SECRET',          required: true,  secret: true,  validate: v => v.length >= 32,                  hint: 'Must be at least 32 characters' },
  { key: 'NEXTAUTH_SECRET',     required: false, secret: true },

  // Email
  { key: 'RESEND_API_KEY',      required: false, secret: true,  validate: v => v.startsWith('re_'),             hint: 'Should start with "re_"' },
  { key: 'RESEND_FROM',         required: false },

  // Vercel
  { key: 'VERCEL_API_TOKEN',    required: false, secret: true },
  { key: 'VERCEL_TEAM_ID',      required: false },

  // MYOB
  { key: 'MYOB_CLIENT_ID',      required: false },
  { key: 'MYOB_CLIENT_SECRET',  required: false, secret: true },

  // App
  { key: 'APP_URL',             required: false, validate: v => v.startsWith('http'), hint: 'Should start with "http"' },
  { key: 'NEXT_PUBLIC_TENANT_SLUG', required: false },
]

function validateEnv(): void {
  const errors: string[] = []
  const warnings: string[] = []

  for (const v of VARS) {
    const val = process.env[v.key]

    if (!val) {
      if (v.required) {
        errors.push(`  ❌  ${v.key} — MISSING (required)`)
      } else {
        warnings.push(`  ⚠️   ${v.key} — not set (optional)`)
      }
      continue
    }

    if (v.validate && !v.validate(val)) {
      const msg = v.hint ? `${v.hint}` : 'failed validation'
      if (v.required) {
        errors.push(`  ❌  ${v.key} — INVALID: ${msg}`)
      } else {
        warnings.push(`  ⚠️   ${v.key} — invalid: ${msg}`)
      }
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('[env] Optional env vars not configured:\n' + warnings.join('\n'))
  }

  if (errors.length > 0) {
    throw new Error(
      `[env] Missing or invalid required environment variables:\n${errors.join('\n')}\n\n` +
      'Set these in your .env.local file or Vercel environment settings before starting.'
    )
  }
}

// Run once at module load time (server-side only)
if (typeof window === 'undefined') {
  validateEnv()
}

/** Re-export so this file is treated as a module by TypeScript */
export { validateEnv }
