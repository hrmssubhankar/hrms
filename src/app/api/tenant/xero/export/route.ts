import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRecords, employees } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { getValidAccessToken, xeroApiPost } from '@/lib/xero/client'

/**
 * POST /api/tenant/xero/export
 * Body: { ids: string[] }  — array of payrollRecord IDs to export
 *
 * For each record, creates a Xero Manual Journal:
 *   DR  Wages Expense (493)   grossPay + superContribution
 *   CR  PAYG Withholding (825) paygWithholding + medicareLevy
 *   CR  Superannuation Payable (826) superContribution
 *   CR  Net Wages Payable (200)  netPay
 *
 * Account codes above are Xero AU defaults — clients can adjust in Xero.
 * After successful push, marks records exportedToXero=true + exportedAt=now.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await apiGuard('payroll:write')
    if (guard.error) return guard.error
    const { session } = guard

    const body = await req.json()
    const { ids }: { ids: string[] } = body

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    // Get valid Xero access token (auto-refreshes if needed)
    const xero = await getValidAccessToken(session.tenantId)
    if (!xero) {
      return NextResponse.json(
        { error: 'Xero is not connected. Connect Xero in Settings → Integrations.' },
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
      // Skip already-exported records
      if (record.exportedToXero) {
        results.push({ id: record.id, status: 'skipped', reason: 'Already exported' })
        continue
      }

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

      // Build Xero Manual Journal
      // Xero AU default account codes:
      //   493 = Wages & Salaries (expense, debit)
      //   825 = PAYG Withholding Payable (liability, credit)
      //   826 = Superannuation Payable (liability, credit)
      //   800 = Wages Payable (liability, credit for net wages)
      const journal = {
        Narration: `Payroll: ${empName} — ${record.periodStart} to ${record.periodEnd}`,
        JournalLines: [
          // DR Wages Expense = gross + super (employer cost)
          {
            AccountCode: '493',
            Description: `Wages — ${empName}`,
            LineAmount:  gross + sup,
            TaxType:     'NONE',
          },
          // CR PAYG Withholding
          {
            AccountCode: '825',
            Description: `PAYG Withholding — ${empName}`,
            LineAmount:  -(payg + medi),
            TaxType:     'NONE',
          },
          // CR Superannuation Payable
          {
            AccountCode: '826',
            Description: `Superannuation Payable — ${empName}`,
            LineAmount:  -sup,
            TaxType:     'NONE',
          },
          // CR Net Wages Payable
          {
            AccountCode: '800',
            Description: `Net Wages Payable — ${empName}`,
            LineAmount:  -net,
            TaxType:     'NONE',
          },
        ],
      }

      try {
        await xeroApiPost(xero.accessToken, xero.xeroTenantId, 'ManualJournals', {
          ManualJournals: [journal],
        })

        // Mark as exported in our DB
        await db.update(payrollRecords)
          .set({ exportedToXero: true, exportedAt: new Date() })
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
    console.error('POST /api/tenant/xero/export', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
