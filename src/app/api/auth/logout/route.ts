import { NextResponse } from 'next/server'
import { clearCookieOptions, getSession } from '@/lib/auth/session'

export async function POST() {
  // Clear the session cookie regardless of auth state (idempotent logout),
  // but return 401 if there was no active session so callers can distinguish.
  const session = await getSession()
  const res = NextResponse.json(
    session ? { ok: true } : { ok: false, error: 'No active session' },
    { status: session ? 200 : 401 }
  )
  res.cookies.set(clearCookieOptions())
  return res
}
