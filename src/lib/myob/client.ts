/**
 * MYOB AccountRight OAuth2 + API client
 *
 * Tokens stored in tenant.settings.myob:
 * {
 *   accessToken:      string
 *   refreshToken:     string
 *   expiresAt:        number   (Unix ms)
 *   companyFileUri:   string   (e.g. https://api.myob.com/accountright/{guid})
 *   companyFileName:  string
 * }
 *
 * MYOB API docs: https://developer.myob.com/api/accountright/v2/
 */

import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const MYOB_AUTH_URL   = 'https://secure.myob.com/oauth2/account/authorize'
const MYOB_TOKEN_URL  = 'https://secure.myob.com/oauth2/v1/authorize'
const MYOB_API_BASE   = 'https://api.myob.com/accountright'

export type MyobTokens = {
  accessToken:     string
  refreshToken:    string
  expiresAt:       number
  companyFileUri:  string
  companyFileName: string
}

export type MyobCompanyFile = {
  Id:   string
  Name: string
  Uri:  string
}

// ── OAuth helpers ──────────────────────────────────────────────────────────────

export function myobRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  return `${base}/api/tenant/myob/callback`
}

export function myobAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.MYOB_CLIENT_ID!,
    redirect_uri:  myobRedirectUri(),
    response_type: 'code',
    scope:         'CompanyFile',
    state,
  })
  return `${MYOB_AUTH_URL}?${params}`
}

export async function myobExchangeCode(
  code: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const res = await fetch(MYOB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.MYOB_CLIENT_ID!,
      client_secret: process.env.MYOB_CLIENT_SECRET!,
      redirect_uri:  myobRedirectUri(),
      grant_type:    'authorization_code',
      code,
    }),
  })
  if (!res.ok) throw new Error(`MYOB token exchange failed: ${await res.text()}`)
  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  }
}

export async function myobRefreshToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const res = await fetch(MYOB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.MYOB_CLIENT_ID!,
      client_secret: process.env.MYOB_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('MYOB token refresh failed — reconnect required')
  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  }
}

// ── Company files ──────────────────────────────────────────────────────────────

export async function listMyobCompanyFiles(accessToken: string): Promise<MyobCompanyFile[]> {
  const res = await fetch(MYOB_API_BASE, {
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'x-myobapi-key': process.env.MYOB_CLIENT_ID!,
    },
  })
  if (!res.ok) throw new Error(`MYOB company files error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  // MYOB returns an array of company files directly
  return Array.isArray(data) ? data : []
}

// ── Token storage ──────────────────────────────────────────────────────────────

export async function saveMyobTokens(tenantId: string, tokens: MyobTokens): Promise<void> {
  const [current] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const existing  = (current?.settings ?? {}) as Record<string, unknown>
  await db.update(tenants)
    .set({ settings: { ...existing, myob: tokens }, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
}

export async function getMyobTokens(tenantId: string): Promise<MyobTokens | null> {
  const [row] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const settings = row?.settings as Record<string, unknown> | null
  return (settings?.myob as MyobTokens) ?? null
}

export async function clearMyobTokens(tenantId: string): Promise<void> {
  const [current] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId))
  const existing  = { ...(current?.settings as Record<string, unknown> ?? {}) }
  delete existing.myob
  await db.update(tenants).set({ settings: existing, updatedAt: new Date() }).where(eq(tenants.id, tenantId))
}

// ── Valid access token (auto-refresh) ──────────────────────────────────────────

export async function getValidMyobToken(
  tenantId: string,
): Promise<{ accessToken: string; companyFileUri: string } | null> {
  const tokens = await getMyobTokens(tenantId)
  if (!tokens) return null

  if (Date.now() < tokens.expiresAt) {
    return { accessToken: tokens.accessToken, companyFileUri: tokens.companyFileUri }
  }

  try {
    const refreshed = await myobRefreshToken(tokens.refreshToken)
    const updated: MyobTokens = { ...tokens, ...refreshed }
    await saveMyobTokens(tenantId, updated)
    return { accessToken: updated.accessToken, companyFileUri: updated.companyFileUri }
  } catch {
    await clearMyobTokens(tenantId)
    return null
  }
}

// ── MYOB API helper ────────────────────────────────────────────────────────────

export async function myobApiPost(
  accessToken: string,
  companyFileUri: string,
  endpoint: string,
  body: unknown,
): Promise<unknown> {
  const url = `${companyFileUri}/${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:   `Bearer ${accessToken}`,
      'x-myobapi-key': process.env.MYOB_CLIENT_ID!,
      'Content-Type':  'application/json',
      Accept:          'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MYOB API error ${res.status}: ${await res.text()}`)
  // MYOB returns 200 with body or 201 with location header
  const text = await res.text()
  return text ? JSON.parse(text) : { ok: true }
}
