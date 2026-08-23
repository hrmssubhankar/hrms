/**
 * Unit tests — CSV export utility
 * src/lib/exportCsv.ts
 *
 * vitest runs in node environment (no DOM), so we stub all browser globals
 * with vi.stubGlobal before calling exportCsv().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportCsv, fmtCsvDate, fmtCsvCurrency } from '@/lib/exportCsv'

// ── State captured by stubs ────────────────────────────────────────────────────

let capturedParts: string[] = []
let downloadAttr = ''
const clickSpy = vi.fn()

function capturedCsv() { return capturedParts.join('') }

function makeAnchor() {
  const el: Record<string, unknown> = { href: '', click: clickSpy }
  Object.defineProperty(el, 'download', {
    get() { return downloadAttr },
    set(v: string) { downloadAttr = v },
    configurable: true,
  })
  return el
}

// Stub browser globals — accessed inside exportCsv() body, not at import time
vi.stubGlobal('Blob', function(parts: string[]) {
  capturedParts = parts
  return {} as Blob
})
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})
vi.stubGlobal('document', {
  body: {
    appendChild: vi.fn((n: unknown) => n),
    removeChild: vi.fn((n: unknown) => n),
  },
  createElement: vi.fn((tag: string) => tag === 'a' ? makeAnchor() : {}),
})

beforeEach(() => {
  capturedParts = []
  downloadAttr  = ''
  clickSpy.mockClear()
})

// ── exportCsv — header generation ─────────────────────────────────────────────

describe('exportCsv — header row', () => {
  it('generates correct CSV header from columns', () => {
    exportCsv({
      filename: 'test',
      columns: [
        { header: 'First Name', key: 'firstName' },
        { header: 'Last Name',  key: 'lastName' },
        { header: 'Email',      key: 'email' },
      ],
      rows: [],
    })

    expect(capturedCsv()).toContain('First Name,Last Name,Email')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('wraps header containing comma in quotes', () => {
    exportCsv({
      filename: 'test',
      columns: [{ header: 'Name, Role', key: 'name' }],
      rows: [],
    })

    expect(capturedCsv()).toContain('"Name, Role"')
  })
})

// ── exportCsv — row data ───────────────────────────────────────────────────────

describe('exportCsv — row output', () => {
  it('outputs row values in column order', () => {
    exportCsv({
      filename: 'test',
      columns: [
        { header: 'First', key: 'firstName' },
        { header: 'Last',  key: 'lastName' },
      ],
      rows: [{ firstName: 'Alice', lastName: 'Smith' }],
    })

    expect(capturedCsv()).toContain('Alice,Smith')
  })

  it('outputs empty string for null/undefined values', () => {
    exportCsv({
      filename: 'test',
      columns: [{ header: 'Note', key: 'note' }],
      rows: [{ note: null }],
    })

    const lines = capturedCsv().split('\r\n')
    expect(lines[1]).toBe('')
  })

  it('applies format function when provided', () => {
    exportCsv({
      filename: 'test',
      columns: [
        { header: 'Status', key: 'status', format: (v) => String(v).toUpperCase() },
      ],
      rows: [{ status: 'active' }],
    })

    expect(capturedCsv()).toContain('ACTIVE')
  })

  it('format function receives row as second arg for cross-field access', () => {
    exportCsv({
      filename: 'test',
      columns: [
        {
          header: 'Full Name',
          key: 'firstName',
          format: (_: unknown, r: any) => `${r.firstName} ${r.lastName}`,
        },
      ],
      rows: [{ firstName: 'Jane', lastName: 'Doe' }],
    })

    expect(capturedCsv()).toContain('Jane Doe')
  })

  it('wraps cell value containing comma in quotes', () => {
    exportCsv({
      filename: 'test',
      columns: [{ header: 'Address', key: 'address' }],
      rows: [{ address: '12 Main St, Sydney' }],
    })

    expect(capturedCsv()).toContain('"12 Main St, Sydney"')
  })

  it('escapes double quotes in cell values', () => {
    exportCsv({
      filename: 'test',
      columns: [{ header: 'Note', key: 'note' }],
      rows: [{ note: 'Say "hello"' }],
    })

    expect(capturedCsv()).toContain('"Say ""hello"""')
  })

  it('outputs multiple rows separated by CRLF', () => {
    exportCsv({
      filename: 'test',
      columns: [{ header: 'Name', key: 'name' }],
      rows: [{ name: 'Alice' }, { name: 'Bob' }],
    })

    expect(capturedCsv()).toContain('Alice\r\nBob')
  })
})

// ── exportCsv — filename handling ─────────────────────────────────────────────

describe('exportCsv — filename', () => {
  it('appends .csv if not already present', () => {
    exportCsv({ filename: 'employees', columns: [{ header: 'Name', key: 'name' }], rows: [] })
    expect(downloadAttr).toBe('employees.csv')
  })

  it('does not double-append .csv if already present', () => {
    exportCsv({ filename: 'employees.csv', columns: [{ header: 'Name', key: 'name' }], rows: [] })
    expect(downloadAttr).toBe('employees.csv')
  })
})

// ── fmtCsvDate ─────────────────────────────────────────────────────────────────

describe('fmtCsvDate', () => {
  it('formats YYYY-MM-DD as DD/MM/YYYY', () => {
    expect(fmtCsvDate('2024-01-15')).toBe('15/01/2024')
  })

  it('formats ISO datetime string correctly', () => {
    const result = fmtCsvDate('2024-06-30T14:30:00.000Z')
    expect(result).toMatch(/\d{1,2}\/\d{2}\/2024/)
  })

  it('returns empty string for null', () => {
    expect(fmtCsvDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(fmtCsvDate(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(fmtCsvDate('')).toBe('')
  })
})

// ── fmtCsvCurrency ─────────────────────────────────────────────────────────────

describe('fmtCsvCurrency', () => {
  it('formats number to 2 decimal places', () => {
    expect(fmtCsvCurrency(1234.5)).toBe('1234.50')
  })

  it('formats string number correctly', () => {
    expect(fmtCsvCurrency('99.9')).toBe('99.90')
  })

  it('returns empty string for null', () => {
    expect(fmtCsvCurrency(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(fmtCsvCurrency(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(fmtCsvCurrency('')).toBe('')
  })

  it('handles zero correctly', () => {
    expect(fmtCsvCurrency(0)).toBe('0.00')
  })

  it('handles negative numbers', () => {
    expect(fmtCsvCurrency(-50.75)).toBe('-50.75')
  })
})
