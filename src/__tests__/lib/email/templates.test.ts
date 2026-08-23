/**
 * Unit tests — email templates
 * src/lib/email/templates.ts
 *
 * These are pure functions (string in → { subject, html, text } out).
 * No mocking needed — just verify output shape and key content.
 */
import { describe, it, expect } from 'vitest'
import {
  welcomeEmail,
  payslipReadyEmail,
  documentExpiryEmail,
  documentExpiredEmail,
  onboardingWelcomeEmail,
  performanceReviewScheduledEmail,
  performanceReviewCompletedEmail,
  contractSentEmail,
} from '@/lib/email/templates'

// ── shared fixture ────────────────────────────────────────────────────────────

const BASE = {
  recipientName: 'Alice Smith',
  orgName:       'Acme Corp',
  logoUrl:       null,
  primaryColor:  '#4f46e5',
  loginUrl:      'https://hrms.example.com',
}

// ── helper ────────────────────────────────────────────────────────────────────

function expectShape(result: { subject: string; html: string; text: string }) {
  expect(result).toHaveProperty('subject')
  expect(result).toHaveProperty('html')
  expect(result).toHaveProperty('text')
  expect(result.subject.length).toBeGreaterThan(0)
  expect(result.html).toContain('</div>')
  expect(result.text.length).toBeGreaterThan(0)
}

// ── welcomeEmail ──────────────────────────────────────────────────────────────

describe('welcomeEmail', () => {
  it('returns correct shape', () => {
    expectShape(welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl }))
  })

  it('subject contains org name', () => {
    const { subject } = welcomeEmail({ ...BASE, role: 'Manager', loginUrl: BASE.loginUrl })
    expect(subject).toContain('Acme Corp')
  })

  it('html contains recipient name', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl })
    expect(html).toContain('Alice Smith')
  })

  it('html contains role', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'HR Admin', loginUrl: BASE.loginUrl })
    expect(html).toContain('HR Admin')
  })

  it('html contains login URL', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl })
    expect(html).toContain('https://hrms.example.com')
  })

  it('html contains temp password when provided', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl, tempPassword: 'TempP@ss123' })
    expect(html).toContain('TempP@ss123')
  })

  it('html does not contain temp password section when omitted', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl })
    expect(html).not.toContain('Temporary Password')
  })

  it('html uses primaryColor for header', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl })
    expect(html).toContain('#4f46e5')
  })

  it('html shows org name text when logoUrl is null', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl, logoUrl: null })
    expect(html).toContain('Acme Corp')
  })

  it('html shows img tag when logoUrl is provided', () => {
    const { html } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl, logoUrl: 'https://cdn.example.com/logo.png' })
    expect(html).toContain('<img')
    expect(html).toContain('https://cdn.example.com/logo.png')
  })

  it('text contains login URL', () => {
    const { text } = welcomeEmail({ ...BASE, role: 'Employee', loginUrl: BASE.loginUrl })
    expect(text).toContain('https://hrms.example.com')
  })
})

// ── payslipReadyEmail ─────────────────────────────────────────────────────────

describe('payslipReadyEmail', () => {
  const PAYSLIP = {
    ...BASE,
    periodStart: '2024-06-01',
    periodEnd:   '2024-06-30',
    grossPay:    5000,
    netPay:      4200,
    superAmount: 575,
  }

  it('returns correct shape', () => {
    expectShape(payslipReadyEmail(PAYSLIP))
  })

  it('subject contains period dates', () => {
    const { subject } = payslipReadyEmail(PAYSLIP)
    expect(subject).toContain('2024')
  })

  it('html contains net pay formatted as currency', () => {
    const { html } = payslipReadyEmail(PAYSLIP)
    expect(html).toContain('4,200.00')
  })

  it('html contains gross pay', () => {
    const { html } = payslipReadyEmail(PAYSLIP)
    expect(html).toContain('5,000.00')
  })

  it('html contains super amount', () => {
    const { html } = payslipReadyEmail(PAYSLIP)
    expect(html).toContain('575.00')
  })

  it('text contains all three pay figures', () => {
    const { text } = payslipReadyEmail(PAYSLIP)
    expect(text).toContain('5,000.00')
    expect(text).toContain('4,200.00')
    expect(text).toContain('575.00')
  })
})

// ── documentExpiryEmail ───────────────────────────────────────────────────────

describe('documentExpiryEmail', () => {
  const EXPIRY = {
    ...BASE,
    documentName: 'First Aid Certificate',
    expiryDate:   '30 June 2024',
    daysLeft:     14,
  }

  it('returns correct shape', () => {
    expectShape(documentExpiryEmail(EXPIRY))
  })

  it('subject contains document name and days left', () => {
    const { subject } = documentExpiryEmail(EXPIRY)
    expect(subject).toContain('First Aid Certificate')
    expect(subject).toContain('14')
  })

  it('subject uses singular "day" when daysLeft is 1', () => {
    const { subject } = documentExpiryEmail({ ...EXPIRY, daysLeft: 1 })
    expect(subject).toContain('1 day')
    expect(subject).not.toContain('1 days')
  })

  it('subject uses plural "days" when daysLeft > 1', () => {
    const { subject } = documentExpiryEmail({ ...EXPIRY, daysLeft: 7 })
    expect(subject).toContain('7 days')
  })

  it('html contains document name', () => {
    const { html } = documentExpiryEmail(EXPIRY)
    expect(html).toContain('First Aid Certificate')
  })

  it('html contains expiry date', () => {
    const { html } = documentExpiryEmail(EXPIRY)
    expect(html).toContain('30 June 2024')
  })

  it('text contains document name', () => {
    const { text } = documentExpiryEmail(EXPIRY)
    expect(text).toContain('First Aid Certificate')
  })
})

// ── documentExpiredEmail ──────────────────────────────────────────────────────

describe('documentExpiredEmail', () => {
  const EXPIRED = {
    ...BASE,
    documentName: 'Working With Children Check',
    expiredDate:  '1 May 2024',
  }

  it('returns correct shape', () => {
    expectShape(documentExpiredEmail(EXPIRED))
  })

  it('subject contains URGENT', () => {
    const { subject } = documentExpiredEmail(EXPIRED)
    expect(subject).toContain('URGENT')
  })

  it('subject contains document name', () => {
    const { subject } = documentExpiredEmail(EXPIRED)
    expect(subject).toContain('Working With Children Check')
  })

  it('html contains expired date', () => {
    const { html } = documentExpiredEmail(EXPIRED)
    expect(html).toContain('1 May 2024')
  })
})

// ── onboardingWelcomeEmail ────────────────────────────────────────────────────

describe('onboardingWelcomeEmail', () => {
  const ONBOARD = { ...BASE, startDate: '2024-07-01', taskCount: 5 }

  it('returns correct shape', () => {
    expectShape(onboardingWelcomeEmail(ONBOARD))
  })

  it('subject contains org name', () => {
    const { subject } = onboardingWelcomeEmail(ONBOARD)
    expect(subject).toContain('Acme Corp')
  })

  it('html contains task count', () => {
    const { html } = onboardingWelcomeEmail(ONBOARD)
    expect(html).toContain('5 onboarding tasks')
  })

  it('html uses singular "task" when taskCount is 1', () => {
    const { html } = onboardingWelcomeEmail({ ...ONBOARD, taskCount: 1 })
    expect(html).toContain('1 onboarding task')
    expect(html).not.toContain('1 onboarding tasks')
  })

  it('text contains login URL', () => {
    const { text } = onboardingWelcomeEmail(ONBOARD)
    expect(text).toContain('https://hrms.example.com')
  })
})

// ── performanceReviewScheduledEmail ──────────────────────────────────────────

describe('performanceReviewScheduledEmail', () => {
  const REVIEW = { ...BASE, reviewType: 'Annual', scheduledDate: '2024-08-15' }

  it('returns correct shape', () => {
    expectShape(performanceReviewScheduledEmail(REVIEW))
  })

  it('subject contains review type and org name', () => {
    const { subject } = performanceReviewScheduledEmail(REVIEW)
    expect(subject).toContain('Annual')
    expect(subject).toContain('Acme Corp')
  })

  it('html contains reviewer name when provided', () => {
    const { html } = performanceReviewScheduledEmail({ ...REVIEW, reviewerName: 'Bob Jones' })
    expect(html).toContain('Bob Jones')
  })

  it('html does not show reviewer line when omitted', () => {
    const { html } = performanceReviewScheduledEmail(REVIEW)
    expect(html).not.toContain('Reviewer:')
  })

  it('text contains review date', () => {
    const { text } = performanceReviewScheduledEmail(REVIEW)
    expect(text).toContain('2024-08-15')
  })
})

// ── performanceReviewCompletedEmail ──────────────────────────────────────────

describe('performanceReviewCompletedEmail', () => {
  const COMPLETED = { ...BASE, reviewType: 'Mid-Year' }

  it('returns correct shape', () => {
    expectShape(performanceReviewCompletedEmail(COMPLETED))
  })

  it('html contains overall rating when provided', () => {
    const { html } = performanceReviewCompletedEmail({ ...COMPLETED, overallRating: 'Exceeds Expectations' })
    expect(html).toContain('Exceeds Expectations')
  })

  it('html does not show rating section when omitted', () => {
    const { html } = performanceReviewCompletedEmail(COMPLETED)
    expect(html).not.toContain('Overall Rating')
  })

  it('text mentions rating when provided', () => {
    const { text } = performanceReviewCompletedEmail({ ...COMPLETED, overallRating: 'Meets Expectations' })
    expect(text).toContain('Meets Expectations')
  })
})

// ── contractSentEmail ─────────────────────────────────────────────────────────

describe('contractSentEmail', () => {
  const CONTRACT = { ...BASE, contractType: 'Full-Time Employment' }

  it('returns correct shape', () => {
    expectShape(contractSentEmail(CONTRACT))
  })

  it('subject contains contract type and org name', () => {
    const { subject } = contractSentEmail(CONTRACT)
    expect(subject).toContain('Full-Time Employment')
    expect(subject).toContain('Acme Corp')
  })

  it('html contains contract type', () => {
    const { html } = contractSentEmail(CONTRACT)
    expect(html).toContain('Full-Time Employment')
  })

  it('html contains link to contracts page', () => {
    const { html } = contractSentEmail(CONTRACT)
    expect(html).toContain('/tenant/contracts')
  })
})
