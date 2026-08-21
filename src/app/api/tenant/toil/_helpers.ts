import { db } from '@/lib/db'
import { toilBalances } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function upsertBalance(tenantId: string, employeeId: string, hours: number, entryType: string) {
  const existing = await db
    .select()
    .from(toilBalances)
    .where(and(eq(toilBalances.tenantId, tenantId), eq(toilBalances.employeeId, employeeId)))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(toilBalances).values({
      tenantId,
      employeeId,
      balanceHours: String(entryType === 'accrual' ? hours : -Math.abs(hours)),
      totalAccrued: String(entryType === 'accrual' ? hours : 0),
      totalTaken: String(entryType === 'accrual' ? 0 : Math.abs(hours)),
      updatedAt: new Date(),
    })
  } else {
    const bal = existing[0]
    const newBalance = parseFloat(bal.balanceHours) + (entryType === 'accrual' ? hours : -Math.abs(hours))
    const newAccrued = parseFloat(bal.totalAccrued) + (entryType === 'accrual' ? hours : 0)
    const newTaken = parseFloat(bal.totalTaken) + (entryType === 'accrual' ? 0 : Math.abs(hours))
    await db.update(toilBalances).set({
      balanceHours: String(newBalance),
      totalAccrued: String(newAccrued),
      totalTaken: String(newTaken),
      updatedAt: new Date(),
    }).where(and(eq(toilBalances.tenantId, tenantId), eq(toilBalances.employeeId, employeeId)))
  }
}
