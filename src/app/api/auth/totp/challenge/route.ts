import { NextRequest, NextResponse } from 'next/server'
import { verifySync } from 'otplib'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken, signToken } from '@/lib/auth/jwt'
import { sessionCookieOptions } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/totp/challenge
 * Body: { tempToken, code }
 *
 * Called after password step when login returns requires2FA === true.
 * Validates the 6-digit TOTP code, then issues a full 8h session JWT.
 */
export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json()

    if (!tempToken || !code) {
      return NextResponse.json({ error: 'tempToken and code are required' }, { status: 400 })
    }

    // Verify the short-lived temp token — must carry phase: 'totp'
    const payload = await verifyToken(tempToken)
    if (!payload || payload.phase !== 'totp') {
      return NextResponse.json({ error: 'Invalid or expired challenge token' }, { status: 401 })
    }

    // Fetch the user's stored TOTP secret
    const [user] = await db
      .select({ id: users.id, totpSecret: users.totpSecret, totpEnabled: users.totpEnabled })
      .from(users)
      .where(eq(users.id, payload.sub))

    if (!user || !user.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ error: '2FA not configured for this account' }, { status: 400 })
    }

    const result = verifySync({ token: String(code), secret: user.totpSecret, strategy: 'totp' })
    if (!result.valid) {
      return NextResponse.json({ error: 'Invalid code — please try again' }, { status: 400 })
    }

    // Issue a full 8h session token (drop the phase claim)
    const { phase: _phase, ...sessionPayload } = payload
    const token = await signToken(sessionPayload)

    const redirectTo = payload.role === 'super_admin' ? '/super-admin' : '/tenant/dashboard'
    const res = NextResponse.json({ ok: true, role: payload.role, redirectTo })
    res.cookies.set(sessionCookieOptions(token))
    return res

  } catch (error) {
    console.error('TOTP challenge error:', error)
    return NextResponse.json({ error: 'Challenge failed' }, { status: 500 })
  }
}
