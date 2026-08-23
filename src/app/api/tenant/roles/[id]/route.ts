import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// DELETE — remove a portal user (warns caller that this also removes role access)
export async function DELETE(_: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('roles:write')
  if (guard.error) return guard.error
  const { session } = guard

  const { id } = await ctx.params

  // Prevent self-deletion
  if (id === session.sub) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  try {
    const deleted = await db.delete(users)
      .where(and(eq(users.id, id), eq(users.tenantId, session.tenantId)))
      .returning({ email: users.email })

    if (!deleted.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Roles DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
