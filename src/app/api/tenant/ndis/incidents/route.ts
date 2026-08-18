/**
 * GET  /api/tenant/ndis/incidents   — list incidents
 * POST /api/tenant/ndis/incidents   — create incident
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ndisIncidents } from '@/lib/db/schema'
import { eq, and, desc, ilike, or } from 'drizzle-orm'
import { apiGuard } from '@/lib/auth/apiGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await apiGuard('ndis:read')
  if (guard.error) return guard.error
  const { tenantId } = guard.session

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get('search') ?? ''
  const status   = searchParams.get('status') ?? ''
  const severity = searchParams.get('severity') ?? ''
  const type     = searchParams.get('type') ?? ''
  const limit    = Math.min(Number(searchParams.get('limit') ?? 50), 200)

  const conditions = [eq(ndisIncidents.tenantId, tenantId)]
  if (status)   conditions.push(eq(ndisIncidents.status, status))
  if (severity) conditions.push(eq(ndisIncidents.severity, severity))
  if (type)     conditions.push(eq(ndisIncidents.incidentType, type))
  if (search) {
    conditions.push(
      or(
        ilike(ndisIncidents.title, `%${search}%`),
        ilike(ndisIncidents.participantName, `%${search}%`),
        ilike(ndisIncidents.workerName, `%${search}%`),
      )!
    )
  }

  const incidents = await db
    .select()
    .from(ndisIncidents)
    .where(and(...conditions))
    .orderBy(desc(ndisIncidents.incidentDate))
    .limit(limit)

  return NextResponse.json({ incidents })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard('ndis:write')
  if (guard.error) return guard.error
  const { tenantId, email } = guard.session

  const body = await req.json()
  const {
    incidentType, incidentCategory, isReportable, status, severity,
    participantId, participantName, workerName, workerRole, witnessNames,
    title, description, location, incidentDate, discoveredDate,
    reportedInternally, internalReportDate, commissionNotified,
    commissionNotifyDate, commissionRefNumber, policeNotified,
    policeReportNumber, immediateActions, rootCause, outcomeDescription,
    evidenceUrl, assignedTo, notes,
  } = body

  if (!incidentType || !title || !description || !incidentDate) {
    return NextResponse.json({ error: 'incidentType, title, description, incidentDate are required' }, { status: 400 })
  }

  const [incident] = await db.insert(ndisIncidents).values({
    tenantId,
    incidentType,
    incidentCategory: incidentCategory || null,
    isReportable: isReportable ?? true,
    status: status || 'open',
    severity: severity || 'medium',
    participantId: participantId || null,
    participantName: participantName || null,
    workerName: workerName || null,
    workerRole: workerRole || null,
    witnessNames: witnessNames || null,
    title,
    description,
    location: location || null,
    incidentDate: new Date(incidentDate),
    discoveredDate: discoveredDate ? new Date(discoveredDate) : null,
    reportedInternally: reportedInternally ?? false,
    internalReportDate: internalReportDate || null,
    commissionNotified: commissionNotified ?? false,
    commissionNotifyDate: commissionNotifyDate || null,
    commissionRefNumber: commissionRefNumber || null,
    policeNotified: policeNotified ?? false,
    policeReportNumber: policeReportNumber || null,
    immediateActions: immediateActions || null,
    rootCause: rootCause || null,
    outcomeDescription: outcomeDescription || null,
    evidenceUrl: evidenceUrl || null,
    assignedTo: assignedTo || null,
    notes: notes || null,
    createdBy: email,
  }).returning()

  return NextResponse.json({ incident }, { status: 201 })
}
