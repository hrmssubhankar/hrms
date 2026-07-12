/**
 * Resend email client — uses the Resend REST API via native fetch.
 * No package needed. Set RESEND_API_KEY in Vercel environment variables.
 *
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API = 'https://api.resend.com/emails'

export type EmailPayload = {
  to:      string | string[]
  subject: string
  html:    string
  text?:   string
  from?:   string   // defaults to RESEND_FROM env var or noreply@hrms.app
  replyTo?:string
}

export type SendResult =
  | { ok: true;  id: string }
  | { ok: false; error: string }

/**
 * Send a transactional email via Resend.
 * Returns { ok: true, id } on success or { ok: false, error } on failure.
 * Silently logs and returns failure if RESEND_API_KEY is not set (dev mode).
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email skipped:', payload.subject)
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const from = payload.from
    ?? process.env.RESEND_FROM
    ?? 'HRMS <noreply@hrms.app>'

  try {
    const res = await fetch(RESEND_API, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from,
        to:      Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html:    payload.html,
        text:    payload.text,
        reply_to: payload.replyTo,
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
