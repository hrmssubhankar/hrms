/**
 * Unit tests — JWT sign / verify
 * lib/auth/jwt.ts
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { signToken, signTempToken, verifyToken, type JWTPayload } from '@/lib/auth/jwt'

// Setup is done in setup.ts (sets JWT_SECRET)

const ypcDirectorPayload: JWTPayload = {
  sub:        'user-ypc-001',
  email:      'director@yahwehpc.com.au',
  role:       'tenant_user',
  tenantId:   '00000000-0000-0000-0000-000000000002',
  tenantSlug: 'yahwehpc',
  name:       'Director YPC',
  userRole:   'director',
}

const superAdminPayload: JWTPayload = {
  sub:   'admin-001',
  email: 'admin@yahwehhrms.com',
  role:  'super_admin',
  name:  'Super Admin',
}

// ── signToken / verifyToken ────────────────────────────────────────────────────

describe('signToken + verifyToken (round-trip)', () => {
  it('issues a verifiable token for a tenant user', async () => {
    const token = await signToken(ypcDirectorPayload)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT = header.payload.signature

    const decoded = await verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.sub).toBe(ypcDirectorPayload.sub)
    expect(decoded!.email).toBe(ypcDirectorPayload.email)
    expect(decoded!.role).toBe('tenant_user')
    expect(decoded!.tenantId).toBe(ypcDirectorPayload.tenantId)
    expect(decoded!.userRole).toBe('director')
  })

  it('issues a verifiable token for a super-admin', async () => {
    const token = await signToken(superAdminPayload)
    const decoded = await verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.role).toBe('super_admin')
    expect(decoded!.tenantId).toBeUndefined()
  })

  it('preserves all payload fields', async () => {
    const token = await signToken(ypcDirectorPayload)
    const decoded = await verifyToken(token)!
    expect(decoded!.tenantSlug).toBe('yahwehpc')
    expect(decoded!.name).toBe('Director YPC')
  })
})

// ── verifyToken — error cases ──────────────────────────────────────────────────

describe('verifyToken — invalid tokens', () => {
  it('returns null for a random string', async () => {
    const result = await verifyToken('not.a.jwt')
    expect(result).toBeNull()
  })

  it('returns null for an empty string', async () => {
    const result = await verifyToken('')
    expect(result).toBeNull()
  })

  it('returns null for a token signed with a different secret', async () => {
    // Manually craft a token with a different secret by tweaking signature
    const realToken = await signToken(ypcDirectorPayload)
    const parts = realToken.split('.')
    // Corrupt the signature segment
    const badToken = `${parts[0]}.${parts[1]}.invalidsignature`
    const result = await verifyToken(badToken)
    expect(result).toBeNull()
  })

  it('returns null for a truncated token', async () => {
    const realToken = await signToken(ypcDirectorPayload)
    const result = await verifyToken(realToken.slice(0, 30))
    expect(result).toBeNull()
  })
})

// ── signTempToken ──────────────────────────────────────────────────────────────

describe('signTempToken', () => {
  it('includes phase: totp in the payload', async () => {
    const token = await signTempToken({
      sub:      'user-ypc-001',
      email:    'director@yahwehpc.com.au',
      role:     'tenant_user',
      tenantId: '00000000-0000-0000-0000-000000000002',
    })
    const decoded = await verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.phase).toBe('totp')
  })

  it('is a valid JWT (3 segments)', async () => {
    const token = await signTempToken(superAdminPayload)
    expect(token.split('.').length).toBe(3)
  })

  it('temp token and regular token are distinct for same payload', async () => {
    const base = { sub: 'u1', email: 'e@e.com', role: 'tenant_user' as const }
    const temp    = await signTempToken(base)
    const regular = await signToken(base)
    expect(temp).not.toBe(regular)

    const decodedTemp    = await verifyToken(temp)
    const decodedRegular = await verifyToken(regular)
    expect(decodedTemp!.phase).toBe('totp')
    expect(decodedRegular!.phase).toBeUndefined()
  })
})
