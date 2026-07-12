/**
 * Xero OAuth2 + API client
 *
 * Tokens stored in tenant.settings.xero:
 * {
 *   accessToken:  string
 *   refreshToken: string
 *   expiresAt:    number  (Unix ms)
 *   xeroTenantId: string  (Xero organisation ID)
 *   orgName:      string
 * }
 */

import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const XERO_TOKEN_URL  = 'https://identity.xero.com/connect/token'
const XERO_CONNECTIONS = 'https://api.xero.com/connections'

export type XeroTokens = {
  accessToken:  string
  refreshToken: string
  expiresAt:    number
  xeroTenantId: string
  orgName:      string
}

// ── OAuth helpers ─────────────────────────────────────────────────────────────

export function xeroAuthUrl(state: string): string {
  const clientId   = process.env.XERO_CLIENT_ID!
  const redirectUri = xeroRedirectUri()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         'openid profile email accounting.journals.read accounting.transactions offline_access',
    state,
  })
  return `https://login.xero.com/identity/connect/authorize?${params}`
}

export function xeroRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  return `${base}/api/tenant/xero/callback`
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const clientId     = process.env.XERO_CLIENT_ID!
  const clientSecret = process.env.XERO_CLIENT_SECRET!
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: xeroRedirectUri(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Xero token exchange failed: ${err}`)
  }

  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,  // 60s buffer
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const clientId     = process.env.XERO_CLIENT_ID!
  const clientSecret = process.env.XERO_CLIENT_SECRET!
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error('Xero token refresh failed — reconnect required')

  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  }
}

export async function getXeroConnections(accessToken: string): Promise<Array<{ tenantId: string; tenantName: string }>> {
  const res = await fetch(XERO_CONNECTIONS, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Xero connections')
  const data = await res.json()
  return data.map((c: any) => ({ tenantId: c.tenantId, tenantName: c.tenantName }))
}

// ── Token storage ─────────────────────────────────────────────────────────────

export async function saveXeroTokens(tenantId: string, tokens: XeroTokens): Promise<void> {
  const [current] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const existing  = (current?.settings ?? {}) as Record<string, unknown>
  await db.update(tenants)
    .set({ settings: { ...existing, xero: tokens }, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
}

export async function getXeroTokens(tenantId: string): Promise<XeroTokens | null> {
  const [row] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const settings = row?.settings as Record<string, unknown> | null
  return (settings?.xero as XeroTokens) ?? null
}

export async function clearXeroTokens(tenantId: string): Promise<void> {
  const [current] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const existing  = { ...(current?.settings as Record<string, unknown> ?? {}) }
  delete existing.xero
  await db.update(tenants).set({ settings: existing, updatedAt: new Date() }).where(eq(tenants.id, tenantId))
}

// ── Valid access token (auto-refresh) ─────────────────────────────────────────

export async function getValidAccessToken(tenantId: string): Promise<{ accessToken: string; xeroTenantId: string } | null> {
  const tokens = await getXeroTokens(tenantId)
  if (!tokens) return null

  if (Date.now() < tokens.expiresAt) {
    return { accessToken: tokens.accessToken, xeroTenantId: tokens.xeroTenantId }
  }

  // Refresh
  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    const updated: XeroTokens = { ...tokens, ...refreshed }
    await saveXeroTokens(tenantId, updated)
    return { accessToken: updated.accessToken, xeroTenantId: updated.xeroTenantId }
  } catch {
    // Refresh failed — clear tokens so user reconnects
    await clearXeroTokens(tenantId)
    return null
  }
}

// ── Xero API call helper ───────────────────────────────────────────────────────

export async function xeroApiGet(accessToken: string, xeroTenantId: string, path: string) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Xero-tenant-id': xeroTenantId,
      Accept:          'application/json',
    },
  })
  if (!res.ok) throw new Error(`Xero API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function xeroApiPost(accessToken: string, xeroTenantId: string, path: string, body: unknown) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
    method:  'POST',
    headers: {
      Authorization:    `Bearer ${accessToken}`,
      'Xero-tenant-id': xeroTenantId,
      'Content-Type':   'application/json',
      Accept:           'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Xero API error ${res.status}: ${await res.text()}`)
  return res.json()
}
