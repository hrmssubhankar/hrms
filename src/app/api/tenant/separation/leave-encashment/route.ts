/**
 * Leave Encashment on Termination
 *
 * POST /api/tenant/separation/leave-encashment
 *   Calculates and records the annual leave payout for a terminating permanent
 *   employee (full-time or part-time). Per Yahweh Care policy:
 *     - Only permanent (full_time / part_time) employees receive a payout
 *     - Unused accrued annual leave is paid at 117.5% of ordinary hourly rate
 *       (ordinary rate + 17.5% annual leave loading, per NES / modern awards)
 *     - Casual employees and contractors have no accrued annual leave and are
 *       excluded from this calculation
 *
 * GET /api/tenant/separation/leave-encashment?separationId=...
 *   Returns the recorded encashment for an existing separation record.
 *
 * Accrual calculation (anniversary-based, matching leave/balance route):
 *   accrued hours = (annualEntitlementHours × daysElapsedInLeaveYear / daysInLeaveYear)
 *                   − hoursAlreadyTaken
 *   payout        = max(0, accruedHours) × hourlyRate × 1.175
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, leaveRequests, separationRecords } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

// NES annual leave entitlement for a full-time employee (hours per year)
// 4 weeks × 38 ordinary hours = 152 hours
const ANNUAL_LEAVE_HOURS_FT = 152

// Annual leave loading rate (17.5%)
const LEAVE_LOADING_RATE = 0.175

// Employment types eligible for a leave payout on termination
const ELIGIBLE_TYPES = ['full_time', 'part_time']

// Leave request types that draw from the annual leave balance
const ANNUAL_LEAVE_TYPES = ['annual', 'long_service']

/** Date helpers */
function leaveYearStartFor(startDate: Date, asOf: Date): Date {
  const ann = new Date(startDate)
  ann.setFullYear(asOf.getFullYear())
  if (ann > asOf) ann.setFullYear(asOf.getFullYear() - 1)
  return ann
}

function addOneYear(d: Date): Date {
  const x = new Date(d)
  x.setFullYear(x.getFullYear() + 1)
  return x
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── GET — retrieve existing encashment for a separation ────────────────────

export async function GET(req: NextRequest) {
  const guard = await apiGuard('separation:read')
  if (guard.error) return guard.error
  const { session } = guard

  const separationId = req.nextUrl.searchParams.get('separationId')
  if (!separationId) {
    return NextResponse.json({ error: 'separationId is required' }, { status: 400 })
  }

  // Load separation record (tenant-scoped)
  const [sep] = await db
    .select()
    .from(separationRecords)
    .where(and(
      eq(separationRecords.id, separationId),
      eq(separationRecords.tenantId, session.tenantId),
    ))
    .limit(1)

  if (!sep) {
    return NextResponse.json({ error: 'Separation record not found' }, { status: 404 })
  }

  // Build the encashment calculation inline (no extra table required)
  const result = await computeEncashment(sep.employeeId, sep.lastWorkingDay, session.tenantId)
  return NextResponse.json({ separationId, ...result })
}

// ─── POST — calculate (and optionally confirm) encashment ────────────────────

export async function POST(req: NextRequest) {
  const guard = await apiGuard('separation:write')
  if (guard.error) return guard.error
  const { session } = guard

  const { separationId, confirm } = await req.json()

  if (!separationId) {
    return NextResponse.json({ error: 'separationId is required' }, { status: 400 })
  }

  // Load separation record
  const [sep] = await db
    .select()
    .from(separationRecords)
    .where(and(
      eq(separationRecords.id, separationId),
      eq(separationRecords.tenantId, session.tenantId),
    ))
    .limit(1)

  if (!sep) {
    return NextResponse.json({ error: 'Separation record not found' }, { status: 404 })
  }

  const result = await computeEncashment(sep.employeeId, sep.lastWorkingDay, session.tenantId)

  if (!result.eligible) {
    return NextResponse.json({
      separationId,
      ...result,
      message: 'Employee is not eligible for annual leave encashment (casual / contractor).',
    })
  }

  // If caller confirms, record an event in separationEvents for audit trail
  if (confirm) {
    const { separationEvents } = await import('@/lib/db/schema')
    await db.insert(separationEvents).values({
      tenantId:    session.tenantId,
      separationId,
      event:       'leave_encashment_calculated',
      note: [
        `Annual leave payout calculated on termination.`,
        `Accrued: ${result.accruedHours} h  |  Used: ${result.usedHours} h  |  Remaining: ${result.remainingHours} h`,
        `Ordinary rate: $${result.hourlyRate}/h  |  Loading: 17.5%`,
        `Total payout (incl. loading): $${result.payoutAmount}`,
      ].join('\n'),
      performedBy: session.email,
    })
  }

  return NextResponse.json({
    separationId,
    confirmed: !!confirm,
    ...result,
  }, { status: confirm ? 201 : 200 })
}

// ─── Core calculation ────────────────────────────────────────────────────────

async function computeEncashment(
  employeeId: string,
  lastWorkingDay: string | null,
  tenantId: string,
) {
  // Load employee
  const [emp] = await db
    .select({
      id:                   employees.id,
      firstName:            employees.firstName,
      lastName:             employees.lastName,
      employmentType:       employees.employmentType,
      startDate:            employees.startDate,
      ordinaryHoursPerWeek: employees.ordinaryHoursPerWeek,
      hourlyRate:           employees.hourlyRate,
    })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
    .limit(1)

  if (!emp) {
    return { eligible: false, reason: 'Employee record not found.' }
  }

  // Eligibility check — only permanent employees receive a payout
  if (!ELIGIBLE_TYPES.includes(emp.employmentType)) {
    return {
      eligible:       false,
      employmentType: emp.employmentType,
      reason:         `${emp.employmentType} employees do not accrue annual leave.`,
      firstName:      emp.firstName,
      lastName:       emp.lastName,
      accruedHours:   0,
      usedHours:      0,
      remainingHours: 0,
      hourlyRate:     0,
      ordinaryRate:   0,
      loadingAmount:  0,
      payoutAmount:   0,
    }
  }

  if (!emp.startDate) {
    return { eligible: false, reason: 'Employee has no start date recorded.' }
  }

  // Use lastWorkingDay as the "as of" date for accrual; default to today
  const asOf      = lastWorkingDay ? new Date(lastWorkingDay + 'T00:00:00') : new Date()
  const startDate = new Date(emp.startDate + 'T00:00:00')

  // Leave year anchored to work anniversary
  const lyStart    = leaveYearStartFor(startDate, asOf)
  const lyEnd      = addOneYear(lyStart)
  const daysInYear = daysBetween(lyStart, lyEnd)
  const daysElapsed = Math.min(daysBetween(lyStart, asOf), daysInYear)

  // Pro-rate for part-time
  const hoursPerWeek = Number(emp.ordinaryHoursPerWeek ?? 38)
  const fteRatio     = Math.min(hoursPerWeek / 38, 1)

  // Accrued hours in current leave year (proportional to days elapsed)
  const annualEntitlementHours = ANNUAL_LEAVE_HOURS_FT * fteRatio
  const accruedHours = +(annualEntitlementHours * (daysElapsed / daysInYear)).toFixed(4)

  // Fetch approved leave taken in the current leave year
  const lyStartStr = isoDate(lyStart)
  const lyEndStr   = isoDate(new Date(lyEnd.getTime() - 86_400_000)) // inclusive

  const takenRows = await db
    .select({ totalDays: leaveRequests.totalDays })
    .from(leaveRequests)
    .where(and(
      eq(leaveRequests.tenantId,   tenantId),
      eq(leaveRequests.employeeId, employeeId),
      inArray(leaveRequests.status, ['approved']),
      inArray(leaveRequests.leaveType, ANNUAL_LEAVE_TYPES as ('annual' | 'long_service')[]),
      gte(leaveRequests.startDate, lyStartStr),
      lte(leaveRequests.startDate, lyEndStr),
    ))

  // Convert taken days → hours (each leave "day" = hoursPerWeek / 5 ordinary hours)
  const hoursPerDay = hoursPerWeek / 5
  const usedHours   = +takenRows
    .reduce((sum, r) => sum + (r.totalDays ?? 0) * hoursPerDay, 0)
    .toFixed(4)

  const remainingHours = +Math.max(0, accruedHours - usedHours).toFixed(4)

  // Payout calculation
  const hourlyRate   = Number(emp.hourlyRate ?? 0)
  const ordinaryPay  = +(remainingHours * hourlyRate).toFixed(2)
  const loadingAmount = +(ordinaryPay * LEAVE_LOADING_RATE).toFixed(2)
  const payoutAmount  = +(ordinaryPay + loadingAmount).toFixed(2)   // = ordinaryPay × 1.175

  return {
    eligible:       true,
    firstName:      emp.firstName,
    lastName:       emp.lastName,
    employmentType: emp.employmentType,
    fteRatio,
    hoursPerWeek,
    startDate:      emp.startDate,
    lastWorkingDay: lastWorkingDay ?? isoDate(new Date()),
    leaveYearStart: lyStartStr,
    leaveYearEnd:   lyEndStr,
    daysElapsed,
    daysInYear,
    // Accrual
    annualEntitlementHours: +annualEntitlementHours.toFixed(4),
    accruedHours,
    usedHours,
    remainingHours,
    // Payout
    hourlyRate,
    hoursPerDay,
    ordinaryPay,
    leaveLoadingRate:  LEAVE_LOADING_RATE,
    loadingAmount,
    payoutAmount,
    // Human-readable breakdown
    breakdown: {
      formula:   'payoutAmount = remainingHours × hourlyRate × 1.175',
      example:   `${remainingHours} h × $${hourlyRate} × 1.175 = $${payoutAmount}`,
    },
  }
}
