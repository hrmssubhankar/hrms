/**
 * Unit tests — CSV export utilities
 * src/lib/exportCsv.ts
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fmtCsvDate, fmtCsvCurrency, exportCsv } from '@/lib/exportCsv'

// ── fmtCsvDate ────────────────────────────────────────────────────────────────

describe('fmtCsvDate', () => {
  it('formats a YYYY-MM-DD date as DD/MM/YYYY (en-AU)', () => {
    const result = fmtCsvDate('2024-03-15')
    expect(result).toMatch(/15\/03\/2024/)
  })

  it('formats an ISO datetime string', () => {
    const result = fmtCsvDate('2024-03-15T09:00:00Z')
    expect(result).toBeTruthy()
    expect(result).toMatch(/2024/)
  })

  it('returns empty string for null', () => {
    expect(fmtCsvDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(fmtCsvDate(undefined)).toBe('')
  })
})

// ── fmtCsvCurrency ────────────────────────────────────────────────────────────

describe('fmtCsvCurrency', () => {
  it('formats a number to 2 decimal places', () => {
    expect(fmtCsvCurrency(1234.5)).toBe('1234.50')
    expect(fmtCsvCurrency(0)).toBe('0.00')
    expect(fmtCsvCurrency(99.999)).toBe('100.00')
  })

  it('formats a numeric string', () => {
    expect(fmtCsvCurrency('3000.00')).toBe('3000.00')
    expect(fmtCsvCurrency('1500')).toBe('1500.00')
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
})

// ── exportCsv (DOM-dependent) ─────────────────────────────────────────────────

// jsdom doesn't implement these — stub them so vi.spyOn can wrap them.
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => ''
  URL.revokeObjectURL = () => {}
}

describe('exportCsv', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy:       ReturnType<typeof vi.spyOn>
  let createUrlSpy:   ReturnType<typeof vi.spyOn>
  let revokeUrlSpy:   ReturnType<typeof vi.spyOn>
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let fakeLink: HTMLAnchorElement

  beforeEach(() => {
    fakeLink = Object.assign(document.createElement('a'), { href: '', download: '' })
    clickSpy          = vi.spyOn(fakeLink, 'click').mockImplementation(() => {})
    createElementSpy  = vi.spyOn(document, 'createElement').mockReturnValue(fakeLink as any)
    appendChildSpy    = vi.spyOn(document.body, 'appendChild').mockReturnValue(fakeLink as any)
    removeChildSpy    = vi.spyOn(document.body, 'removeChild').mockReturnValue(fakeLink as any)
    createUrlSpy      = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeUrlSpy      = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('triggers a download link click with the correct filename', () => {
    exportCsv({
      filename: 'employees',
      columns: [{ header: 'Name', key: 'name' }],
      rows: [{ name: 'Alice' }],
    })
    expect(fakeLink.download).toBe('employees.csv')
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('preserves .csv extension when already present', () => {
    exportCsv({
      filename: 'report.csv',
      columns: [{ header: 'ID', key: 'id' }],
      rows: [{ id: 1 }],
    })
    expect(fakeLink.download).toBe('report.csv')
  })

  it('builds CSV with header row and data rows', () => {
    let capturedBlob: Blob | undefined
    const origBlob = global.Blob
    global.Blob = class MockBlob {
      content: string
      type: string
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        this.content = String(parts[0])
        this.type    = opts?.type ?? ''
        capturedBlob = this as any
      }
    } as any

    exportCsv({
      filename: 'test',
      columns: [
        { header: 'First Name', key: 'firstName' },
        { header: 'Active',     key: 'isActive', format: (v: boolean) => v ? 'Yes' : 'No' },
      ],
      rows: [
        { firstName: 'Alice', isActive: true },
        { firstName: 'Bob',   isActive: false },
      ],
    })

    expect(capturedBlob).toBeDefined()
    expect((capturedBlob as any).content).toContain('First Name')
    expect((capturedBlob as any).content).toContain('Alice')
    expect((capturedBlob as any).content).toContain('Yes')
    expect((capturedBlob as any).content).toContain('No')

    global.Blob = origBlob
  })

  it('escapes values containing commas', () => {
    let capturedContent = ''
    const origBlob = global.Blob
    global.Blob = class MockBlob {
      constructor(parts: BlobPart[]) { capturedContent = String(parts[0]) }
    } as any

    exportCsv({
      filename: 'test',
      columns: [{ header: 'Name', key: 'name' }],
      rows: [{ name: 'Smith, Alice' }],
    })

    expect(capturedContent).toContain('"Smith, Alice"')
    global.Blob = origBlob
  })

  it('escapes values containing double-quotes', () => {
    let capturedContent = ''
    const origBlob = global.Blob
    global.Blob = class MockBlob {
      constructor(parts: BlobPart[]) { capturedContent = String(parts[0]) }
    } as any

    exportCsv({
      filename: 'test',
      columns: [{ header: 'Note', key: 'note' }],
      rows: [{ note: 'He said "hello"' }],
    })

    expect(capturedContent).toContain('""hello""')
    global.Blob = origBlob
  })
})
