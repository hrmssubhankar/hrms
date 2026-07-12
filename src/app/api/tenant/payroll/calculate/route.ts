/**
 * POST /api/tenant/payroll/calculate
 *
 * On-the-fly payroll calculation. Does NOT save to DB.
 * Call this to preview a pay run before confirming.
 */
import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'
import { calculatePayroll, grossFromHours, grossFromSalary, type PayFrequency } from '@/lib/payroll/calculator'

export async function POST(req: NextRequest) {
  const guard = await apiGuard('payroll:read')
  if (guard.error) return guard.error

  const body = await req.json()
  const {
    hoursWorked,
    hourlyRate,
    annualSalary,
    frequency = 'fortnightly',
    allowances = 0,
    deductions = 0,
  }: {
    hoursWorked?: number
    hourlyRate?:  number
    annualSalary?: number
    frequency?:   PayFrequency
    allowances?:  number
    deductions?:  number
  } = body

  // Derive gross pay
  let grossPay: number

  if (hoursWorked && hourlyRate) {
    grossPay = grossFromHours(hoursWorked, hourlyRate)
  } else if (annualSalary) {
    grossPay = grossFromSalary(annualSalary, frequency)
  } else {
    return NextResponse.json(
      { error: 'Provide either (hoursWorked + hourlyRate) or annualSalary' },
      { status: 400 },
    )
  }

  const breakdown = calculatePayroll({ grossPay, frequency, allowances, deductions })

  return NextResponse.json({ breakdown, grossPay })
}
