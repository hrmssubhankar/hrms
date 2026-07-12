'use client'

/**
 * FileUpload — reusable drag-drop file uploader.
 *
 * Usage:
 *   <FileUpload
 *     accept=".pdf,image/*"
 *     label="Contract PDF"
 *     onUpload={({ url, fileName, fileSizeBytes, mimeType }) => { ... }}
 *   />
 *
 * Calls POST /api/upload with multipart/form-data.
 * Calls onUpload with the Vercel Blob result on success.
 * Optional currentUrl shows the already-stored file with a download link.
 */

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

export type UploadResult = {
  url:           string
  fileName:      string
  fileSizeBytes: number
  mimeType:      string
}

type Props = {
  /** Existing stored URL — shown as a download link before a new file is chosen */
  currentUrl?:  string | null
  /** File name to display for the currentUrl (optional) */
  currentName?: string | null
  /** Input accept string e.g. ".pdf,image/*" — defaults to all allowed types */
  accept?:      string
  /** Label shown above the drop zone */
  label?:       string
  /** Called when upload completes successfully */
  onUpload:     (result: UploadResult) => void
  /** Disabled state — prevents interaction */
  disabled?:    boolean
}

const MIME_ICON: Record<string, string> = {
  'application/pdf':  '📄',
  'image/jpeg':       '🖼',
  'image/png':        '🖼',
  'image/gif':        '🖼',
  'image/webp':       '🖼',
  'image/svg+xml':    '🖼',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain':  '📃',
  'text/csv':    '📊',
}
const mimeIcon = (mime: string) => MIME_ICON[mime] ?? '📁'

function fmtSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({
  currentUrl,
  currentName,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*',
  label,
  onUpload,
  disabled = false,
}: Props) {
  const inputRef         = useRef<HTMLInputElement>(null)
  const [dragging,   setDragging]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const [uploaded,   setUploaded]   = useState<UploadResult | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    setProgress(10)

    try {
      const fd = new FormData()
      fd.append('file', file)

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 85) + 10)
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)) }
            catch { reject(new Error('Invalid response from server')) }
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body.error ?? `Upload failed (${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(fd)
      })

      setProgress(100)
      setUploaded(result)
      onUpload(result)
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset input so the same file can be re-selected
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const fileToShow = uploaded ?? (currentUrl ? { url: currentUrl, fileName: currentName ?? 'Current file', fileSizeBytes: 0, mimeType: '' } : null)

  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-gray-400 block">{label}</label>}

      {/* Drop zone */}
      <div
        onDragEnter={() => !disabled && setDragging(true)}
        onDragOver={e => { e.preventDefault(); !disabled && setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={!disabled ? onDrop : undefined}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none',
          disabled   ? 'opacity-50 cursor-not-allowed border-gray-700'
            : dragging  ? 'border-purple-400 bg-purple-900/20'
            : uploading ? 'border-purple-600 bg-purple-900/10 cursor-wait'
            : 'border-gray-700 hover:border-purple-600 hover:bg-purple-900/10',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          className="sr-only"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-purple-300">Uploading… {progress}%</p>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : fileToShow ? (
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl">{mimeIcon(fileToShow.mimeType)}</span>
            <div className="text-left min-w-0">
              <p className="text-sm text-white truncate max-w-[220px]">{fileToShow.fileName}</p>
              {fileToShow.fileSizeBytes > 0 && (
                <p className="text-xs text-gray-400">{fmtSize(fileToShow.fileSizeBytes)}</p>
              )}
            </div>
            <a
              href={fileToShow.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="ml-auto shrink-0 text-xs text-purple-400 hover:text-purple-300 underline"
            >
              Open ↗
            </a>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl">📂</p>
            <p className="text-sm text-gray-300">
              {dragging ? 'Drop file here' : 'Click or drag & drop'}
            </p>
            <p className="text-xs text-gray-500">PDF, Word, Excel, images · max 25 MB</p>
          </div>
        )}
      </div>

      {/* Replace file prompt (shown after a file is uploaded or when currentUrl exists) */}
      {fileToShow && !uploading && (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          className="text-xs text-gray-400 hover:text-purple-400 transition"
          disabled={disabled}
        >
          ↩ Replace file
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
