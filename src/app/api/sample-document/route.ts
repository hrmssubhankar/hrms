/**
 * GET /api/sample-document
 *
 * Serves a minimal valid PDF for demo/seed documents.
 * Used as a placeholder blob_url in seeded data so document links
 * open something real rather than a broken external URL.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Minimal valid single-page PDF (pre-built bytes, no external dependency)
const PDF_BYTES = Buffer.from(
  // %PDF-1.4 with one page containing "HRMS — Sample Document" text
  'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIg' +
  'MCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2Jq' +
  'PDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0vQ29udGVu' +
  'dHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+ZW5kb2JqCjQgMCBv' +
  'YmoKPDwvTGVuZ3RoIDE1Nj4+CnN0cmVhbQpCVAovRjEgMjAgVGYKNzIgNzIwIFRkCihIUk1T' +
  'IOKAkyBTYW1wbGUgRG9jdW1lbnQpIFRqCjAgLTMwIFRkCi9GMSA4IFRmCihUaGlzIGlzIGEg' +
  'cGxhY2Vob2xkZXIgZG9jdW1lbnQgZm9yIGRlbW8gcHVycG9zZXMuKSBUagowIC0yMCBUZAoo' +
  'VXBsb2FkIGEgcmVhbCBmaWxlIHRvIHJlcGxhY2UgdGhpcyBwbGFjZWhvbGRlci4pIFRqCkVU' +
  'CmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iajw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jh' +
  'c2VGb250L0hlbHZldGljYT4+ZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAK' +
  'MDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAw' +
  'MDAgbiAKMDAwMDAwMDI2NiAwMDAwMCBuIAowMDAwMDAwNDc0IDAwMDAwIG4gCnRyYWlsZXI8' +
  'PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo1NDMKJSVFT0Y=',
  'base64'
)

export async function GET() {
  return new NextResponse(PDF_BYTES, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'inline; filename="sample-document.pdf"',
      'Content-Length':      String(PDF_BYTES.length),
      'Cache-Control':       'public, max-age=86400',
    },
  })
}
