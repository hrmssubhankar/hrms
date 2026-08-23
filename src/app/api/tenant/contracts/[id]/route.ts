import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contracts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard('contracts:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.delete(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/tenant/contracts/[id]', err)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard('contracts:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await req.json()
    const { type, pdfUrl, superFund, tfnProvided, bankBsb, bankAccount, endDate, notes } = body

    const updates: Record<string, unknown> = {}
    if (type        !== undefined) updates.type        = type
    if (pdfUrl      !== undefined) updates.pdfUrl      = pdfUrl || null
    if (superFund   !== undefined) updates.superFund   = superFund || null
    if (tfnProvided !== undefined) updates.tfnProvided = tfnProvided
    if (bankBsb     !== undefined) updates.bankBsb     = bankBsb || null
    if (bankAccount !== undefined) updates.bankAccount = bankAccount || null
    if (endDate     !== undefined) updates.endDate     = endDate || null
    if (notes       !== undefined) updates.notes       = notes || null

    const [updated] = await db.update(contracts).set(updates)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, session.tenantId)))
      .returning()

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PUT /api/tenant/contracts/[id]', err)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}
