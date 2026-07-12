/**
 * POST /api/upload
 *
 * Receives a multipart/form-data file, validates it, uploads to Vercel Blob,
 * and returns { url, fileName, fileSizeBytes, mimeType }.
 *
 * Env required: BLOB_READ_WRITE_TOKEN (set in Vercel project settings)
 */
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
])

export async function POST(req: NextRequest) {
  // Auth — any authenticated tenant user can upload
  const guard = await apiGuard('documents:write')
  if (guard.error) return guard.error
  const { session } = guard

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum 25 MB' }, { status: 413 })
  }

  const mimeType = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { error: `File type "${mimeType}" is not allowed` },
      { status: 415 },
    )
  }

  // Build a tenant-scoped path: tenantId/yyyy-mm/timestamp-random.ext
  const ext     = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const month   = new Date().toISOString().slice(0, 7) // yyyy-mm
  const rand    = Math.random().toString(36).slice(2, 8)
  const blobKey = `${session.tenantId}/${month}/${Date.now()}-${rand}.${ext}`

  try {
    const blob = await put(blobKey, file, {
      access:           'public',
      contentType:      mimeType,
      addRandomSuffix:  false,   // we already embed timestamp+rand in blobKey
    })

    return NextResponse.json({
      url:           blob.url,
      fileName:      file.name,
      fileSizeBytes: file.size,
      mimeType,
    })
  } catch (err: any) {
    console.error('[upload] Vercel Blob error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Upload failed' },
      { status: 500 },
    )
  }
}
