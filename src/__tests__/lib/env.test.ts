/**
 * Unit tests — environment variable validation
 * src/lib/env.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateEnv } from '@/lib/env'

// Preserve original env and restore after each test
const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  // Ensure required vars are set by default
  process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'
  process.env.JWT_SECRET   = 'test-secret-min-32-chars-for-jest!!'
  process.env.NODE_ENV     = 'test'
})

afterEach(() => {
  // Restore original env
  Object.keys(process.env).forEach(k => { if (!(k in ORIGINAL_ENV)) delete process.env[k] })
  Object.assign(process.env, ORIGINAL_ENV)
})

describe('validateEnv — happy path', () => {
  it('does not throw when all required vars are present and valid', () => {
    expect(() => validateEnv()).not.toThrow()
  })

  it('does not throw when optional vars are absent', () => {
    delete process.env.RESEND_API_KEY
    delete process.env.APP_URL
    expect(() => validateEnv()).not.toThrow()
  })

  it('does not throw when optional vars are valid', () => {
    process.env.RESEND_API_KEY = 're_abc123'
    process.env.APP_URL        = 'https://example.com'
    expect(() => validateEnv()).not.toThrow()
  })
})

describe('validateEnv — DATABASE_URL', () => {
  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL
    expect(() => validateEnv()).toThrow(/DATABASE_URL/)
  })

  it('throws when DATABASE_URL does not start with "postgres"', () => {
    process.env.DATABASE_URL = 'mysql://invalid'
    expect(() => validateEnv()).toThrow(/DATABASE_URL/)
  })

  it('accepts postgresql:// prefix', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db'
    expect(() => validateEnv()).not.toThrow()
  })

  it('accepts postgres:// prefix', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host/db'
    expect(() => validateEnv()).not.toThrow()
  })
})

describe('validateEnv — JWT_SECRET', () => {
  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET
    expect(() => validateEnv()).toThrow(/JWT_SECRET/)
  })

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    process.env.JWT_SECRET = 'too-short'
    expect(() => validateEnv()).toThrow(/JWT_SECRET/)
  })

  it('accepts a 32-character secret', () => {
    process.env.JWT_SECRET = 'exactly-32-chars-long-secret-key!'
    expect(() => validateEnv()).not.toThrow()
  })

  it('accepts a secret longer than 32 characters', () => {
    process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-that-exceeds-32-chars'
    expect(() => validateEnv()).not.toThrow()
  })
})

describe('validateEnv — optional var validation', () => {
  it('does not throw when RESEND_API_KEY is invalid (optional)', () => {
    process.env.RESEND_API_KEY = 'invalid-key'
    // Invalid optional vars produce warnings, not errors
    expect(() => validateEnv()).not.toThrow()
  })

  it('does not throw when APP_URL is invalid (optional)', () => {
    process.env.APP_URL = 'not-a-url'
    expect(() => validateEnv()).not.toThrow()
  })
})

describe('validateEnv — error message content', () => {
  it('includes all missing required var names in one error', () => {
    delete process.env.DATABASE_URL
    delete process.env.JWT_SECRET

    let message = ''
    try {
      validateEnv()
    } catch (e) {
      message = (e as Error).message
    }

    expect(message).toContain('DATABASE_URL')
    expect(message).toContain('JWT_SECRET')
  })
})
