/**
 * Global test setup — runs before every test file.
 * Sets environment variables that lib/auth/jwt.ts reads at import time.
 */
import { vi } from 'vitest'

// Provide stable env vars — prevents env.ts validation from throwing
process.env.JWT_SECRET   = 'test-secret-min-32-chars-for-jest!!'
process.env.DATABASE_URL = 'postgresql://test:test@test.neon.tech/test'
process.env.NODE_ENV     = 'test'

// Stub Next.js cache headers (force-dynamic routes call this)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}))
