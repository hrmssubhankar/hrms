import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { diversityData, employees } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await db.select({
      id: diversityData.id, employeeId: diversityData.employeeId,
      gender: diversityData.gender, indigenousStatus: diversityData.indigenousStatus,
      disabilityStatus: diversityData.disabilityStatus,
      culturalBackground: diversityData.culturalBackground,
      adjustmentsRequired: diversityData.adjustmentsRequired,
      selfReported: diversityData.selfReported, createdAt: diversityData.createdAt,
      employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
    }).from(diversityData)
      .leftJoin(employees, eq(diversityData.employeeId, employees.id))
      .where(eq(diversityData.tenantId, session.tenantId))
      .orderBy(desc(diversityData.createdAt))

    // Aggregated summary
    const summary = {
      total: rows.length,
      byGender: rows.reduce<Record<string, number>>((acc, r) => {
        const g = r.gender ?? 'Not disclosed'
        acc[g] = (acc[g] ?? 0) + 1; return acc
      }, {}),
      indigenous:  rows.filter(r => r.indigenousStatus).length,
      disability:  rows.filter(r => r.disabilityStatus).length,
      adjustments: rows.filter(r => r.adjustmentsRequired).length,
    }

    return NextResponse.json({ records: rows, summary })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { employeeId, gender, indigenousStatus, disabilityStatus, culturalBackground, adjustmentsRequired } = await req.json()
    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    // Upsert via delete+insert (no onConflict in schema, use unique index)
    await db.delete(diversityData)
      .where(and(eq(diversityData.employeeId, employeeId), eq(diversityData.tenantId, session.tenantId)))
    const [record] = await db.insert(diversityData).values({
      tenantId: session.tenantId, employeeId,
      gender: gender || null, indigenousStatus: indigenousStatus ?? null,
      disabilityStatus: disabilityStatus ?? null, culturalBackground: culturalBackground || null,
      adjustmentsRequired: adjustmentsRequired || null, selfReported: true,
    }).returning()
    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
