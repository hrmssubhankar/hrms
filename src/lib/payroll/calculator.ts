/**
 * Australian Payroll Calculator — FY 2024-25
 *
 * Implements:
 *  - PAYG withholding (ATO tax tables, Scale 1 — residents)
 *  - Medicare Levy (2%)
 *  - Low Income Tax Offset (LITO) up to $700
 *  - Low and Middle Income Tax Offset (LMITO) — no longer applies from FY24
 *  - Superannuation Guarantee (11.5% from 1 July 2024)
 *
 * Reference: https://www.ato.gov.au/tax-rates-and-codes/tax-withheld-calculator
 */

export type PayFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually'

export type PayrollInput = {
  grossPay:      number   // gross earnings for the pay period
  frequency:     PayFrequency
  // Optional allowances / extras
  allowances?:   number   // taxable allowances
  deductions?:   number   // pre-tax salary sacrifice / deductions
}

export type PayrollBreakdown = {
  grossPay:          number
  taxableIncome:     number  // gross + allowances - salary sacrifice
  paygWithholding:   number
  medicareLevy:      number
  totalTax:          number
  superContribution: number  // employer super (not deducted from net — it's on top)
  netPay:            number
  effectiveTaxRate:  number  // %
  annualisedGross:   number
  annualisedTax:     number
}

/** Periods per year for each frequency */
const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly:      52,
  fortnightly: 26,
  monthly:     12,
  annually:    1,
}

/** Super guarantee rate from 1 July 2024 */
const SUPER_RATE = 0.115

/** Medicare levy rate */
const MEDICARE_RATE = 0.02

/**
 * Calculate annual PAYG tax using ATO 2024-25 Scale 1 (resident, no offsets applied yet)
 * Brackets: https://www.ato.gov.au/rates/individual-income-tax-rates/
 */
function annualTaxBeforeOffset(annualIncome: number): number {
  if (annualIncome <= 18200)  return 0
  if (annualIncome <= 45000)  return (annualIncome - 18200) * 0.19
  if (annualIncome <= 120000) return 5092 + (annualIncome - 45000) * 0.325
  if (annualIncome <= 180000) return 29467 + (annualIncome - 120000) * 0.37
  return 51667 + (annualIncome - 180000) * 0.45
}

/**
 * Low Income Tax Offset (LITO) — FY2024-25
 * Max $700 for income ≤ $37,500
 * Phases out between $37,500–$45,000 at 5¢ per $1
 * Further phases out $45,000–$66,667 at 1.5¢ per $1
 */
function litoOffset(annualIncome: number): number {
  if (annualIncome <= 37500) return 700
  if (annualIncome <= 45000) return 700 - (annualIncome - 37500) * 0.05
  if (annualIncome <= 66667) return 325 - (annualIncome - 45000) * 0.015
  return 0
}

/**
 * Medicare Levy annual amount.
 * Low income threshold (2024-25): $26,000 — full 2% above that.
 * Phase-in: 10% of excess income between $26,000–$32,500.
 */
function annualMedicareLevy(annualIncome: number): number {
  const LOW_THRESHOLD = 26000
  const SHADE_IN_END  = 32500
  if (annualIncome <= LOW_THRESHOLD) return 0
  if (annualIncome <= SHADE_IN_END)  return (annualIncome - LOW_THRESHOLD) * 0.10
  return annualIncome * MEDICARE_RATE
}

/**
 * Main calculation function.
 */
export function calculatePayroll(input: PayrollInput): PayrollBreakdown {
  const { grossPay, frequency, allowances = 0, deductions = 0 } = input
  const periods = PERIODS_PER_YEAR[frequency]

  // Annualise
  const annualisedGross    = (grossPay + allowances - deductions) * periods
  const annualisedAllowanceGross = annualisedGross

  // Annual tax before offsets
  const annualTaxRaw   = annualTaxBeforeOffset(annualisedAllowanceGross)
  const lito           = litoOffset(annualisedAllowanceGross)
  const annualTaxAfter = Math.max(0, annualTaxRaw - lito)
  const annualMedicare = annualMedicareLevy(annualisedAllowanceGross)
  const annualTaxTotal = annualTaxAfter + annualMedicare

  // De-annualise to this period
  const periodTax      = annualTaxTotal / periods
  const periodMedicare = annualMedicare / periods
  const periodPAYG     = periodTax - periodMedicare  // PAYG = tax minus medicare (shown separately)

  // Round to nearest dollar for PAYG (ATO convention)
  const paygWithholding   = Math.round(Math.max(0, periodTax - periodMedicare))
  const medicareLevy      = Math.round(Math.max(0, periodMedicare))
  const totalTax          = paygWithholding + medicareLevy

  // Net pay (tax deducted from gross earnings of the period)
  const taxableGross      = grossPay + allowances - deductions
  const netPay            = Math.max(0, taxableGross - totalTax)

  // Super (employer contribution on top — not deducted from net)
  const superContribution = Math.round(grossPay * SUPER_RATE * 100) / 100

  const effectiveTaxRate  = taxableGross > 0
    ? Math.round((totalTax / taxableGross) * 10000) / 100
    : 0

  return {
    grossPay:          Math.round(grossPay * 100) / 100,
    taxableIncome:     Math.round(taxableGross * 100) / 100,
    paygWithholding,
    medicareLevy,
    totalTax,
    superContribution,
    netPay:            Math.round(netPay * 100) / 100,
    effectiveTaxRate,
    annualisedGross:   Math.round(annualisedGross),
    annualisedTax:     Math.round(annualTaxTotal),
  }
}

/**
 * Derive gross pay from hours + hourly rate.
 */
export function grossFromHours(hoursWorked: number, hourlyRate: number): number {
  return Math.round(hoursWorked * hourlyRate * 100) / 100
}

/**
 * Derive gross pay from annual salary + frequency.
 */
export function grossFromSalary(annualSalary: number, frequency: PayFrequency): number {
  return Math.round((annualSalary / PERIODS_PER_YEAR[frequency]) * 100) / 100
}
