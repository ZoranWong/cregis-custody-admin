// v2 API — Compliance (从 v1 src/api/compliance.ts 移植)
import { apiRequest } from "@/utils/http/request";
import type {
  ComplianceCaseQueueRequest, ComplianceCaseQueueResponse,
  ComplianceCaseDetailResponse, ComplianceReviewRequest, ComplianceFinalDecisionRequest,
  ComplianceOutboxRequest, ComplianceOutboxResponse, ComplianceOutboxNotification,
  TravelRuleCaseRequest, TravelRuleCaseListResponse, TravelRuleCaseDetail,
  TravelRuleReviewRequest, TravelRuleReviewResult,
  TravelRuleSupplementRequest, TravelRuleSupplementResult,
  TravelRuleExchangeRequest, TravelRuleExchangeListResponse,
  TravelRuleExchangeDetail, TravelRuleRetryRequest, TravelRuleRetryResult,
  TravelRuleConfiguration, TravelRuleConfigurationDraftRequest, TravelRuleConfigurationDraftResult,
  TravelRuleConfigurationSimulationRequest, TravelRuleSimulationResult,
  TravelRuleConfigurationApprovalRequest, TravelRuleConfigurationApprovalResult,
  TravelRuleEvidenceChain, TravelRuleEvidenceNodeDetail,
  TravelRuleReportBasisRequest, TravelRuleReportBasis
} from "@/features/compliance/types";

function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const v = search.toString();
  return v ? `?${v}` : "";
}

export async function fetchComplianceCases(request: ComplianceCaseQueueRequest): Promise<ComplianceCaseQueueResponse> {
  return (await apiRequest<ComplianceCaseQueueResponse>(`/api/v1/compliance/cases${queryString({ tab: request.tab, caseType: request.caseType, priority: request.priority, subjectName: request.subjectName, status: request.status, page: request.page, pageSize: request.pageSize })}`)) as ComplianceCaseQueueResponse;
}

export async function fetchComplianceCaseDetail(ticketId: string): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(`/api/v1/compliance/cases/${encodeURIComponent(ticketId)}`)) as ComplianceCaseDetailResponse;
}

export async function submitComplianceReview(ticketId: string, request: ComplianceReviewRequest): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(`/api/v1/compliance/cases/${encodeURIComponent(ticketId)}/review`, { method: "POST", body: request })) as ComplianceCaseDetailResponse;
}

export async function submitComplianceFinalDecision(ticketId: string, request: ComplianceFinalDecisionRequest): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(`/api/v1/compliance/cases/${encodeURIComponent(ticketId)}/final-decision`, { method: "POST", body: request })) as ComplianceCaseDetailResponse;
}

export async function fetchComplianceOutbox(request: ComplianceOutboxRequest): Promise<ComplianceOutboxResponse> {
  return (await apiRequest<ComplianceOutboxResponse>(`/api/v1/compliance/outbox${queryString({ type: request.type, deliveryStatus: request.deliveryStatus, page: request.page, pageSize: request.pageSize })}`)) as ComplianceOutboxResponse;
}

export async function fetchComplianceOutboxNotification(notificationId: string): Promise<ComplianceOutboxNotification> {
  return (await apiRequest<ComplianceOutboxNotification>(`/api/v1/compliance/outbox/${encodeURIComponent(notificationId)}`)) as ComplianceOutboxNotification;
}

export async function fetchTravelRuleCases(request: TravelRuleCaseRequest = {}): Promise<TravelRuleCaseListResponse> {
  return (await apiRequest<TravelRuleCaseListResponse>(`/api/v1/compliance/travel-rule/cases${queryString({ lifecycleStatus: request.lifecycleStatus, priority: request.priority, query: request.query, page: request.page, pageSize: request.pageSize })}`)) as TravelRuleCaseListResponse;
}

export async function fetchTravelRuleCaseDetail(caseKey: string): Promise<TravelRuleCaseDetail> {
  return (await apiRequest<TravelRuleCaseDetail>(`/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}`)) as TravelRuleCaseDetail;
}

export async function submitTravelRuleReview(caseKey: string, request: TravelRuleReviewRequest): Promise<TravelRuleReviewResult> {
  return (await apiRequest<TravelRuleReviewResult>(`/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}/reviews`, { method: "POST", body: request })) as TravelRuleReviewResult;
}

export async function submitTravelRuleSupplementRequest(caseKey: string, request: TravelRuleSupplementRequest): Promise<TravelRuleSupplementResult> {
  return (await apiRequest<TravelRuleSupplementResult>(`/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}/supplement-requests`, { method: "POST", body: request })) as TravelRuleSupplementResult;
}

export async function fetchTravelRuleExchanges(request: TravelRuleExchangeRequest = {}): Promise<TravelRuleExchangeListResponse> {
  return (await apiRequest<TravelRuleExchangeListResponse>(`/api/v1/compliance/travel-rule/exchanges${queryString({ direction: request.direction, status: request.status, vasp: request.vasp, page: request.page, pageSize: request.pageSize })}`)) as TravelRuleExchangeListResponse;
}

export async function fetchTravelRuleExchangeDetail(exchangeId: string): Promise<TravelRuleExchangeDetail> {
  return (await apiRequest<TravelRuleExchangeDetail>(`/api/v1/compliance/travel-rule/exchanges/${encodeURIComponent(exchangeId)}`)) as TravelRuleExchangeDetail;
}

export async function submitTravelRuleRetryRequest(exchangeId: string, request: TravelRuleRetryRequest): Promise<TravelRuleRetryResult> {
  return (await apiRequest<TravelRuleRetryResult>(`/api/v1/compliance/travel-rule/exchanges/${encodeURIComponent(exchangeId)}/retry-requests`, { method: "POST", body: request })) as TravelRuleRetryResult;
}

export async function fetchTravelRuleConfiguration(): Promise<TravelRuleConfiguration> {
  return (await apiRequest<TravelRuleConfiguration>("/api/v1/compliance/travel-rule/configuration/current?includeDraft=true&includeHistory=true")) as TravelRuleConfiguration;
}

export async function saveTravelRuleConfigurationDraft(request: TravelRuleConfigurationDraftRequest): Promise<TravelRuleConfigurationDraftResult> {
  return (await apiRequest<TravelRuleConfigurationDraftResult>("/api/v1/compliance/travel-rule/configuration/draft", { method: "PUT", body: request })) as TravelRuleConfigurationDraftResult;
}

export async function runTravelRuleConfigurationSimulation(request: TravelRuleConfigurationSimulationRequest): Promise<TravelRuleSimulationResult> {
  return (await apiRequest<TravelRuleSimulationResult>("/api/v1/compliance/travel-rule/configuration/simulations", { method: "POST", body: request })) as TravelRuleSimulationResult;
}

export async function approveTravelRuleConfigurationVersion(versionKey: string, request: TravelRuleConfigurationApprovalRequest): Promise<TravelRuleConfigurationApprovalResult> {
  return (await apiRequest<TravelRuleConfigurationApprovalResult>(`/api/v1/compliance/travel-rule/configuration/versions/${encodeURIComponent(versionKey)}/approval`, { method: "POST", body: request })) as TravelRuleConfigurationApprovalResult;
}

export async function fetchTravelRuleEvidenceChain(caseKey: string): Promise<TravelRuleEvidenceChain> {
  return (await apiRequest<TravelRuleEvidenceChain>(`/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(caseKey)}`)) as TravelRuleEvidenceChain;
}

export async function fetchTravelRuleEvidenceNodeDetail(evidenceChainKey: string, nodeKey: string): Promise<TravelRuleEvidenceNodeDetail> {
  return (await apiRequest<TravelRuleEvidenceNodeDetail>(`/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(evidenceChainKey)}/nodes/${encodeURIComponent(nodeKey)}`)) as TravelRuleEvidenceNodeDetail;
}

export async function generateTravelRuleReportBasis(evidenceChainKey: string, request: TravelRuleReportBasisRequest): Promise<TravelRuleReportBasis> {
  return (await apiRequest<TravelRuleReportBasis>(`/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(evidenceChainKey)}/report-basis`, { method: "POST", body: request })) as TravelRuleReportBasis;
}