/**
 * Resend email client — uses the Resend REST API via native fetch.
 * No package needed. Set RESEND_API_KEY in Vercel environment variables.
 *
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Per-tenant override priority:
 *   1. payload.from / tenantSettings.resendApiKey  (per-client config from super admin)
 *   2. process.env.RESEND_API_KEY / RESEND_FROM    (platform defaults)
 */

const RESEND_API = 'https://api.resend.com/emails'

export type EmailPayload = {
  to:       string | string[]
  subject:  string
  html:     string
  text?:    string
  from?:    string   // defaults to RESEND_FROM env var or noreply@hrms.app
  replyTo?: string
}

export type TenantEmailSettings = {
  resendApiKey?: string
  emailFrom?:    string
  replyTo?:      string
}

export type SendResult =
  | { ok: true;  id: string }
  | { ok: false; error: string }

/**
 * Send a transactional email via Resend.
 * Returns { ok: true, id } on success or { ok: false, error } on failure.
 * Silently logs and returns failure if no RESEND_API_KEY is available (dev mode).
 *
 * @param payload        - to, subject, html/text body, optional from/replyTo
 * @param tenantSettings - optional per-tenant overrides from tenant.settings JSONB
 */
export async function sendEmail(
  payload: EmailPayload,
  tenantSettings?: TenantEmailSettings,
): Promise<SendResult> {
  const apiKey = tenantSettings?.resendApiKey?.trim()
    || process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[email] No RESEND_API_KEY — email skipped:', payload.subject)
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const from = payload.from
    ?? tenantSettings?.emailFrom?.trim()
    ?? process.env.RESEND_FROM
    ?? 'HRMS <noreply@hrms.app>'

  const replyTo = payload.replyTo
    ?? tenantSettings?.replyTo?.trim()

  try {
    const res = await fetch(RESEND_API, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from,
        to:       Array.isArray(payload.to) ? payload.to : [payload.to],
        subject:  payload.subject,
        html:     payload.html,
        text:     payload.text,
        reply_to: replyTo,
      }),
    })

    const data = await res.json() as { id?: string; name?: string; message?: string }

    if (!res.ok) {
      console.error('[email] Resend error:', data)
      return { ok: false, error: data.message ?? data.name ?? 'Send failed' }
    }

    return { ok: true, id: data.id! }
  } catch (err: any) {
    console.error('[email] Network error:', err)
    return { ok: false, error: err.message ?? 'Network error' }
  }
}

/**
 * Extract per-tenant email overrides from the tenant settings JSONB.
 * Pass the result as the second argument to sendEmail().
 *
 * Usage:
 *   const emailOpts = tenantEmailSettings(tenant.settings)
 *   sendEmail({ to: admins, ...tmpl }, emailOpts)
 */
export function tenantEmailSettings(
  settings: Record<string, unknown> | null | undefined,
): TenantEmailSettings {
  const s     = settings ?? {}
  const smtp  = (s.smtp  as Record<string, unknown> | undefined) ?? {}
  const email = (s.email as Record<string, unknown> | undefined) ?? {}
  return {
    resendApiKey: (smtp.resendApiKey as string | undefined) || undefined,
    emailFrom:    (email.emailFrom   as string | undefined) || undefined,
    replyTo:      (email.replyTo     as string | undefined) || undefined,
  }
}
