import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRecords, employees } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getValidMyobToken, myobApiPost } from '@/lib/myob/client'

/**
 * POST /api/tenant/myob/export
 * Body: { ids: string[] }
 *
 * For each payroll record, creates a MYOB General Journal Transaction:
 *   DR  Wages & Salaries (account code 6-1000 or whichever is configured)
 *   CR  PAYG Withholding Payable
 *   CR  Superannuation Payable
 *   CR  Wages Payable (net)
 *
 * MYOB account codes use the standard AU chart of accounts:
 *   6-1000  Wages & Salaries
 *   2-1410  PAYG Withholding Payable
 *   2-1420  Superannuation Payable
 *   2-1400  Wages Payable
 *
 * These can be reconfigured in MYOB's chart of accounts.
 * After a successful push, marks records exportedToMyob=true.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:write')
    if (guard.error) return guard.error
    const { session } = guard

    const { ids }: { ids: string[] } = await req.json()
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    const myob = await getValidMyobToken(session.tenantId)
    if (!myob) {
      return NextResponse.json(
        { error: 'MYOB is not connected. Connect MYOB in Settings → Integrations.' },
        { status: 422 },
      )
    }

    // Load payroll records scoped to this tenant
    const rows = await db.select({
      id:                payrollRecords.id,
      employeeId:        payrollRecords.employeeId,
      periodStart:       payrollRecords.periodStart,
      periodEnd:         payrollRecords.periodEnd,
      grossPay:          payrollRecords.grossPay,
      paygWithholding:   payrollRecords.paygWithholding,
      medicareLevy:      payrollRecords.medicareLevy,
      superContribution: payrollRecords.superContribution,
      netPay:            payrollRecords.netPay,
      status:            payrollRecords.status,
      exportedToXero:    payrollRecords.exportedToXero,
      employeeFirstName: employees.firstName,
      employeeLastName:  employees.lastName,
    })
      .from(payrollRecords)
      .leftJoin(employees, eq(payrollRecords.employeeId, employees.id))
      .where(and(
        eq(payrollRecords.tenantId, session.tenantId),
        inArray(payrollRecords.id, ids),
      ))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No matching records found' }, { status: 404 })
    }

    const results: Array<{ id: string; status: 'exported' | 'skipped' | 'error'; reason?: string }> = []

    for (const record of rows) {
      const gross = Number(record.grossPay ?? 0)
      const payg  = Number(record.paygWithholding ?? 0)
      const medi  = Number(record.medicareLevy ?? 0)
      const sup   = Number(record.superContribution ?? 0)
      const net   = Number(record.netPay ?? 0)
      const empName = `${record.employeeFirstName ?? ''} ${record.employeeLastName ?? ''}`.trim()

      if (gross === 0) {
        results.push({ id: record.id, status: 'skipped', reason: 'Zero gross pay' })
        continue
      }

      // MYOB General Journal Transaction
      // Lines must balance: sum of all Debit - sum of all Credit = 0
      const journal = {
        DateOccurred:  record.periodEnd,
        Memo:          `Payroll: ${empName} — ${record.periodStart} to ${record.periodEnd}`,
        IsYearEndAdjustment: false,
        GSTReportingMethod: 'Purchase',
        Lines: [
          // DR Wages & Salaries (gross + super = total employer cost)
          {
            Account:     { DisplayID: '6-1000' },
            Memo:        `Wages — ${empName}`,
            Amount:      gross + sup,
            IsDebit:     true,
            TaxCode:     { Code: 'N-T' },
          },
          // CR PAYG Withholding Payable
          {
            Account:     { DisplayID: '2-1410' },
            Memo:        `PAYG Withholding — ${empName}`,
            Amount:      payg + medi,
            IsDebit:     false,
            TaxCode:     { Code: 'N-T' },
          },
          // CR Superannuation Payable
          {
            Account:     { DisplayID: '2-1420' },
            Memo:        `Superannuation Payable — ${empName}`,
            Amount:      sup,
            IsDebit:     false,
            TaxCode:     { Code: 'N-T' },
          },
          // CR Net Wages Payable
          {
            Account:     { DisplayID: '2-1400' },
            Memo:        `Net Wages Payable — ${empName}`,
            Amount:      net,
            IsDebit:     false,
            TaxCode:     { Code: 'N-T' },
          },
        ],
      }

      try {
        await myobApiPost(
          myob.accessToken,
          myob.companyFileUri,
          'GeneralLedger/JournalTransaction',
          journal,
        )

        // MYOB doesn't have a dedicated "exportedToMyob" column — we store in payslipData JSONB
        const current = await db.select({ payslipData: payrollRecords.payslipData })
          .from(payrollRecords).where(eq(payrollRecords.id, record.id))
        const existing = (current[0]?.payslipData ?? {}) as Record<string, unknown>

        await db.update(payrollRecords)
          .set({
            payslipData: {
              ...existing,
              exportedToMyob: true,
              myobExportedAt: new Date().toISOString(),
            },
          })
          .where(and(
            eq(payrollRecords.id, record.id),
            eq(payrollRecords.tenantId, session.tenantId),
          ))

        results.push({ id: record.id, status: 'exported' })
      } catch (err: any) {
        results.push({ id: record.id, status: 'error', reason: err.message })
      }
    }

    const exported = results.filter(r => r.status === 'exported').length
    const errors   = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      results,
      summary: { exported, skipped: results.length - exported - errors, errors },
    })
  } catch (err) {
    console.error('POST /api/tenant/myob/export', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
