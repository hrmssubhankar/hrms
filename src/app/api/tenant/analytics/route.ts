import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  employees, screeningRecords,
  trainingRecords, performanceReviews, whsIncidents,
  grievances, separationRecords, supervisionRecords,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export async function GET(req: NextRequest) {
  try {
    const guard = await apiGuard('analytics:read')
    if (guard.error) return guard.error
    const { session } = guard
    const tid = session.tenantId

    const today = new Date().toISOString().split('T')[0]
    const d30   = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
    const d90   = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0]

    // ── Headcount ──────────────────────────────────────────────────────────
    const allEmp = await db.select({
      isActive:       employees.isActive,
      employmentType: employees.employmentType,
      entityName:     employees.entityName,
      startDate:      employees.startDate,
      endDate:        employees.endDate,
      complianceStatus: employees.complianceStatus,
      ndisWorker:     employees.ndisWorker,
    }).from(employees).where(eq(employees.tenantId, tid))

    const active   = allEmp.filter(e => e.isActive)
    const headcount = {
      total:         active.length,
      fullTime:      active.filter(e => e.employmentType === 'full_time').length,
      partTime:      active.filter(e => e.employmentType === 'part_time').length,
      casual:        active.filter(e => e.employmentType === 'casual').length,
      contractor:    active.filter(e => e.employmentType === 'contractor').length,
      ndisWorkers:   active.filter(e => e.ndisWorker).length,
      newLast30:     allEmp.filter(e => e.startDate >= d30).length,
      complianceGreen: active.filter(e => e.complianceStatus === 'green').length,
      complianceAmber: active.filter(e => e.complianceStatus === 'amber').length,
      complianceRed:   active.filter(e => e.complianceStatus === 'red').length,
    }

    // Entity breakdown
    const entityMap: Record<string, number> = {}
    active.forEach(e => {
      const ent = e.entityName ?? 'Unassigned'
      entityMap[ent] = (entityMap[ent] ?? 0) + 1
    })
    const byEntity = Object.entries(entityMap).map(([name, count]) => ({ name, count }))

    // ── Compliance ─────────────────────────────────────────────────────────
    const screening = await db.select({
      expiryDate: screeningRecords.expiryDate,
      status:     screeningRecords.status,
    }).from(screeningRecords).where(eq(screeningRecords.tenantId, tid))

    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]
    const compliance = {
      screeningTotal:    screening.length,
      screeningVerified: screening.filter(s => s.status === 'green').length,
      screeningExpired:  screening.filter(s => s.expiryDate && s.expiryDate < today).length,
      screeningExpiringSoon: screening.filter(s => s.expiryDate && s.expiryDate >= today && s.expiryDate <= in30).length,
    }

    // ── Training ───────────────────────────────────────────────────────────
    const training = await db.select({
      status:     trainingRecords.status,
      expiryDate: trainingRecords.expiryDate,
    }).from(trainingRecords).where(eq(trainingRecords.tenantId, tid))

    const trainingStats = {
      total:      training.length,
      completed:  training.filter(t => t.status === 'completed').length,
      inProgress: training.filter(t => t.status === 'in_progress').length,
      expired:    training.filter(t => t.expiryDate && t.expiryDate < today).length,
      completionRate: training.length > 0
        ? Math.round((training.filter(t => t.status === 'completed').length / training.length) * 100)
        : 0,
    }

    // ── WHS ────────────────────────────────────────────────────────────────
    const whs = await db.select({
      severity:  whsIncidents.severity,
      status:    whsIncidents.status,
      createdAt: whsIncidents.createdAt,
    }).from(whsIncidents).where(eq(whsIncidents.tenantId, tid))

    const whsStats = {
      total:      whs.length,
      open:       whs.filter(i => i.status === 'open').length,
      critical:   whs.filter(i => i.severity === 'critical').length,
      last30:     whs.filter(i => i.createdAt.toISOString().split('T')[0] >= d30).length,
    }

    // ── Performance ────────────────────────────────────────────────────────
    const perf = await db.select({
      status:      performanceReviews.status,
      scheduledDate: performanceReviews.scheduledDate,
      overallRating: performanceReviews.overallRating,
    }).from(performanceReviews).where(eq(performanceReviews.tenantId, tid))

    const ratings = perf.filter(p => p.overallRating !== null).map(p => Number(p.overallRating))
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null

    const perfStats = {
      total:      perf.length,
      completed:  perf.filter(p => p.status === 'completed').length,
      due30Days:  perf.filter(p => p.scheduledDate && p.scheduledDate >= today && p.scheduledDate <= in30 && p.status !== 'completed').length,
      avgRating,
    }

    // ── Grievances ─────────────────────────────────────────────────────────
    const griev = await db.select({
      status: grievances.status, riskRating: grievances.riskRating,
    }).from(grievances).where(eq(grievances.tenantId, tid))

    const grievStats = {
      total:    griev.length,
      open:     griev.filter(g => g.status !== 'closed').length,
      critical: griev.filter(g => g.riskRating === 'critical').length,
    }

    // ── Turnover ───────────────────────────────────────────────────────────
    const sep = await db.select({
      type: separationRecords.type, createdAt: separationRecords.createdAt,
    }).from(separationRecords).where(eq(separationRecords.tenantId, tid))

    const sepLast90 = sep.filter(s => s.createdAt.toISOString().split('T')[0] >= d90)
    const turnover = {
      total90days:    sepLast90.length,
      resignations:   sepLast90.filter(s => s.type === 'resignation').length,
      terminations:   sepLast90.filter(s => s.type === 'termination').length,
      turnoverRate:   active.length > 0
        ? ((sepLast90.length / active.length) * 100).toFixed(1)
        : '0.0',
    }

    // ── Supervision ────────────────────────────────────────────────────────
    const sup = await db.select({
      status: supervisionRecords.status, scheduledDate: supervisionRecords.scheduledDate,
    }).from(supervisionRecords).where(eq(supervisionRecords.tenantId, tid))

    const supStats = {
      overdue:   sup.filter(s => s.status === 'scheduled' && s.scheduledDate < today).length,
      due30days: sup.filter(s => s.status === 'scheduled' && s.scheduledDate >= today && s.scheduledDate <= in30).length,
    }

    return NextResponse.json({
      headcount, byEntity, compliance, training: trainingStats,
      whs: whsStats, performance: perfStats, grievances: grievStats,
      turnover, supervision: supStats,
    })
  } catch (err) {
    console.error('GET /api/tenant/analytics', err)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
