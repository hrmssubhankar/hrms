/**
 * Email templates — HTML emails for HRMS transactional messages.
 * All templates return { subject, html, text }.
 */

type TemplateResult = { subject: string; html: string; text: string }

const brand = (primaryColor = '#1a4fff') => `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:${primaryColor};padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.3px;">HRMS</h1>
    </div>
`

const footer = (orgName = 'Your Organisation') => `
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">
        This email was sent by <strong>${orgName}</strong> via HRMS.<br>
        If you did not expect this email, you can safely ignore it.
      </p>
    </div>
  </div>
`

const body = (content: string) => `
  <div style="padding:32px;">
    ${content}
  </div>
`

// ─── Templates ──────────────────────────────────────────────────────────────

/** Sent when a new portal user is invited (Roles & Access) */
export function welcomeEmail(opts: {
  recipientName: string
  orgName:       string
  role:          string
  loginUrl:      string
  tempPassword?: string
  primaryColor?: string
}): TemplateResult {
  const subject = `Welcome to ${opts.orgName} — Your HRMS account is ready`
  const html = `
${brand(opts.primaryColor)}
${body(`
  <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 8px;">Welcome, ${opts.recipientName}! 👋</h2>
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
    Your <strong>${opts.orgName}</strong> HR portal account has been created with the role <strong>${opts.role}</strong>.
  </p>
  ${opts.tempPassword ? `
  <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="color:#374151;font-size:13px;margin:0 0 4px;font-weight:600;">Temporary password</p>
    <p style="font-family:monospace;font-size:16px;color:#111827;margin:0;letter-spacing:1px;">${opts.tempPassword}</p>
    <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">Please change this on first login.</p>
  </div>
  ` : ''}
  <a href="${opts.loginUrl}" style="display:inline-block;background:#1a4fff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    Sign in to your portal →
  </a>
`)}
${footer(opts.orgName)}
  `
  const text = `Welcome to ${opts.orgName}!\n\nYour HRMS account (${opts.role}) is ready.\n${opts.tempPassword ? `Temporary password: ${opts.tempPassword}\n` : ''}Sign in: ${opts.loginUrl}`
  return { subject, html, text }
}

/** Sent to payroll officer / employee when a pay run is marked Paid */
export function payslipReadyEmail(opts: {
  recipientName:   string
  orgName:         string
  periodStart:     string
  periodEnd:       string
  grossPay:        number
  netPay:          number
  superAmount:     number
  loginUrl:        string
  primaryColor?:   string
}): TemplateResult {
  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
  const subject = `Your payslip is ready — ${opts.periodStart} to ${opts.periodEnd}`
  const html = `
${brand(opts.primaryColor)}
${body(`
  <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 8px;">Your payslip is ready 💰</h2>
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
    Hi ${opts.recipientName}, your pay run for <strong>${opts.periodStart}</strong> to <strong>${opts.periodEnd}</strong> has been processed.
  </p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 0;color:#6b7280;font-size:14px;">Gross Pay</td>
      <td style="padding:10px 0;text-align:right;font-weight:600;color:#111827;">${fmt(opts.grossPay)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 0;color:#6b7280;font-size:14px;">Net Pay (take-home)</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:#16a34a;font-size:16px;">${fmt(opts.netPay)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:#6b7280;font-size:14px;">Employer Super (11.5%)</td>
      <td style="padding:10px 0;text-align:right;color:#7c3aed;font-weight:600;">${fmt(opts.superAmount)}</td>
    </tr>
  </table>
  <a href="${opts.loginUrl}" style="display:inline-block;background:#1a4fff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    View full payslip →
  </a>
`)}
${footer(opts.orgName)}
  `
  const text = `Your payslip is ready.\nPeriod: ${opts.periodStart} to ${opts.periodEnd}\nGross: ${fmt(opts.grossPay)} | Net: ${fmt(opts.netPay)} | Super: ${fmt(opts.superAmount)}\nView: ${opts.loginUrl}`
  return { subject, html, text }
}

/** Sent 7 days before a compliance document expires */
export function documentExpiryEmail(opts: {
  recipientName: string
  orgName:       string
  documentName:  string
  expiryDate:    string
  daysLeft:      number
  loginUrl:      string
  primaryColor?: string
}): TemplateResult {
  const subject = `Action required: ${opts.documentName} expires in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}`
  const html = `
${brand(opts.primaryColor)}
${body(`
  <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 8px;">Document expiring soon ⚠️</h2>
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
    Hi ${opts.recipientName}, the following compliance document is expiring soon and needs to be renewed.
  </p>
  <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="color:#78350f;font-weight:600;font-size:14px;margin:0 0 4px;">${opts.documentName}</p>
    <p style="color:#92400e;font-size:13px;margin:0;">
      Expires: <strong>${opts.expiryDate}</strong> — <strong>${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'} remaining</strong>
    </p>
  </div>
  <a href="${opts.loginUrl}/tenant/compliance" style="display:inline-block;background:#1a4fff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    Manage compliance →
  </a>
`)}
${footer(opts.orgName)}
  `
  const text = `Document expiring: ${opts.documentName}\nExpiry: ${opts.expiryDate} (${opts.daysLeft} days)\nManage: ${opts.loginUrl}/tenant/compliance`
  return { subject, html, text }
}

/** Sent when onboarding tasks are assigned to a new employee */
export function onboardingWelcomeEmail(opts: {
  recipientName: string
  orgName:       string
  startDate:     string
  taskCount:     number
  loginUrl:      string
  primaryColor?: string
}): TemplateResult {
  const subject = `Welcome to ${opts.orgName} — Your onboarding checklist is ready`
  const html = `
${brand(opts.primaryColor)}
${body(`
  <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 8px;">Your onboarding starts now 🎉</h2>
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
    Hi ${opts.recipientName}! We're excited to have you join <strong>${opts.orgName}</strong>.
    Your start date is <strong>${opts.startDate}</strong>.
  </p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="color:#1e40af;font-size:14px;margin:0;">
      You have <strong>${opts.taskCount} onboarding task${opts.taskCount === 1 ? '' : 's'}</strong> waiting for you in the portal.
    </p>
  </div>
  <a href="${opts.loginUrl}/tenant/onboarding" style="display:inline-block;background:#1a4fff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    View your tasks →
  </a>
`)}
${footer(opts.orgName)}
  `
  const text = `Welcome to ${opts.orgName}!\nStart date: ${opts.startDate}\nYou have ${opts.taskCount} onboarding tasks waiting.\nView: ${opts.loginUrl}/tenant/onboarding`
  return { subject, html, text }
}

/** Generic notification email */
export function genericNotificationEmail(opts: {
  recipientName: string
  orgName:       string
  title:         string
  message:       string
  ctaLabel?:     string
  ctaUrl?:       string
  primaryColor?: string
}): TemplateResult {
  const subject = `${opts.title} — ${opts.orgName}`
  const html = `
${brand(opts.primaryColor)}
${body(`
  <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 8px;">${opts.title}</h2>
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
    Hi ${opts.recipientName},<br/><br/>${opts.message}
  </p>
  ${opts.ctaUrl ? `
  <a href="${opts.ctaUrl}" style="display:inline-block;background:#1a4fff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    ${opts.ctaLabel ?? 'View in portal →'}
  </a>
  ` : ''}
`)}
${footer(opts.orgName)}
  `
  const text = `${opts.title}\n\nHi ${opts.recipientName},\n\n${opts.message}${opts.ctaUrl ? `\n\n${opts.ctaLabel ?? 'View'}: ${opts.ctaUrl}` : ''}`
  return { subject, html, text }
}
