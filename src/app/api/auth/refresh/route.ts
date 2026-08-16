import { NextResponse } from 'next/server'
import { getSession, sessionCookieOptions } from '@/lib/auth/session'
import { signToken } from '@/lib/auth/jwt'

/**
 * GET /api/auth/refresh
 *
 * Silently issues a new 8-hour session token if the current token is still
 * valid. Returns 401 if the session is missing or already expired.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Re-sign with the same claims, fresh 8h window
  const { ...claims } = session
  const newToken = await signToken(claims as Parameters<typeof signToken>[0])

  const res = NextResponse.json({ ok: true })
  res.cookies.set(sessionCookieOptions(newToken))
  return res
}
