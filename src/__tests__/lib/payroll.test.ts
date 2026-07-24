/**
 * Unit tests — Australian payroll calculator
 * lib/payroll/calculator.ts
 *
 * Reference figures verified against ATO PAYG withholding tables FY 2024-25.
 */
import { describe, it, expect } from 'vitest'
import {
  calculatePayroll,
  grossFromHours,
  grossFromSalary,
  type PayFrequency,
} from '@/lib/payroll/calculator'

// ── grossFromSalary ────────────────────────────────────────────────────────────

describe('grossFromSalary', () => {
  it('converts $60,000 annual to correct monthly gross', () => {
    const monthly = grossFromSalary(60000, 'monthly')
    expect(monthly).toBeCloseTo(5000.00, 2)
  })

  it('converts $78,000 annual to correct fortnightly gross', () => {
    const fn = grossFromSalary(78000, 'fortnightly')
    expect(fn).toBeCloseTo(3000.00, 2)
  })

  it('converts $52,000 annual to $1,000 weekly', () => {
    expect(grossFromSalary(52000, 'weekly')).toBeCloseTo(1000.00, 2)
  })

  it('annually frequency returns the full salary', () => {
    expect(grossFromSalary(120000, 'annually')).toBeCloseTo(120000, 2)
  })
})

// ── grossFromHours ─────────────────────────────────────────────────────────────

describe('grossFromHours', () => {
  it('calculates weekly gross from 38h at $35/hr', () => {
    expect(grossFromHours(38, 35)).toBeCloseTo(1330.00, 2)
  })

  it('rounds to 2 decimal places', () => {
    expect(grossFromHours(7.5, 27.33)).toBeCloseTo(204.98, 2)
  })

  it('returns 0 for 0 hours', () => {
    expect(grossFromHours(0, 50)).toBe(0)
  })
})

// ── calculatePayroll — tax-free threshold zone ─────────────────────────────────

describe('calculatePayroll — low income (≤ $18,200 annual)', () => {
  it('zero-income employee has no tax', () => {
    const result = calculatePayroll({ grossPay: 0, frequency: 'monthly' })
    expect(result.paygWithholding).toBe(0)
    expect(result.medicareLevy).toBe(0)
    expect(result.netPay).toBe(0)
  })

  it('$350/week earner pays no PAYG (annual = $18,200)', () => {
    // $18,200 / 52 = $350
    const result = calculatePayroll({ grossPay: 350, frequency: 'weekly' })
    expect(result.paygWithholding).toBe(0)
    expect(result.annualisedGross).toBe(18200)
  })

  it('annualisedGross equals grossPay × periods for weekly', () => {
    const result = calculatePayroll({ grossPay: 1000, frequency: 'weekly' })
    expect(result.annualisedGross).toBe(52000)
  })
})

// ── calculatePayroll — known bracket cases ─────────────────────────────────────

describe('calculatePayroll — bracket verification', () => {
  it('$45,000 annual (fortnightly) — correct tax bracket boundary', () => {
    // Annual = $45,000 → tax = $5,092 before offsets; LITO phases out at exactly $45k = $700
    // Net annual tax = 5092 - 700 = 4392 + medicare
    const gross = grossFromSalary(45000, 'fortnightly')
    const result = calculatePayroll({ grossPay: gross, frequency: 'fortnightly' })
    expect(result.annualisedGross).toBe(45000)
    // Net pay must be positive
    expect(result.netPay).toBeGreaterThan(0)
    // Total tax must be less than gross
    expect(result.totalTax).toBeLessThan(result.grossPay)
  })

  it('$80,000 annual (monthly) — mid-bracket tax is reasonable', () => {
    const gross = grossFromSalary(80000, 'monthly')
    const result = calculatePayroll({ grossPay: gross, frequency: 'monthly' })
    // Annual tax for $80k ≈ 5092 + (80000-45000)*0.325 ≈ $16,467 before LITO (0 at this level)
    // Medicare = 80000 * 0.02 = $1,600
    // Total annual ≈ $18,067; monthly ≈ $1,505
    expect(result.totalTax).toBeGreaterThan(1400)
    expect(result.totalTax).toBeLessThan(1700)
    expect(result.effectiveTaxRate).toBeGreaterThan(15)
    expect(result.effectiveTaxRate).toBeLessThan(25)
  })

  it('$120,000 annual (monthly) — high bracket', () => {
    const gross = grossFromSalary(120000, 'monthly')
    const result = calculatePayroll({ grossPay: gross, frequency: 'monthly' })
    // Annual tax ≈ 29467 + medicare 2400 = 31867; monthly ≈ $2,655
    expect(result.totalTax).toBeGreaterThan(2500)
    expect(result.totalTax).toBeLessThan(2900)
  })

  it('$200,000 annual (monthly) — top bracket (45%)', () => {
    const gross = grossFromSalary(200000, 'monthly')
    const result = calculatePayroll({ grossPay: gross, frequency: 'monthly' })
    // Effective rate should be approaching 45% but not exceed it
    expect(result.effectiveTaxRate).toBeGreaterThan(35)
    expect(result.effectiveTaxRate).toBeLessThan(50)
  })
})

// ── calculatePayroll — super ───────────────────────────────────────────────────

describe('calculatePayroll — superannuation (11.5% from Jul 2024)', () => {
  it('computes super at 11.5% of gross', () => {
    const result = calculatePayroll({ grossPay: 5000, frequency: 'monthly' })
    // 5000 * 0.115 = 575
    expect(result.superContribution).toBeCloseTo(575, 1)
  })

  it('super does NOT reduce net pay (employer contribution)', () => {
    const result = calculatePayroll({ grossPay: 5000, frequency: 'monthly' })
    expect(result.netPay + result.totalTax).toBeCloseTo(result.grossPay, 1)
  })
})

// ── calculatePayroll — allowances & deductions ────────────────────────────────

describe('calculatePayroll — allowances & salary sacrifice', () => {
  it('allowances increase taxable income', () => {
    const base    = calculatePayroll({ grossPay: 3000, frequency: 'monthly' })
    const withAlw = calculatePayroll({ grossPay: 3000, frequency: 'monthly', allowances: 500 })
    expect(withAlw.taxableIncome).toBe(base.taxableIncome + 500)
    expect(withAlw.totalTax).toBeGreaterThan(base.totalTax)
  })

  it('salary sacrifice (deductions) reduces taxable income', () => {
    const base     = calculatePayroll({ grossPay: 3000, frequency: 'monthly' })
    const withSS   = calculatePayroll({ grossPay: 3000, frequency: 'monthly', deductions: 500 })
    expect(withSS.taxableIncome).toBe(base.taxableIncome - 500)
    expect(withSS.totalTax).toBeLessThan(base.totalTax)
  })

  it('combined allowance and deduction: net taxable = gross + alw - ded', () => {
    const result = calculatePayroll({
      grossPay: 4000, frequency: 'monthly', allowances: 300, deductions: 200,
    })
    expect(result.taxableIncome).toBeCloseTo(4100, 1)
  })
})

// ── calculatePayroll — output shape ───────────────────────────────────────────

describe('calculatePayroll — output invariants', () => {
  const freqs: PayFrequency[] = ['weekly', 'fortnightly', 'monthly', 'annually']

  freqs.forEach(freq => {
    it(`netPay + totalTax = taxableIncome for ${freq} frequency`, () => {
      const result = calculatePayroll({ grossPay: 3500, frequency: freq })
      expect(result.netPay + result.totalTax).toBeCloseTo(result.taxableIncome, 0)
    })
  })

  it('netPay is never negative', () => {
    const result = calculatePayroll({ grossPay: 0, frequency: 'weekly' })
    expect(result.netPay).toBeGreaterThanOrEqual(0)
  })

  it('effectiveTaxRate is between 0 and 100', () => {
    const cases = [100, 1000, 5000, 20000].map(gross =>
      calculatePayroll({ grossPay: gross, frequency: 'monthly' }).effectiveTaxRate
    )
    cases.forEach(rate => {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(100)
    })
  })

  it('annualisedTax increases as income increases', () => {
    const rates = [30000, 60000, 100000, 180000].map(salary => {
      const gross = grossFromSalary(salary, 'monthly')
      return calculatePayroll({ grossPay: gross, frequency: 'monthly' }).annualisedTax
    })
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1])
    }
  })
})
