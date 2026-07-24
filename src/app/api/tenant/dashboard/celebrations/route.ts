/**
 * GET /api/tenant/dashboard/celebrations
 *
 * Returns employees with birthdays or work anniversaries in the next 7 days.
 * Managers/HR/director only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, positions } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

function dayOfYear(month: number, day: number) {
  return month * 100 + day
}

function upcomingDays(dateStr: string, today: Date, windowDays = 7): number | null {
  const d = new Date(dateStr)
  // Build a date in the current year with same month/day
  const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  let diff = Math.round((thisYear.getTime() - today.getTime()) / 86_400_000)
  // If already passed this year, check next year
  if (diff < 0) {
    const nextYear = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
    diff = Math.round((nextYear.getTime() - today.getTime()) / 86_400_000)
  }
  return diff <= windowDays ? diff : null
}

export async function GET(req: NextRequest) {
  const guard = await apiGuard('employees:read')
  if (guard.error) return guard.error
  const { session } = guard

  // Employees and contractors only visible to managers/HR/directors
  if (!hasPermission(session.userRole, 'employees:write')) {
    return NextResponse.json({ celebrations: [] })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      id:           employees.id,
      firstName:    employees.firstName,
      lastName:     employees.lastName,
      positionTitle: positions.title,
      dateOfBirth:  employees.dateOfBirth,
      startDate:    employees.startDate,
      photoUrl:     employees.photoUrl,
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(and(
      eq(employees.tenantId, session.tenantId),
      eq(employees.isActive, true),
    ))

  const celebrations: Array<{
    id: string; name: string; jobTitle: string | null; photoUrl: string | null
    type: 'birthday' | 'anniversary'; daysUntil: number; yearsCount?: number
  }> = []

  for (const emp of rows) {
    const name = `${emp.firstName} ${emp.lastName}`

    // Birthday
    if (emp.dateOfBirth) {
      const daysUntil = upcomingDays(emp.dateOfBirth, today)
      if (daysUntil !== null) {
        celebrations.push({ id: emp.id, name, jobTitle: emp.positionTitle, photoUrl: emp.photoUrl,
          type: 'birthday', daysUntil })
      }
    }

    // Work anniversary
    if (emp.startDate) {
      const daysUntil = upcomingDays(emp.startDate, today)
      if (daysUntil !== null) {
        const started  = new Date(emp.startDate)
        const yearsCount = today.getFullYear() - started.getFullYear()
        if (yearsCount > 0) {
          celebrations.push({ id: emp.id, name, jobTitle: emp.positionTitle, photoUrl: emp.photoUrl,
            type: 'anniversary', daysUntil, yearsCount })
        }
      }
    }
  }

  celebrations.sort((a, b) => a.daysUntil - b.daysUntil)

  return NextResponse.json({ celebrations })
}
