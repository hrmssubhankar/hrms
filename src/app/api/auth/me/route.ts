import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  return NextResponse.json({
    user:     session,
    userRole: session.userRole ?? 'employee',
    role:     session.role,
  })
}
