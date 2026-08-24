/**
 * Unit tests — JWT helpers
 * src/lib/auth/jwt.ts
 */
import { describe, it, expect } from 'vitest'
import { signToken, signTempToken, verifyToken } from '@/lib/auth/jwt'

const BASE_PAYLOAD = {
  sub:      'u-1',
  email:    'director@acme.com',
  role:     'tenant_user' as const,
  tenantId: 't-1',
  userRole: 'director',
}

// ── signToken / verifyToken ───────────────────────────────────────────────────

describe('signToken + verifyToken', () => {
  it('round-trips a payload correctly', async () => {
    const token   = await signToken(BASE_PAYLOAD)
    const payload = await verifyToken(token)

    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe('u-1')
    expect(payload!.email).toBe('director@acme.com')
    expect(payload!.role).toBe('tenant_user')
    expect(payload!.tenantId).toBe('t-1')
    expect(payload!.userRole).toBe('director')
  })

  it('produces a string token with three JWT segments', async () => {
    const token = await signToken(BASE_PAYLOAD)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)
  })

  it('returns null for a tampered token', async () => {
    const token   = await signToken(BASE_PAYLOAD)
    const parts   = token.split('.')
    parts[1]      = Buffer.from('{"sub":"evil"}').toString('base64url')
    const tampered = parts.join('.')
    const result  = await verifyToken(tampered)
    expect(result).toBeNull()
  })

  it('returns null for a garbage string', async () => {
    expect(await verifyToken('not.a.jwt')).toBeNull()
    expect(await verifyToken('')).toBeNull()
  })

  it('includes optional fields when provided', async () => {
    const token   = await signToken({ ...BASE_PAYLOAD, tenantSlug: 'acme-corp', name: 'Alice' })
    const payload = await verifyToken(token)
    expect(payload!.tenantSlug).toBe('acme-corp')
    expect(payload!.name).toBe('Alice')
  })
})

// ── signTempToken ─────────────────────────────────────────────────────────────

describe('signTempToken', () => {
  it('sets phase: totp in the token payload', async () => {
    const token   = await signTempToken(BASE_PAYLOAD)
    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.phase).toBe('totp')
  })

  it('preserves the rest of the payload', async () => {
    const token   = await signTempToken(BASE_PAYLOAD)
    const payload = await verifyToken(token)
    expect(payload!.sub).toBe('u-1')
    expect(payload!.email).toBe('director@acme.com')
  })

  it('produces a different token from signToken for the same payload', async () => {
    const full = await signToken(BASE_PAYLOAD)
    const temp = await signTempToken(BASE_PAYLOAD)
    // Both are valid but structurally different (phase field, different expiry)
    expect(temp).not.toBe(full)
    const tempPayload = await verifyToken(temp)
    expect(tempPayload!.phase).toBe('totp')
    const fullPayload = await verifyToken(full)
    expect(fullPayload!.phase).toBeUndefined()
  })
})
