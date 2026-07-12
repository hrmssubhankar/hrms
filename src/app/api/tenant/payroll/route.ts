import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRecords, employees, tenants } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { calculatePayroll, grossFromHours, grossFromSalary, type PayFrequency } from '@/lib/payroll/calculator'
import { sendEmail } from '@/lib/email/resend'
import { payslipReadyEmail } from '@/lib/email/templates'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:read')
    if (guard.error) return guard.error
    const { session } = guard
    const { searchParams } = req.nextUrl
    const status     = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')

    const conditions = [eq(payrollRecords.tenantId, session.tenantId)]
    if (status)     conditions.push(eq(payrollRecords.status, status))
    if (employeeId) conditions.push(eq(payrollRecords.employeeId, employeeId))

    const rows = await db.select({
      id:                payrollRecords.id,
      employeeId:        payrollRecords.employeeId,
      periodStart:       payrollRecords.periodStart,
      periodEnd:         payrollRecords.periodEnd,
      hoursWorked:       payrollRecords.hoursWorked,
      hourlyRate:        payrollRecords.hourlyRate,
      grossPay:          payrollRecords.grossPay,
      paygWithholding:   payrollRecords.paygWithholding,
      medicareLevy:      payrollRecords.medicareLevy,
      superContribution: payrollRecords.superContribution,
      netPay:            payrollRecords.netPay,
      payslipData:       payrollRecords.payslipData,
      status:            payrollRecords.status,
      exportedToXero:    payrollRecords.exportedToXero,
      exportedAt:        payrollRecords.exportedAt,
      createdAt:         payrollRecords.createdAt,
      employeeFirstName: employees.firstName,
      employeeLastName:  employees.lastName,
      employeeEntityName:employees.entityName,
      employeeEmail:     employees.email,
    })
      .from(payrollRecords)
      .leftJoin(employees, eq(payrollRecords.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(payrollRecords.createdAt))

    const stats = {
      total:        rows.length,
      pending:      rows.filter(r => r.status === 'pending').length,
      approved:     rows.filter(r => r.status === 'approved').length,
      paid:         rows.filter(r => r.status === 'paid').length,
      xeroExported: rows.filter(r => r.exportedToXero).length,
      totalGross:   rows.reduce((s, r) => s + Number(r.grossPay ?? 0), 0).toFixed(2),
      totalNet:     rows.reduce((s, r) => s + Number(r.netPay  ?? 0), 0).toFixed(2),
      totalSuper:   rows.reduce((s, r) => s + Number(r.superContribution ?? 0), 0).toFixed(2),
    }

    return NextResponse.json({ records: rows, stats })
  } catch (err) {
    console.error('GET /api/tenant/payroll', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const {
      employeeId, periodStart, periodEnd,
      hoursWorked, hourlyRate, annualSalary,
      frequency = 'fortnightly' as PayFrequency,
      allowances = 0, deductions = 0,
    } = body

    if (!employeeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'employeeId, periodStart, periodEnd required' },
        { status: 400 },
      )
    }

    // Calculate gross from inputs
    let grossPay: number
    if (hoursWorked && hourlyRate) {
      grossPay = grossFromHours(Number(hoursWorked), Number(hourlyRate))
    } else if (annualSalary) {
      grossPay = grossFromSalary(Number(annualSalary), frequency)
    } else if (body.grossPay) {
      grossPay = Number(body.grossPay)
    } else {
      return NextResponse.json(
        { error: 'Provide hoursWorked+hourlyRate, annualSalary, or grossPay' },
        { status: 400 },
      )
    }

    // Run the tax calculation
    const breakdown = calculatePayroll({ grossPay, frequency, allowances, deductions })

    const [record] = await db.insert(payrollRecords).values({
      tenantId:          session.tenantId,
      employeeId,
      periodStart,
      periodEnd,
      hoursWorked:       hoursWorked ? String(hoursWorked) : null,
      hourlyRate:        hourlyRate  ? String(hourlyRate)  : null,
      grossPay:          String(breakdown.grossPay),
      paygWithholding:   String(breakdown.paygWithholding),
      medicareLevy:      String(breakdown.medicareLevy),
      superContribution: String(breakdown.superContribution),
      netPay:            String(breakdown.netPay),
      payslipData:       { ...breakdown, frequency, allowances, deductions },
      status:            'pending',
    }).returning()

    return NextResponse.json({ record, breakdown }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tenant/payroll', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { id, status, exportedToXero } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status           !== undefined) updates.status           = status
    if (exportedToXero   !== undefined) {
      updates.exportedToXero = exportedToXero
      if (exportedToXero) updates.exportedAt = new Date()
    }

    const [updated] = await db
      .update(payrollRecords)
      .set(updates)
      .where(and(eq(payrollRecords.id, id), eq(payrollRecords.tenantId, session.tenantId)))
      .returning()

    // Send payslip email when a pay run is marked as paid
    if (status === 'paid' && updated) {
      try {
        const [emp] = await db
          .select({ firstName: employees.firstName, lastName: employees.lastName, email: employees.email })
          .from(employees)
          .where(eq(employees.id, updated.employeeId))

        const [tenant] = await db
          .select({ name: tenants.name, primaryColor: tenants.primaryColor })
          .from(tenants)
          .where(eq(tenants.id, session.tenantId))

        if (emp?.email) {
          const loginUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL ?? 'hrms.app'}`
          const tmpl = payslipReadyEmail({
            recipientName: emp.firstName,
            orgName:       tenant?.name ?? 'Your Organisation',
            periodStart:   updated.periodStart,
            periodEnd:     updated.periodEnd,
            grossPay:      Number(updated.grossPay ?? 0),
            netPay:        Number(updated.netPay ?? 0),
            superAmount:   Number(updated.superContribution ?? 0),
            loginUrl:      `${loginUrl}/tenant/payroll`,
            primaryColor:  tenant?.primaryColor ?? '#1a4fff',
          })
          sendEmail({ to: emp.email, ...tmpl }).catch(console.error)
        }
      } catch (e) {
        console.error('Payslip email error:', e)
      }
    }

    return NextResponse.json({ record: updated })
  } catch (err) {
    console.error('PATCH /api/tenant/payroll', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
