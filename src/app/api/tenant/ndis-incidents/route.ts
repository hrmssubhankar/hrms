/**
 * GET  /api/tenant/ndis-incidents  — list incidents (filtered by status, incidentType, severity)
 * POST /api/tenant/ndis-incidents  — create a new incident report
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisIncidents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('ndis_incidents:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const incidentType = searchParams.get('incidentType')
  const severity     = searchParams.get('severity')

  const conditions: any[] = [eq(ndisIncidents.tenantId, tenantId)]
  if (status)       conditions.push(eq(ndisIncidents.status, status))
  if (incidentType) conditions.push(eq(ndisIncidents.incidentType, incidentType))
  if (severity)     conditions.push(eq(ndisIncidents.severity, severity))

  const rows = await db
    .select()
    .from(ndisIncidents)
    .where(and(...conditions))
    .orderBy(desc(ndisIncidents.incidentDate))

  return NextResponse.json({ incidents: rows, total: rows.length })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('ndis_incidents:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()

  const {
    title, incidentType, incidentCategory, description,
    severity, participantId, participantName, workerName, workerRole,
    witnessNames, location, incidentDate, discoveredDate,
    reportedInternally, internalReportDate,
    commissionNotified, commissionNotifyDate, commissionRefNumber,
    policeNotified, policeReportNumber,
    immediateActions, rootCause, outcomeDescription,
    evidenceUrl, assignedTo, notes, isReportable,
  } = body

  if (!title || !incidentType || !description || !incidentDate) {
    return NextResponse.json(
      { error: 'title, incidentType, description, and incidentDate are required' },
      { status: 400 },
    )
  }

  const [created] = await db
    .insert(ndisIncidents)
    .values({
      tenantId,
      title,
      incidentType,
      incidentCategory:     incidentCategory ?? null,
      description,
      severity:             severity ?? 'medium',
      status:               'open',
      isReportable:         isReportable ?? true,
      participantId:        participantId ?? null,
      participantName:      participantName ?? null,
      workerName:           workerName ?? null,
      workerRole:           workerRole ?? null,
      witnessNames:         witnessNames ?? null,
      location:             location ?? null,
      incidentDate:         new Date(incidentDate),
      discoveredDate:       discoveredDate ? new Date(discoveredDate) : null,
      reportedInternally:   reportedInternally ?? false,
      internalReportDate:   internalReportDate ?? null,
      commissionNotified:   commissionNotified ?? false,
      commissionNotifyDate: commissionNotifyDate ?? null,
      commissionRefNumber:  commissionRefNumber ?? null,
      policeNotified:       policeNotified ?? false,
      policeReportNumber:   policeReportNumber ?? null,
      immediateActions:     immediateActions ?? null,
      rootCause:            rootCause ?? null,
      outcomeDescription:   outcomeDescription ?? null,
      evidenceUrl:          evidenceUrl ?? null,
      assignedTo:           assignedTo ?? null,
      notes:                notes ?? null,
      createdBy:            email,
    })
    .returning()

  return NextResponse.json({ incident: created }, { status: 201 })
}
