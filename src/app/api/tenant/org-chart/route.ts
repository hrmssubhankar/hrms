import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, departments, positions } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export type OrgEmployee = {
  id: string
  firstName: string
  lastName: string
  preferredName: string | null
  email: string
  managerId: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionTitle: string | null
  isActive: boolean
  complianceStatus: string
  employmentType: string
}

export type OrgNode = OrgEmployee & {
  children: OrgNode[]
}

// GET /api/tenant/org-chart
export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  // Restrict employees/contractors from org chart
  if (session.userRole === 'employee' || session.userRole === 'contractor') {
    return NextResponse.json({ error: 'Access restricted.' }, { status: 403 })
  }

  try {
    const rows = await db
      .select({
        id:               employees.id,
        firstName:        employees.firstName,
        lastName:         employees.lastName,
        preferredName:    employees.preferredName,
        email:            employees.email,
        managerId:        employees.managerId,
        departmentId:     employees.departmentId,
        positionId:       employees.positionId,
        isActive:         employees.isActive,
        complianceStatus: employees.complianceStatus,
        employmentType:   employees.employmentType,
        departmentName:   departments.name,
        positionTitle:    positions.title,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions,   eq(employees.positionId,   positions.id))
      .where(and(
        eq(employees.tenantId, session.tenantId!),
        eq(employees.isActive, true),
      ))
      .orderBy(employees.lastName, employees.firstName)

    // Build tree
    const map = new Map<string, OrgNode>()
    for (const row of rows) {
      map.set(row.id, { ...row, children: [] })
    }

    const roots: OrgNode[] = []
    for (const node of map.values()) {
      if (node.managerId && map.has(node.managerId)) {
        map.get(node.managerId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    // Collect all unique departments for filter
    const deptSet = new Map<string, string>()
    for (const row of rows) {
      if (row.departmentId && row.departmentName) {
        deptSet.set(row.departmentId, row.departmentName)
      }
    }
    const allDepartments = Array.from(deptSet.entries()).map(([id, name]) => ({ id, name }))

    return NextResponse.json({ tree: roots, allDepartments, total: rows.length })
  } catch (err) {
    console.error('GET /api/tenant/org-chart', err)
    return NextResponse.json({ error: 'Failed to fetch org chart' }, { status: 500 })
  }
}
