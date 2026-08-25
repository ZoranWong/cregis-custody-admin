// v2 API — Audit (审计管理)
import { apiRequest } from '@/utils/http/request'
import type {
  AuditTrailQuery,
  AuditTrailResponse,
  AuditSupervisionResponse,
  AuditPlanListResponse,
  AuditFindingListResponse,
  AuditRegulatoryReportListResponse,
  AuditExportRequest,
  AuditExportResult
} from '@/features/audit/types'

function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const v = search.toString()
  return v ? `?${v}` : ''
}

export async function fetchAuditTrailEvents(request: AuditTrailQuery): Promise<AuditTrailResponse> {
  return (await apiRequest<AuditTrailResponse>(
    `/api/v1/audit/trail${queryString({ startDate: request.startDate, endDate: request.endDate, actor: request.actor, actionType: request.actionType, targetModule: request.targetModule, targetId: request.targetId, page: request.page, pageSize: request.pageSize })}`
  )) as AuditTrailResponse
}

export async function fetchAuditSupervision(): Promise<AuditSupervisionResponse> {
  return (await apiRequest<AuditSupervisionResponse>(
    '/api/v1/audit/supervision'
  )) as AuditSupervisionResponse
}

export async function fetchAuditPlans(request: {
  page?: number
  pageSize?: number
}): Promise<AuditPlanListResponse> {
  return (await apiRequest<AuditPlanListResponse>(
    `/api/v1/audit/plans${queryString({ page: request.page, pageSize: request.pageSize })}`
  )) as AuditPlanListResponse
}

export async function fetchAuditFindings(request: {
  page?: number
  pageSize?: number
}): Promise<AuditFindingListResponse> {
  return (await apiRequest<AuditFindingListResponse>(
    `/api/v1/audit/findings${queryString({ page: request.page, pageSize: request.pageSize })}`
  )) as AuditFindingListResponse
}

export async function fetchAuditRegulatoryReports(request: {
  page?: number
  pageSize?: number
}): Promise<AuditRegulatoryReportListResponse> {
  return (await apiRequest<AuditRegulatoryReportListResponse>(
    `/api/v1/audit/regulatory-reports${queryString({ page: request.page, pageSize: request.pageSize })}`
  )) as AuditRegulatoryReportListResponse
}

export async function submitAuditExport(request: AuditExportRequest): Promise<AuditExportResult> {
  return (await apiRequest<AuditExportResult>('/api/v1/audit/export', {
    method: 'POST',
    body: request
  })) as AuditExportResult
}
