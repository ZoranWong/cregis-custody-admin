// v2 API — Risk Center (从 v1 src/api/risk.ts 移植)
import { apiRequest } from "@/utils/http/request";
import type {
  RiskCaseQueueRequest, RiskCaseQueueResponse,
  RiskCaseDetailResponse, RiskDispositionRequest, RiskAdjudicationRequest, RiskEscalationRequest,
  RiskOutboxRequest, RiskOutboxResponse, RiskOutboxNotification
} from "@/features/risk/types";
import type {
  RiskStrategyRuleListRequest, RiskStrategyRuleListResponse, RiskStrategyRuleDetailResponse,
} from "@/features/risk/strategyTypes";
import type {
  RiskStrategyReviewListRequest, RiskStrategyReviewListResponse,
} from "@/features/risk/strategyGovernanceTypes";

function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const v = search.toString();
  return v ? `?${v}` : "";
}

export async function fetchRiskCaseQueue(request: RiskCaseQueueRequest): Promise<RiskCaseQueueResponse> {
  return (await apiRequest<RiskCaseQueueResponse>(`/api/v1/risk/cases${queryString({ tab: request.tab, priority: request.priority, riskType: request.riskType, merchantName: request.merchantName, status: request.status, page: request.page, pageSize: request.pageSize })}`)) as RiskCaseQueueResponse;
}

export async function fetchRiskCaseDetail(ticketId: string): Promise<RiskCaseDetailResponse> {
  return (await apiRequest<RiskCaseDetailResponse>(`/api/v1/risk/cases/${encodeURIComponent(ticketId)}`)) as RiskCaseDetailResponse;
}

export async function submitRiskDisposition(ticketId: string, request: RiskDispositionRequest): Promise<RiskCaseDetailResponse> {
  return (await apiRequest<RiskCaseDetailResponse>(`/api/v1/risk/cases/${encodeURIComponent(ticketId)}/disposition`, { method: "POST", body: request })) as RiskCaseDetailResponse;
}

export async function submitRiskAdjudication(ticketId: string, request: RiskAdjudicationRequest): Promise<RiskCaseDetailResponse> {
  return (await apiRequest<RiskCaseDetailResponse>(`/api/v1/risk/cases/${encodeURIComponent(ticketId)}/adjudication`, { method: "POST", body: request })) as RiskCaseDetailResponse;
}

export async function escalateRiskCase(ticketId: string, request: RiskEscalationRequest): Promise<RiskCaseDetailResponse> {
  return (await apiRequest<RiskCaseDetailResponse>(`/api/v1/risk/cases/${encodeURIComponent(ticketId)}/escalation`, { method: "POST", body: request })) as RiskCaseDetailResponse;
}

export async function fetchRiskOutbox(request: RiskOutboxRequest): Promise<RiskOutboxResponse> {
  return (await apiRequest<RiskOutboxResponse>(`/api/v1/risk/outbox${queryString({ type: request.type, deliveryStatus: request.deliveryStatus, recipient: request.recipient, timeRange: request.timeRange, keyword: request.keyword, page: request.page, pageSize: request.pageSize })}`)) as RiskOutboxResponse;
}

export async function fetchRiskOutboxNotification(notificationId: string): Promise<RiskOutboxNotification> {
  return (await apiRequest<RiskOutboxNotification>(`/api/v1/risk/outbox/${encodeURIComponent(notificationId)}`)) as RiskOutboxNotification;
}

export async function fetchRiskStrategyRules(request: RiskStrategyRuleListRequest): Promise<RiskStrategyRuleListResponse> {
  return (await apiRequest<RiskStrategyRuleListResponse>(`/api/v1/risk/strategy/rules${queryString({ status: request.status, ruleType: request.ruleType, keyword: request.keyword, page: request.page, pageSize: request.pageSize })}`)) as RiskStrategyRuleListResponse;
}

export async function fetchRiskStrategyRuleDetail(ruleId: string): Promise<RiskStrategyRuleDetailResponse> {
  return (await apiRequest<RiskStrategyRuleDetailResponse>(`/api/v1/risk/strategy/rules/${encodeURIComponent(ruleId)}`)) as RiskStrategyRuleDetailResponse;
}

export async function fetchRiskStrategyReviews(request: RiskStrategyReviewListRequest): Promise<RiskStrategyReviewListResponse> {
  return (await apiRequest<RiskStrategyReviewListResponse>(`/api/v1/risk/strategy/reviews${queryString({ reviewStatus: request.reviewStatus, priority: request.priority, ruleType: request.ruleType, page: request.page, pageSize: request.pageSize })}`)) as RiskStrategyReviewListResponse;
}