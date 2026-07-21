import { SignJWT, jwtVerify } from 'jose'

export type JWTPayload = {
  sub: string        // user id
  email: string
  role: 'super_admin' | 'tenant_user'
  tenantId?: string  // only for tenant users
  tenantSlug?: string
  name?: string
  userRole?: string  // tenant user's actual DB role (director, hr_officer, etc.)
  phase?: 'totp'     // present only in short-lived 2FA challenge tokens
}

function getSecret() {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

/**
 * Short-lived token for the 2FA challenge step (5 minutes).
 * Contains phase: 'totp' so the challenge route can distinguish it
 * from a full session token.
 */
export async function signTempToken(payload: Omit<JWTPayload, 'phase'>): Promise<string> {
  return new SignJWT({ ...payload, phase: 'totp' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
