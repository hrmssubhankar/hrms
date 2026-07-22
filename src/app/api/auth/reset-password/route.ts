import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 *
 * Validates token (must not be expired), hashes new password, clears token.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 422 })
    }

    const now = new Date()

    const [user] = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpiry, now),
        )
      )
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken:  null,
        passwordResetExpiry: null,
        passwordChangedAt:   new Date(),
        updatedAt:           new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password:', err)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Validates token without consuming it — used by the UI to show "link valid/expired" state.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpiry, new Date()),
      )
    )
    .limit(1)

  return NextResponse.json({ valid: Boolean(user) })
}
