import { NextRequest, NextResponse } from 'next/server'
import { verifySync } from 'otplib'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/totp/disable
 * Body: { code }
 *
 * Verifies the current TOTP code then clears totpSecret + sets totpEnabled=false.
 * Requires a full session token (not a temp/challenge token).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (session.phase === 'totp') {
    return NextResponse.json({ error: 'Complete 2FA login before disabling it' }, { status: 401 })
  }

  if (session.role === 'super_admin') {
    return NextResponse.json({ error: '2FA management is available for tenant users only' }, { status: 403 })
  }

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

  const [user] = await db
    .select({ id: users.id, totpSecret: users.totpSecret, totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, session.sub as string))

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: '2FA is not enabled on this account' }, { status: 400 })
  }

  const result = verifySync({ token: String(code), secret: user.totpSecret, strategy: 'totp' })
  if (!result.valid) {
    return NextResponse.json({ error: 'Invalid code — please try again' }, { status: 400 })
  }

  await db.update(users)
    .set({ totpSecret: null, totpEnabled: false })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true, message: '2FA disabled successfully' })
}
