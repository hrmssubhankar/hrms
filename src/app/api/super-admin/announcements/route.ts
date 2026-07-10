import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

// In-memory store — replace with DB table in production
// Structure: { id, title, body, priority, targetTenants: 'all'|string[], expiresAt, createdAt, createdBy }
const store: any[] = []

function guard(session: any) {
  return !session || session.role !== 'super_admin'
}

export async function GET() {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ announcements: store.sort((a, b) => b.createdAt - a.createdAt) })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, priority = 'info', targetTenants = 'all', expiresAt } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'title and body required' }, { status: 400 })

  const announcement = {
    id: crypto.randomUUID(),
    title,
    body,
    priority,
    targetTenants,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    createdAt: Date.now(),
    createdBy: session!.email,
    isActive: true,
  }
  store.unshift(announcement)
  return NextResponse.json({ announcement }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, isActive } = await req.json()
  const idx = store.findIndex(a => a.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  store[idx].isActive = isActive
  return NextResponse.json({ announcement: store[idx] })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (guard(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const idx = store.findIndex(a => a.id === id)
  if (idx !== -1) store.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
