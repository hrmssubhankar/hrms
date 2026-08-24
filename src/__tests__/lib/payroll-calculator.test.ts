/**
 * Unit tests — Australian Payroll Calculator (FY 2024-25)
 * src/lib/payroll/calculator.ts
 */
import { describe, it, expect } from 'vitest'
import { calculatePayroll, grossFromHours, grossFromSalary } from '@/lib/payroll/calculator'

// ── grossFromHours ────────────────────────────────────────────────────────────

describe('grossFromHours', () => {
  it('multiplies hours by rate and rounds to 2dp', () => {
    expect(grossFromHours(10, 25)).toBe(250)
    expect(grossFromHours(7.5, 32.5)).toBe(243.75)
    expect(grossFromHours(38, 28.50)).toBe(1083)
  })

  it('handles fractional results correctly', () => {
    // 7 * 22.333... — should round to 2dp
    expect(grossFromHours(3, 22.333)).toBe(67)
  })

  it('returns 0 for zero hours', () => {
    expect(grossFromHours(0, 50)).toBe(0)
  })
})

// ── grossFromSalary ───────────────────────────────────────────────────────────

describe('grossFromSalary', () => {
  it('divides annual salary by 52 for weekly', () => {
    expect(grossFromSalary(52000, 'weekly')).toBe(1000)
  })

  it('divides annual salary by 26 for fortnightly', () => {
    expect(grossFromSalary(78000, 'fortnightly')).toBe(3000)
  })

  it('divides annual salary by 12 for monthly', () => {
    expect(grossFromSalary(60000, 'monthly')).toBe(5000)
  })

  it('returns the full salary for annually', () => {
    expect(grossFromSalary(100000, 'annually')).toBe(100000)
  })

  it('rounds to 2 decimal places', () => {
    // $70,000 / 52 = 1346.153... → 1346.15
    expect(grossFromSalary(70000, 'weekly')).toBe(1346.15)
  })
})

// ── calculatePayroll ──────────────────────────────────────────────────────────

describe('calculatePayroll', () => {
  // ── Fortnightly, $3,000 gross ──────────────────────────────────────────────
  //
  // Annualised: 3000 × 26 = $78,000
  // Tax (78k):  5092 + (78000−45000)×0.325 = 15,817
  // LITO:       0 (income > $66,667)
  // Medicare:   78000 × 0.02 = 1,560 → 60/period
  // PAYG/period: round((15817+1560)/26 − 60) = round(608.35) = 608
  // Net:         3000 − 668 = 2332
  // Super:       round(3000 × 0.115 × 100)/100 = 345

  it('calculates correctly for fortnightly $3,000 gross', () => {
    const result = calculatePayroll({ grossPay: 3000, frequency: 'fortnightly' })
    expect(result.grossPay).toBe(3000)
    expect(result.paygWithholding).toBe(608)
    expect(result.medicareLevy).toBe(60)
    expect(result.totalTax).toBe(668)
    expect(result.netPay).toBe(2332)
    expect(result.superContribution).toBe(345)
    expect(result.annualisedGross).toBe(78000)
  })

  // ── Weekly, $1,000 gross ───────────────────────────────────────────────────
  //
  // Annualised: 1000 × 52 = $52,000
  // Tax (52k):  5092 + (52000−45000)×0.325 = 7,367
  // LITO:       325 − (52000−45000)×0.015 = 220
  // Tax after LITO: 7,147
  // Medicare:   52000 × 0.02 = 1,040 → 20/period
  // PAYG/period: round((7147+1040)/52 − 20) = round(157.44−20) = 137
  // Net:         1000 − 157 = 843
  // Super:       round(1000 × 0.115 × 100)/100 = 115

  it('calculates correctly for weekly $1,000 gross', () => {
    const result = calculatePayroll({ grossPay: 1000, frequency: 'weekly' })
    expect(result.paygWithholding).toBe(137)
    expect(result.medicareLevy).toBe(20)
    expect(result.totalTax).toBe(157)
    expect(result.netPay).toBe(843)
    expect(result.superContribution).toBe(115)
  })

  // ── Low income — below tax-free threshold ─────────────────────────────────
  //
  // Weekly $350 → $18,200/yr → 0 income tax (≤ threshold)
  // Medicare: 18200 ≤ 26000 → 0
  // Net = 350, PAYG = 0

  it('returns zero tax for income at or below the tax-free threshold', () => {
    const result = calculatePayroll({ grossPay: 350, frequency: 'weekly' })
    expect(result.paygWithholding).toBe(0)
    expect(result.medicareLevy).toBe(0)
    expect(result.netPay).toBe(350)
  })

  // ── LITO at maximum ───────────────────────────────────────────────────────
  //
  // Weekly $500 → $26,000/yr
  // Tax: (26000−18200)×0.19 = 1,482; LITO = 700; after = 782
  // Medicare: ≤26000 → 0
  // PAYG/period = round(782/52) = round(15.04) = 15
  // Net = 500 − 15 = 485

  it('applies full LITO for low-income earner', () => {
    const result = calculatePayroll({ grossPay: 500, frequency: 'weekly' })
    expect(result.paygWithholding).toBe(15)
    expect(result.medicareLevy).toBe(0)
    expect(result.netPay).toBe(485)
  })

  // ── High income ───────────────────────────────────────────────────────────
  //
  // Monthly $20,000 → $240,000/yr
  // Tax: 51667 + (240000−180000)×0.45 = 51667 + 27000 = 78,667
  // LITO: 0 (>66667)
  // Medicare: 240000 × 0.02 = 4,800 → 400/month
  // PAYG/month: round((78667+4800)/12 − 400) = round(6955.58−400) = round(6555.58) = 6556
  // Net = 20000 − 6956 = 13044

  it('calculates correctly for high-income earner (monthly)', () => {
    const result = calculatePayroll({ grossPay: 20000, frequency: 'monthly' })
    expect(result.paygWithholding).toBe(6556)
    expect(result.medicareLevy).toBe(400)
    expect(result.totalTax).toBe(6956)
    expect(result.netPay).toBe(13044)
    expect(result.annualisedGross).toBe(240000)
  })

  // ── Allowances and deductions ─────────────────────────────────────────────

  it('adds allowances to taxable income', () => {
    const base    = calculatePayroll({ grossPay: 3000, frequency: 'fortnightly' })
    const withAll = calculatePayroll({ grossPay: 3000, frequency: 'fortnightly', allowances: 200 })
    // Higher taxable income → higher tax → lower net
    expect(withAll.taxableIncome).toBe(3200)
    expect(withAll.totalTax).toBeGreaterThan(base.totalTax)
  })

  it('subtracts deductions from taxable income', () => {
    const base     = calculatePayroll({ grossPay: 3000, frequency: 'fortnightly' })
    const withDed  = calculatePayroll({ grossPay: 3000, frequency: 'fortnightly', deductions: 300 })
    expect(withDed.taxableIncome).toBe(2700)
    expect(withDed.totalTax).toBeLessThan(base.totalTax)
  })

  // ── Super guarantee ───────────────────────────────────────────────────────

  it('calculates super at 11.5%', () => {
    const result = calculatePayroll({ grossPay: 4000, frequency: 'fortnightly' })
    expect(result.superContribution).toBe(460)   // 4000 × 0.115
  })

  it('super is based on gross pay, not net', () => {
    const result = calculatePayroll({ grossPay: 2000, frequency: 'weekly' })
    expect(result.superContribution).toBe(230)   // 2000 × 0.115
  })

  // ── Structural / shape checks ─────────────────────────────────────────────

  it('returns all required fields', () => {
    const result = calculatePayroll({ grossPay: 2000, frequency: 'fortnightly' })
    const keys = ['grossPay','taxableIncome','paygWithholding','medicareLevy',
                  'totalTax','superContribution','netPay','effectiveTaxRate',
                  'annualisedGross','annualisedTax'] as const
    for (const k of keys) {
      expect(result).toHaveProperty(k)
      expect(typeof result[k]).toBe('number')
    }
  })

  it('netPay is never negative', () => {
    // Deductions larger than gross shouldn't produce negative net
    const result = calculatePayroll({ grossPay: 100, frequency: 'weekly', deductions: 5000 })
    expect(result.netPay).toBeGreaterThanOrEqual(0)
  })

  it('effectiveTaxRate is 0 when grossPay is 0', () => {
    const result = calculatePayroll({ grossPay: 0, frequency: 'weekly' })
    expect(result.effectiveTaxRate).toBe(0)
  })

  it('totalTax equals paygWithholding + medicareLevy', () => {
    const r = calculatePayroll({ grossPay: 3500, frequency: 'fortnightly' })
    expect(r.totalTax).toBe(r.paygWithholding + r.medicareLevy)
  })
})
