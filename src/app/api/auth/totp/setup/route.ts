import { NextRequest, NextResponse } from 'next/server'
import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const ISSUER = 'Yahweh HRMS'

/**
 * GET /api/auth/totp/setup
 * Generate a new TOTP secret + QR code for the logged-in tenant user.
 * Does NOT enable 2FA yet — user must verify a code first (POST).
 */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (session.role === 'super_admin') {
    return NextResponse.json({ error: '2FA setup is available for tenant users only' }, { status: 403 })
  }

  const secret  = generateSecret()
  const otpauth = generateURI({ issuer: ISSUER, label: session.email, secret })
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

  return NextResponse.json({ secret, qrCodeDataUrl })
}

/**
 * POST /api/auth/totp/setup
 * Body: { secret, code }
 * Verifies the 6-digit code against the provided secret.
 * On success saves secret and enables 2FA.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (session.role === 'super_admin') {
    return NextResponse.json({ error: '2FA setup is available for tenant users only' }, { status: 403 })
  }

  const { secret, code } = await req.json()

  if (!secret || !code) {
    return NextResponse.json({ error: 'secret and code are required' }, { status: 400 })
  }

  const result = verifySync({ token: String(code), secret, strategy: 'totp' })
  if (!result.valid) {
    return NextResponse.json({ error: 'Invalid code — please try again' }, { status: 400 })
  }

  await db.update(users)
    .set({ totpSecret: secret, totpEnabled: true })
    .where(eq(users.id, session.sub as string))

  return NextResponse.json({ ok: true, message: '2FA enabled successfully' })
}
