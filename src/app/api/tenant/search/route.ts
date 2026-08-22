import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, documents, participants } from '@/lib/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ employees: [], documents: [], participants: [] })

  const tid = session.tenantId!
  const like = `%${q}%`
  const isRestricted = session.userRole === 'employee' || session.userRole === 'contractor'

  try {
    const [empRows, docRows, partRows] = await Promise.all([
      isRestricted ? Promise.resolve([]) : db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, email: employees.email, employeeNumber: employees.employeeNumber, isActive: employees.isActive }).from(employees).where(and(eq(employees.tenantId, tid), or(ilike(employees.firstName, like), ilike(employees.lastName, like), ilike(employees.email, like), ilike(employees.employeeNumber, like)))).limit(5),
      db.select({ id: documents.id, title: documents.title, category: documents.category, status: documents.status, employeeId: documents.employeeId }).from(documents).where(and(eq(documents.tenantId, tid), or(ilike(documents.title, like), ilike(documents.category, like)))).limit(5),
      isRestricted ? Promise.resolve([]) : db.select({ id: participants.id, firstName: participants.firstName, lastName: participants.lastName, ndisNumber: participants.ndisNumber, isActive: participants.isActive }).from(participants).where(and(eq(participants.tenantId, tid), or(ilike(participants.firstName, like), ilike(participants.lastName, like), ilike(participants.ndisNumber, like)))).limit(5),
    ])
    return NextResponse.json({ employees: empRows, documents: docRows, participants: partRows })
  } catch (err) {
    console.error('GET /api/tenant/search', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
