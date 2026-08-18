/**
 * GET  /api/tenant/roster-shifts/swap-requests
 * POST /api/tenant/roster-shifts/swap-requests
 * PATCH /api/tenant/roster-shifts/swap-requests (approve/decline)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shiftSwapRequests, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const guard = await apiGuard('roster_shifts:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const rows = await db
    .select({
      id:            shiftSwapRequests.id,
      shiftId:       shiftSwapRequests.shiftId,
      requestedById: shiftSwapRequests.requestedById,
      swapWithId:    shiftSwapRequests.swapWithId,
      reason:        shiftSwapRequests.reason,
      status:        shiftSwapRequests.status,
      reviewedBy:    shiftSwapRequests.reviewedBy,
      reviewedAt:    shiftSwapRequests.reviewedAt,
      reviewNotes:   shiftSwapRequests.reviewNotes,
      createdAt:     shiftSwapRequests.createdAt,
      requesterFirst: employees.firstName,
      requesterLast:  employees.lastName,
    })
    .from(shiftSwapRequests)
    .leftJoin(employees, eq(shiftSwapRequests.requestedById, employees.id))
    .where(eq(shiftSwapRequests.tenantId, tenantId))
    .orderBy(desc(shiftSwapRequests.createdAt))

  return NextResponse.json({ swapRequests: rows })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { shiftId, requestedById, swapWithId, reason } = await req.json()
  if (!shiftId || !requestedById)
    return NextResponse.json({ error: 'shiftId and requestedById are required' }, { status: 400 })

  const [created] = await db.insert(shiftSwapRequests).values({
    tenantId,
    shiftId,
    requestedById,
    swapWithId: swapWithId || null,
    reason:     reason     || null,
    status:     'pending',
  }).returning()

  return NextResponse.json({ swapRequest: created }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard('roster_shifts:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const { id, status, reviewNotes } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })

  const [updated] = await db.update(shiftSwapRequests)
    .set({
      status,
      reviewedBy:  email,
      reviewedAt:  new Date(),
      reviewNotes: reviewNotes || null,
    })
    .where(and(eq(shiftSwapRequests.id, id), eq(shiftSwapRequests.tenantId, tenantId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  return NextResponse.json({ swapRequest: updated })
}
