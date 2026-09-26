import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { db } from '@/lib/db'
import { superFunds } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/tenant/superannuation — list super funds for a given employee
export async function GET(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
  }

  const funds = await db
    .select()
    .from(superFunds)
    .where(and(
      eq(superFunds.tenantId, session.tenantId),
      eq(superFunds.employeeId, employeeId),
    ))
    .orderBy(desc(superFunds.isPrimary), desc(superFunds.createdAt))

  return NextResponse.json({ funds })
}

// POST /api/tenant/superannuation — create a super fund nomination
export async function POST(req: NextRequest) {
  const { error, session } = await apiGuard('superannuation:write')
  if (error) return error

  const {
    employeeId, fundName, fundAbn, usi, memberNumber, isSmsf,
    smsfBankBsb, smsfBankAccount, smsfEsa, status, isPrimary,
    effectiveFrom, effectiveTo, source, verifiedAt, verifiedBy, notes,
  } = await req.json()

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
  }
  if (!fundName) {
    return NextResponse.json({ error: 'fundName required' }, { status: 400 })
  }

  // If new fund is primary, un-primary existing ones
  if (isPrimary) {
    await db
      .update(superFunds)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(and(
        eq(superFunds.tenantId, session.tenantId),
        eq(superFunds.employeeId, employeeId),
      ))
  }

  const [fund] = await db
    .insert(superFunds)
    .values({
      tenantId: session.tenantId,
      employeeId,
      fundName,
      ...(fundAbn        !== undefined && { fundAbn }),
      ...(usi            !== undefined && { usi }),
      ...(memberNumber   !== undefined && { memberNumber }),
      ...(isSmsf         !== undefined && { isSmsf }),
      ...(smsfBankBsb    !== undefined && { smsfBankBsb }),
      ...(smsfBankAccount !== undefined && { smsfBankAccount }),
      ...(smsfEsa        !== undefined && { smsfEsa }),
      ...(status         !== undefined && { status }),
      ...(isPrimary      !== undefined && { isPrimary }),
      ...(effectiveFrom  !== undefined && { effectiveFrom }),
      ...(effectiveTo    !== undefined && { effectiveTo }),
      ...(source         !== undefined && { source }),
      ...(verifiedAt     !== undefined && { verifiedAt }),
      ...(verifiedBy     !== undefined && { verifiedBy }),
      ...(notes          !== undefined && { notes }),
    })
    .returning()

  return NextResponse.json({ fund }, { status: 201 })
}
