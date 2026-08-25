// @ts-nocheck
import { apiRequest } from '@/utils/http/request'
import type {
  KybContextAttachRequest,
  OpsCollaborationCreateRequest,
  OpsCollaborationCreateResponse,
  TicketAuditTimelineResponse,
  TicketCloseRequest,
  TicketCommentRequest,
  TicketCompletionRequest,
  TicketDetailView,
  TicketEvidenceRequest,
  TicketQueueRequest,
  TicketQueueResponse,
  TicketReassignRequest,
  TicketSearchResponse,
  TicketVersionRequest,
  TicketReasonRequest
} from '@/features/tickets/types'

function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const value = search.toString()
  return value ? `?${value}` : ''
}

export function fetchTicketQueue(request: TicketQueueRequest): Promise<TicketQueueResponse> {
  return apiRequest<TicketQueueResponse>(
    `/api/v1/tickets${queryString({
      center: request.center,
      queue: request.queue,
      displayStatus: request.displayStatus,
      urgency: request.urgency,
      ticketType: request.ticketType,
      scope: request.scope,
      search: request.search,
      page: request.page,
      pageSize: request.pageSize
    })}`
  )
}

export function fetchTicketDetail(ticketId: string): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(`/api/v1/tickets/${encodeURIComponent(ticketId)}`)
}

export function startTicketProgress(
  ticketId: string,
  request: TicketVersionRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/actions/start-progress`,
    {
      method: 'POST',
      body: request
    }
  )
}

export function reassignTicket(
  ticketId: string,
  request: TicketReassignRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/actions/reassign`,
    {
      method: 'POST',
      body: request
    }
  )
}

export function submitTicketCompletion(
  ticketId: string,
  request: TicketCompletionRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/actions/submit-completion`,
    {
      method: 'POST',
      body: request
    }
  )
}

export function closeTicket(
  ticketId: string,
  request: TicketCloseRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/actions/close`,
    {
      method: 'POST',
      body: request
    }
  )
}

export function withdrawTicket(
  ticketId: string,
  request: TicketReasonRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/actions/withdraw`,
    {
      method: 'POST',
      body: request
    }
  )
}

export function addTicketComment(
  ticketId: string,
  request: TicketCommentRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(`/api/v1/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: 'POST',
    body: request
  })
}

export function attachTicketEvidence(
  ticketId: string,
  request: TicketEvidenceRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(`/api/v1/tickets/${encodeURIComponent(ticketId)}/evidence`, {
    method: 'POST',
    body: request
  })
}

export function fetchTicketAuditEvents(
  ticketId: string,
  page = 1,
  pageSize = 10
): Promise<TicketAuditTimelineResponse> {
  return apiRequest<TicketAuditTimelineResponse>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/audit-events${queryString({ page, pageSize })}`
  )
}

export function createOpsCollaborationTicket(
  request: OpsCollaborationCreateRequest
): Promise<OpsCollaborationCreateResponse> {
  return apiRequest<OpsCollaborationCreateResponse>('/api/v1/tickets/ops-collaboration', {
    method: 'POST',
    body: request
  })
}

export function searchOpsCollaborationMerchants(
  query: string
): Promise<TicketSearchResponse<{ merchantId: string; displayName: string }>> {
  return apiRequest<TicketSearchResponse<{ merchantId: string; displayName: string }>>(
    `/api/v1/tickets/ops-collaboration/search/merchants${queryString({ query })}`
  )
}

export function searchOpsCollaborationCollaborators(
  query: string
): Promise<TicketSearchResponse<{ accountId: string; displayName: string }>> {
  return apiRequest<TicketSearchResponse<{ accountId: string; displayName: string }>>(
    `/api/v1/tickets/ops-collaboration/search/collaborators${queryString({ query })}`
  )
}

export function attachKybTicketContext(
  ticketId: string,
  request: KybContextAttachRequest
): Promise<TicketDetailView> {
  return apiRequest<TicketDetailView>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/kyb-context`,
    {
      method: 'POST',
      body: request
    }
  )
}
