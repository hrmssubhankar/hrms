// ─────────────────────────────────────────────────────────────
// Country → Currency mapping
// ─────────────────────────────────────────────────────────────

export const COUNTRY_CURRENCY: Record<string, string> = {
  AU: 'AUD', NZ: 'NZD', US: 'USD', CA: 'CAD',
  GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR',
  NL: 'EUR', BE: 'EUR', IT: 'EUR', ES: 'EUR',
  SG: 'SGD', MY: 'MYR', PH: 'PHP', IN: 'INR',
  AE: 'AED', SA: 'SAR', ZA: 'ZAR', JP: 'JPY',
  HK: 'HKD', CN: 'CNY', KR: 'KRW', TH: 'THB',
  ID: 'IDR', VN: 'VND', PK: 'PKR', BD: 'BDT',
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  AUD: 'A$', NZD: 'NZ$', USD: '$', CAD: 'C$',
  GBP: '£',  EUR: '€',   SGD: 'S$', MYR: 'RM',
  PHP: '₱',  INR: '₹',  AED: 'د.إ', SAR: '﷼',
  ZAR: 'R',  JPY: '¥',  HKD: 'HK$', CNY: '¥',
  KRW: '₩',  THB: '฿',  IDR: 'Rp',  VND: '₫',
}

// ─────────────────────────────────────────────────────────────
// Country list for dropdowns
// ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'JP', name: 'Japan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
]

// ─────────────────────────────────────────────────────────────
// Timezones by country
// ─────────────────────────────────────────────────────────────

export const COUNTRY_TIMEZONES: Record<string, string[]> = {
  AU: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin'],
  NZ: ['Pacific/Auckland', 'Pacific/Chatham'],
  US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
  CA: ['America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver'],
  GB: ['Europe/London'],
  IE: ['Europe/Dublin'],
  SG: ['Asia/Singapore'],
  MY: ['Asia/Kuala_Lumpur'],
  PH: ['Asia/Manila'],
  IN: ['Asia/Kolkata'],
  AE: ['Asia/Dubai'],
  SA: ['Asia/Riyadh'],
  ZA: ['Africa/Johannesburg'],
  JP: ['Asia/Tokyo'],
  HK: ['Asia/Hong_Kong'],
  DE: ['Europe/Berlin'],
  FR: ['Europe/Paris'],
  NL: ['Europe/Amsterdam'],
}

// ─────────────────────────────────────────────────────────────
// Payroll provider definitions
// ─────────────────────────────────────────────────────────────

export type PayrollProvider = {
  id:          string
  name:        string
  logo:        string   // emoji fallback
  color:       string
  website:     string
  description: string
  countries:   string[]
  features:    string[]
  connectUrl?: string   // OAuth or API key based
  authType:    'oauth2' | 'api_key' | 'manual'
}

export const PAYROLL_PROVIDERS: PayrollProvider[] = [
  {
    id:          'xero',
    name:        'Xero',
    logo:        'X',
    color:       '#13B5EA',
    website:     'https://xero.com',
    description: 'Cloud accounting and payroll for small to medium businesses',
    countries:   ['AU', 'NZ', 'GB', 'US', 'CA', 'SG', 'HK', 'IE'],
    features:    ['Payroll', 'STP Reporting', 'Leave Management', 'Superannuation'],
    authType:    'oauth2',
  },
  {
    id:          'myob',
    name:        'MYOB',
    logo:        'M',
    color:       '#6B21A8',
    website:     'https://myob.com',
    description: 'Australian accounting and payroll software with STP compliance',
    countries:   ['AU', 'NZ'],
    features:    ['Payroll', 'STP Phase 2', 'Single Touch Payroll', 'Super Stream'],
    authType:    'oauth2',
  },
  {
    id:          'quickbooks',
    name:        'QuickBooks',
    logo:        'QB',
    color:       '#2CA01C',
    website:     'https://quickbooks.intuit.com',
    description: 'Accounting and payroll for small businesses',
    countries:   ['US', 'CA', 'GB', 'AU'],
    features:    ['Payroll', 'Tax Filing', 'Direct Deposit', 'Time Tracking'],
    authType:    'oauth2',
  },
  {
    id:          'adp',
    name:        'ADP',
    logo:        'ADP',
    color:       '#D42B1E',
    website:     'https://adp.com',
    description: 'Enterprise payroll and HR services',
    countries:   ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'IE'],
    features:    ['Payroll Processing', 'Benefits Admin', 'Tax Compliance', 'Time & Attendance'],
    authType:    'api_key',
  },
  {
    id:          'gusto',
    name:        'Gusto',
    logo:        'G',
    color:       '#F45D48',
    website:     'https://gusto.com',
    description: 'Full-service payroll, benefits and HR for US businesses',
    countries:   ['US'],
    features:    ['Full-service Payroll', 'Benefits', 'Workers Comp', 'HR Tools'],
    authType:    'oauth2',
  },
  {
    id:          'paychex',
    name:        'Paychex',
    logo:        'PX',
    color:       '#005EB8',
    website:     'https://paychex.com',
    description: 'Payroll and HR solutions for US businesses of all sizes',
    countries:   ['US'],
    features:    ['Payroll', 'HR Administration', 'Benefits', 'Time & Attendance'],
    authType:    'api_key',
  },
  {
    id:          'sage',
    name:        'Sage Payroll',
    logo:        'S',
    color:       '#00D639',
    website:     'https://sage.com',
    description: 'Payroll and accounting for UK, EU and South African businesses',
    countries:   ['GB', 'IE', 'ZA', 'DE', 'FR'],
    features:    ['Payroll', 'RTI Reporting', 'Pension Auto-enrolment', 'HMRC Compliant'],
    authType:    'api_key',
  },
  {
    id:          'brightpay',
    name:        'BrightPay',
    logo:        'BP',
    color:       '#0076BE',
    website:     'https://brightpay.co.uk',
    description: 'Award-winning payroll software for UK and Irish employers',
    countries:   ['GB', 'IE'],
    features:    ['RTI', 'Auto-enrolment', 'CIS', 'P60 / P45'],
    authType:    'manual',
  },
  {
    id:          'zoho_payroll',
    name:        'Zoho Payroll',
    logo:        'ZP',
    color:       '#E42527',
    website:     'https://zoho.com/payroll',
    description: 'Payroll software for India and US with compliance built in',
    countries:   ['IN', 'US'],
    features:    ['PF / ESI', 'TDS', 'Form 16', 'Salary Slips'],
    authType:    'api_key',
  },
  {
    id:          'greythr',
    name:        'greytHR',
    logo:        'GH',
    color:       '#00529B',
    website:     'https://greythr.com',
    description: 'HR and payroll software for Indian businesses',
    countries:   ['IN'],
    features:    ['PF / ESI / PT', 'TDS', 'Leave Management', 'Attendance'],
    authType:    'api_key',
  },
  {
    id:          'talenox',
    name:        'Talenox',
    logo:        'TX',
    color:       '#4F46E5',
    website:     'https://talenox.com',
    description: 'Payroll and HR for Singapore, Malaysia and Hong Kong',
    countries:   ['SG', 'MY', 'HK'],
    features:    ['CPF / EPF', 'IR8A / EA Form', 'Leave', 'Payslips'],
    authType:    'api_key',
  },
  {
    id:          'swingvy',
    name:        'Swingvy',
    logo:        'SW',
    color:       '#FF6B6B',
    website:     'https://swingvy.com',
    description: 'HR and payroll for Malaysia, Singapore and South Korea',
    countries:   ['MY', 'SG', 'KR'],
    features:    ['EPF / SOCSO', 'PCB Tax', 'Leave', 'Claims'],
    authType:    'api_key',
  },
]

// ─────────────────────────────────────────────────────────────
// Helper: get providers for a given country
// ─────────────────────────────────────────────────────────────

export function getProvidersForCountry(countryCode: string): PayrollProvider[] {
  return PAYROLL_PROVIDERS.filter(p => p.countries.includes(countryCode))
}

export function getCurrency(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode] ?? 'USD'
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] ?? '$'
}

export function getDefaultTimezone(countryCode: string): string {
  return COUNTRY_TIMEZONES[countryCode]?.[0] ?? 'UTC'
}

// ─────────────────────────────────────────────────────────────
// Module pricing (per module per month, AUD base)
// Exchange rates relative to AUD for currency conversion
// ─────────────────────────────────────────────────────────────

export const FX_RATES: Record<string, number> = {
  AUD: 1.00, NZD: 1.08, USD: 0.64, CAD: 0.87,
  GBP: 0.51, EUR: 0.59, SGD: 0.87, MYR: 3.02,
  PHP: 36.5, INR: 53.8, AED: 2.35, SAR: 2.40,
  ZAR: 12.0, JPY: 98.0, HKD: 5.01, CNY: 4.64,
}

export const MODULE_MONTHLY_PRICE_AUD: Record<number, number> = {
  1:  0,     // Dashboard (free)
  2:  8,     // Employee Management
  3:  5,     // Roles & Access
  4:  4,     // Audit Logs
  5:  5,     // Documents
  6:  7,     // Compliance - Screening
  7:  5,     // Compliance - Lock
  8:  6,     // Compliance - Tracking
  9:  8,     // Onboarding
  10: 7,     // Training
  11: 6,     // Competencies
  12: 6,     // Supervision
  13: 7,     // Workforce Planning
  14: 9,     // Recruitment
  15: 6,     // Contracts
  16: 7,     // Performance Reviews
  17: 8,     // WHS & Safety
  18: 6,     // Grievances
  19: 5,     // Separation
  20: 8,     // Analytics
  21: 5,     // Benefits
  22: 4,     // Recognition
  23: 4,     // Referrals
  24: 5,     // DEI
  25: 6,     // Engagement
  26: 5,     // Assets
  27: 9,     // Rostering
  28: 12,    // Payroll
  29: 8,     // Leave Management
  30: 3,     // Public Holidays
}

export function convertAUD(amountAUD: number, targetCurrency: string): number {
  const rate = FX_RATES[targetCurrency] ?? 1
  return Math.round(amountAUD * rate * 100) / 100
}
