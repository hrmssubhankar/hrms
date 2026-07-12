/**
 * Minimal type shim for @vercel/blob — replaced by the real package on install.
 * Run `npm install @vercel/blob` to get full types.
 */
declare module '@vercel/blob' {
  export interface PutBlobResult {
    url:            string
    downloadUrl:    string
    pathname:       string
    contentType:    string
    contentDisposition: string
  }

  export interface PutOptions {
    access:       'public' | 'private'
    contentType?: string
    addRandomSuffix?: boolean
    cacheControlMaxAge?: number
  }

  export function put(
    pathname: string,
    body: Blob | File | ReadableStream | ArrayBuffer | string,
    options: PutOptions,
  ): Promise<PutBlobResult>

  export function del(url: string | string[]): Promise<void>

  export function list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    blobs: Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>
    cursor?: string
    hasMore: boolean
  }>
}
