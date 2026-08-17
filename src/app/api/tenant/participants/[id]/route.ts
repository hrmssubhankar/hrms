/**
 * GET    /api/tenant/participants/[id]  — get participant
 * PATCH  /api/tenant/participants/[id]  — update participant
 * DELETE /api/tenant/participants/[id]  — soft-delete (set isActive=false)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [row] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ participant: row })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  const [existing] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const editableFields = [
    'firstName', 'lastName', 'preferredName', 'ndisNumber', 'dateOfBirth',
    'address', 'phone', 'email', 'supportLevel', 'fundingBody',
    'planStartDate', 'planEndDate', 'notes', 'isActive',
  ] as const

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const f of editableFields) {
    if (f in body) updates[f] = body[f] ?? null
  }

  const [updated] = await db
    .update(participants)
    .set(updates)
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))
    .returning()

  return NextResponse.json({ participant: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard('participant_mgmt:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session
  const { id } = await params

  // Soft delete
  await db
    .update(participants)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(participants.id, id), eq(participants.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
