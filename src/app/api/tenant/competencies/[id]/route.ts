import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { competencies, competencyAssessments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// DELETE /api/tenant/competencies/[id]
// Deletes a competency or assessment depending on what's found
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await apiGuard('competencies:write')
  if (error) return error

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'competency' | 'assessment'

  if (type === 'assessment') {
    const [deleted] = await db
      .delete(competencyAssessments)
      .where(and(eq(competencyAssessments.id, id), eq(competencyAssessments.tenantId, session.tenantId)))
      .returning()
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  // Default: delete competency
  const [deleted] = await db
    .delete(competencies)
    .where(and(eq(competencies.id, id), eq(competencies.tenantId, session.tenantId)))
    .returning()

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
