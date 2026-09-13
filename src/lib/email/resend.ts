/**
 * src/lib/email/resend.ts
 *
 * Thin wrapper around the Resend SDK.
 *
 * Priority for API key / From address:
 *   1. Per-call override (tenantSettings passed by the caller)
 *   2. process.env.RESEND_API_KEY  +  process.env.EMAIL_FROM  (platform defaults)
 *
 * Per-tenant config is stored in tenant.settings:
 *   settings.smtp.resendApiKey  — per-tenant Resend key
 *   settings.smtp.useSmtp       — if true, use SMTP fields instead (future nodemailer path)
 *   settings.email.emailFrom    — override the From: header
 *   settings.email.replyTo      — override Reply-To:
 */

import { Resend } from 'resend'

export interface EmailPayload {
  to:      string | string[]
  subject: string
  html:    string
  text?:   string
}

export interface TenantEmailSettings {
  resendApiKey?: string
  emailFrom?:    string
  replyTo?:      string
}

/**
 * Send an email.
 *
 * @param payload        - recipients + subject + html/text body
 * @param tenantSettings - optional per-tenant overrides loaded from tenant.settings
 */
export async function sendEmail(
  payload: EmailPayload,
  tenantSettings?: TenantEmailSettings,
): Promise<void> {
  const apiKey = tenantSettings?.resendApiKey?.trim()
    || process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[sendEmail] No RESEND_API_KEY available — email skipped')
    return
  }

  const from = tenantSettings?.emailFrom?.trim()
    || process.env.EMAIL_FROM
    || 'HRMS <noreply@hrmsapp.com>'

  const resend = new Resend(apiKey)

  const result = await resend.emails.send({
    from,
    to:      Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html:    payload.html,
    ...(payload.text                        && { text:     payload.text }),
    ...(tenantSettings?.replyTo?.trim()    && { reply_to: tenantSettings.replyTo.trim() }),
  })

  if (result.error) {
    console.error('[sendEmail] Resend error:', result.error)
    throw new Error(result.error.message)
  }
}

/**
 * Helper — load per-tenant email settings from the settings JSONB so callers
 * don't need to know the shape.
 *
 * Usage:
 *   import { tenantEmailSettings } from '@/lib/email/resend'
 *   const tmpl = suspendedEmail(...)
 *   sendEmail(tmpl, tenantEmailSettings(tenant.settings))
 */
export function tenantEmailSettings(
  settings: Record<string, unknown> | null | undefined,
): TenantEmailSettings {
  const s = settings ?? {}
  const smtp  = (s.smtp  as Record<string, unknown> | undefined) ?? {}
  const email = (s.email as Record<string, unknown> | undefined) ?? {}
  return {
    resendApiKey: (smtp.resendApiKey  as string | undefined) || undefined,
    emailFrom:    (email.emailFrom    as string | undefined) || undefined,
    replyTo:      (email.replyTo      as string | undefined) || undefined,
  }
}
