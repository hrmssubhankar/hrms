import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

type Ctx = { params: Promise<{ id: string; noteId: string }> }

// DELETE /api/tenant/employees/[id]/notes/[noteId]
export async function DELETE(_: NextRequest, ctx: Ctx) {
  const guard = await apiGuard('employees:write')
  if (guard.error) return guard.error
  const { session } = guard
  const { noteId } = await ctx.params

  const [note] = await db
    .select()
    .from(employeeNotes)
    .where(and(eq(employeeNotes.id, noteId), eq(employeeNotes.tenantId, session.tenantId!)))

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  await db.delete(employeeNotes).where(eq(employeeNotes.id, noteId))

  return NextResponse.json({ ok: true })
}
