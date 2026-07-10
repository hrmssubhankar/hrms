import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenantModules } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET — list all modules for a tenant
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const modules = await db
    .select()
    .from(tenantModules)
    .where(eq(tenantModules.tenantId, params.id))
    .orderBy(tenantModules.moduleId)
  return NextResponse.json({ modules })
}

// PATCH — toggle a module on/off
// Body: { moduleId: number, isEnabled: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { moduleId, isEnabled } = await req.json()

    const [updated] = await db
      .update(tenantModules)
      .set({ isEnabled, updatedAt: new Date() })
      .where(
        and(
          eq(tenantModules.tenantId, params.id),
          eq(tenantModules.moduleId, moduleId)
        )
      )
      .returning()

    return NextResponse.json({ module: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// POST — bulk update modules
// Body: { modules: { moduleId: number, isEnabled: boolean }[] }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { modules } = await req.json()
    const results = []
    for (const mod of modules) {
      const [updated] = await db
        .update(tenantModules)
        .set({ isEnabled: mod.isEnabled, updatedAt: new Date() })
        .where(
          and(
            eq(tenantModules.tenantId, params.id),
            eq(tenantModules.moduleId, mod.moduleId)
          )
        )
        .returning()
      results.push(updated)
    }
    return NextResponse.json({ modules: results })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update modules' }, { status: 500 })
  }
}
