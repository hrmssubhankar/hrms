/**
 * POST /api/tenant/payroll/bulk
 *
 * Create pay runs for multiple employees in one request.
 * Each employee must have annualSalary or hourlyRate set.
 * Returns a summary of created / skipped / failed records.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, payrollRecords } from '@/lib/db/schema'
import { eq, and, isNotNull, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { calculatePayroll, grossFromSalary, grossFromHours, type PayFrequency } from '@/lib/payroll/calculator'
import { notifyRole } from '@/lib/notifications/notify'

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const {
      periodStart,
      periodEnd,
      frequency = 'fortnightly' as PayFrequency,
      allowances = 0,
      deductions = 0,
      employeeIds, // optional — if omitted, runs for ALL active salaried employees
    } = body

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
    }

    // Fetch target employees
    const conditions = [
      eq(employees.tenantId, session.tenantId),
      eq(employees.isActive, true),
      or(isNotNull(employees.annualSalary), isNotNull(employees.hourlyRate))!,
    ]

    const allEmployees = await db
      .select({
        id:           employees.id,
        firstName:    employees.firstName,
        lastName:     employees.lastName,
        email:        employees.email,
        annualSalary: employees.annualSalary,
        hourlyRate:   employees.hourlyRate,
      })
      .from(employees)
      .where(and(...conditions))

    const targets = employeeIds?.length
      ? allEmployees.filter(e => employeeIds.includes(e.id))
      : allEmployees

    if (targets.length === 0) {
      return NextResponse.json({
        summary: { total: 0, created: 0, skipped: 0, failed: 0 },
        results: [],
        message: 'No eligible employees found. Ensure employees have an annual salary or hourly rate set.',
      })
    }

    const results: Array<{
      employeeId: string
      name: string
      status: 'created' | 'skipped' | 'failed'
      reason?: string
      netPay?: number
    }> = []

    for (const emp of targets) {
      try {
        let grossPay: number

        if (emp.annualSalary) {
          grossPay = grossFromSalary(Number(emp.annualSalary), frequency)
        } else if (emp.hourlyRate) {
          // For hourly employees in bulk, use standard period hours
          const hoursMap: Record<PayFrequency, number> = {
            weekly: 38, fortnightly: 76, monthly: 164, annually: 1976,
          }
          grossPay = grossFromHours(hoursMap[frequency as PayFrequency] ?? 76, Number(emp.hourlyRate))
        } else {
          results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: 'skipped', reason: 'No salary or hourly rate set' })
          continue
        }

        const breakdown = calculatePayroll({ grossPay, frequency: frequency as PayFrequency, allowances, deductions })

        await db.insert(payrollRecords).values({
          tenantId:          session.tenantId,
          employeeId:        emp.id,
          periodStart,
          periodEnd,
          hoursWorked:       emp.hourlyRate ? String(emp.annualSalary ? null : (frequency === 'weekly' ? 38 : frequency === 'monthly' ? 164 : 76)) : null,
          hourlyRate:        emp.hourlyRate  ? String(emp.hourlyRate)  : null,
          grossPay:          String(breakdown.grossPay),
          paygWithholding:   String(breakdown.paygWithholding),
          medicareLevy:      String(breakdown.medicareLevy),
          superContribution: String(breakdown.superContribution),
          netPay:            String(breakdown.netPay),
          payslipData:       { ...breakdown, frequency, allowances, deductions },
          status:            'pending',
        })

        results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: 'created', netPay: breakdown.netPay })
      } catch (err: any) {
        results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: 'failed', reason: err.message })
      }
    }

    const created  = results.filter(r => r.status === 'created').length
    const skipped  = results.filter(r => r.status === 'skipped').length
    const failed   = results.filter(r => r.status === 'failed').length
    const totalNet = results.filter(r => r.status === 'created').reduce((s, r) => s + (r.netPay ?? 0), 0)

    if (created > 0) {
      notifyRole(session.tenantId, ['director', 'payroll_officer'], {
        type:  'payroll',
        title: `Bulk pay run complete — ${created} record${created > 1 ? 's' : ''} created`,
        body:  `Period: ${periodStart} → ${periodEnd}. Total net: $${totalNet.toFixed(2)}. ${skipped > 0 ? `${skipped} skipped.` : ''}`,
        link:  '/tenant/payroll',
      })
    }

    return NextResponse.json({
      summary: { total: targets.length, created, skipped, failed, totalNet: totalNet.toFixed(2) },
      results,
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/payroll/bulk', err)
    return NextResponse.json({ error: 'Bulk pay run failed' }, { status: 500 })
  }
}
