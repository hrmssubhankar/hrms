import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { offerLetterTemplates } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

// GET /api/tenant/offer-letter-templates — list active custom templates for this tenant
export async function GET(_req: NextRequest) {
  const guard = await apiGuard('contracts:read')
  if (guard.error) return guard.error
  const { session } = guard

  const templates = await db
    .select()
    .from(offerLetterTemplates)
    .where(and(
      eq(offerLetterTemplates.tenantId, session.tenantId),
      eq(offerLetterTemplates.isActive, true),
    ))
    .orderBy(desc(offerLetterTemplates.createdAt))

  return NextResponse.json({ templates })
}

// POST /api/tenant/offer-letter-templates — upload a new template (multipart/form-data)
export async function POST(req: NextRequest) {
  const guard = await apiGuard('contracts:write')
  if (guard.error) return guard.error
  const { session } = guard

  const formData = await req.formData()
  const name    = (formData.get('name') as string | null)?.trim()
  const content = (formData.get('content') as string | null)?.trim()
  const file    = formData.get('file') as File | null

  if (!name || !content) {
    return NextResponse.json({ error: 'name and content are required' }, { status: 400 })
  }

  // Optionally store the original file in Vercel Blob
  let fileUrl: string | null = null
  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const blob = await put(
      `offer-templates/${session.tenantId}/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`,
      file,
      { access: 'public' },
    )
    fileUrl = blob.url
  }

  const [tmpl] = await db
    .insert(offerLetterTemplates)
    .values({
      tenantId:  session.tenantId,
      name,
      content,
      fileUrl,
      createdBy: session.email,
    })
    .returning()

  return NextResponse.json({ template: tmpl }, { status: 201 })
}
