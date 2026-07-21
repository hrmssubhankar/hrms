import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/totp/status
 * Returns { totpEnabled: boolean } for the logged-in tenant user.
 */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (session.role === 'super_admin') {
    // Super admin table has no TOTP columns — always false
    return NextResponse.json({ totpEnabled: false })
  }

  const [user] = await db
    .select({ totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, session.sub as string))

  return NextResponse.json({ totpEnabled: user?.totpEnabled ?? false })
}
