// v2 API — Compliance (从 v1 src/api/compliance.ts 移植)
import { apiRequest } from '@/utils/http/request'
import type {
  ComplianceCaseQueueRequest,
  ComplianceCaseQueueResponse,
  ComplianceCaseDetailResponse,
  ComplianceReviewRequest,
  ComplianceFinalDecisionRequest,
  ComplianceOutboxRequest,
  ComplianceOutboxResponse,
  ComplianceOutboxNotification,
  TravelRuleCaseRequest,
  TravelRuleCaseListResponse,
  TravelRuleCaseDetail,
  TravelRuleReviewRequest,
  TravelRuleReviewResult,
  TravelRuleSupplementRequest,
  TravelRuleSupplementResult,
  TravelRuleExchangeRequest,
  TravelRuleExchangeListResponse,
  TravelRuleExchangeDetail,
  TravelRuleRetryRequest,
  TravelRuleRetryResult,
  TravelRuleConfiguration,
  TravelRuleConfigurationDraftRequest,
  TravelRuleConfigurationDraftResult,
  TravelRuleConfigurationSimulationRequest,
  TravelRuleSimulationResult,
  TravelRuleConfigurationApprovalRequest,
  TravelRuleConfigurationApprovalResult,
  TravelRuleEvidenceChain,
  TravelRuleEvidenceNodeDetail,
  TravelRuleReportBasisRequest,
  TravelRuleReportBasis,
  ComplianceRuleView,
  ComplianceRuleRequest,
  ComplianceRuleEnableRequest,
  ComplianceRuleQuery,
  PageRiskRule,
  FactorView,
  TransactionLensItemView,
  PageTransactionLensItemView,
  TransactionLensQuery,
  TransactionLensSummaryView,
  ComplianceTabView,
  TravelRuleTabView,
  SignoffTabView,
  DispositionTabView,
  OnChainTabView,
  InboundNotificationPage,
  InboundNotificationDetail,
  InboundNotificationQuery,
  InboundRejectRequest,
  ComplianceAlertPage,
  ComplianceAlertQuery,
  ComplianceAlertDetail
} from '@/features/compliance/types'

function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const v = search.toString()
  return v ? `?${v}` : ''
}

export async function fetchComplianceCases(
  request: ComplianceCaseQueueRequest
): Promise<ComplianceCaseQueueResponse> {
  return (await apiRequest<ComplianceCaseQueueResponse>(
    `/api/v1/compliance/cases${queryString({ tab: request.tab, caseType: request.caseType, priority: request.priority, subjectName: request.subjectName, status: request.status, page: request.page, pageSize: request.pageSize })}`
  )) as ComplianceCaseQueueResponse
}

export async function fetchComplianceCaseDetail(
  ticketId: string
): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(
    `/api/v1/compliance/cases/${encodeURIComponent(ticketId)}`
  )) as ComplianceCaseDetailResponse
}

export async function submitComplianceReview(
  ticketId: string,
  request: ComplianceReviewRequest
): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(
    `/api/v1/compliance/cases/${encodeURIComponent(ticketId)}/review`,
    { method: 'POST', body: request }
  )) as ComplianceCaseDetailResponse
}

export async function submitComplianceFinalDecision(
  ticketId: string,
  request: ComplianceFinalDecisionRequest
): Promise<ComplianceCaseDetailResponse> {
  return (await apiRequest<ComplianceCaseDetailResponse>(
    `/api/v1/compliance/cases/${encodeURIComponent(ticketId)}/final-decision`,
    { method: 'POST', body: request }
  )) as ComplianceCaseDetailResponse
}

export async function fetchComplianceOutbox(
  request: ComplianceOutboxRequest
): Promise<ComplianceOutboxResponse> {
  return (await apiRequest<ComplianceOutboxResponse>(
    `/api/v1/compliance/outbox${queryString({ type: request.type, deliveryStatus: request.deliveryStatus, page: request.page, pageSize: request.pageSize })}`
  )) as ComplianceOutboxResponse
}

export async function fetchComplianceOutboxNotification(
  notificationId: string
): Promise<ComplianceOutboxNotification> {
  return (await apiRequest<ComplianceOutboxNotification>(
    `/api/v1/compliance/outbox/${encodeURIComponent(notificationId)}`
  )) as ComplianceOutboxNotification
}

export async function fetchTravelRuleCases(
  request: TravelRuleCaseRequest = {}
): Promise<TravelRuleCaseListResponse> {
  return (await apiRequest<TravelRuleCaseListResponse>(
    `/api/v1/compliance/travel-rule/cases${queryString({ lifecycleStatus: request.lifecycleStatus, priority: request.priority, query: request.query, page: request.page, pageSize: request.pageSize })}`
  )) as TravelRuleCaseListResponse
}

export async function fetchTravelRuleCaseDetail(caseKey: string): Promise<TravelRuleCaseDetail> {
  return (await apiRequest<TravelRuleCaseDetail>(
    `/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}`
  )) as TravelRuleCaseDetail
}

export async function submitTravelRuleReview(
  caseKey: string,
  request: TravelRuleReviewRequest
): Promise<TravelRuleReviewResult> {
  return (await apiRequest<TravelRuleReviewResult>(
    `/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}/reviews`,
    { method: 'POST', body: request }
  )) as TravelRuleReviewResult
}

export async function submitTravelRuleSupplementRequest(
  caseKey: string,
  request: TravelRuleSupplementRequest
): Promise<TravelRuleSupplementResult> {
  return (await apiRequest<TravelRuleSupplementResult>(
    `/api/v1/compliance/travel-rule/cases/${encodeURIComponent(caseKey)}/supplement-requests`,
    { method: 'POST', body: request }
  )) as TravelRuleSupplementResult
}

export async function fetchTravelRuleExchanges(
  request: TravelRuleExchangeRequest = {}
): Promise<TravelRuleExchangeListResponse> {
  return (await apiRequest<TravelRuleExchangeListResponse>(
    `/api/v1/compliance/travel-rule/exchanges${queryString({ direction: request.direction, status: request.status, vasp: request.vasp, page: request.page, pageSize: request.pageSize })}`
  )) as TravelRuleExchangeListResponse
}

export async function fetchTravelRuleExchangeDetail(
  exchangeId: string
): Promise<TravelRuleExchangeDetail> {
  return (await apiRequest<TravelRuleExchangeDetail>(
    `/api/v1/compliance/travel-rule/exchanges/${encodeURIComponent(exchangeId)}`
  )) as TravelRuleExchangeDetail
}

export async function submitTravelRuleRetryRequest(
  exchangeId: string,
  request: TravelRuleRetryRequest
): Promise<TravelRuleRetryResult> {
  return (await apiRequest<TravelRuleRetryResult>(
    `/api/v1/compliance/travel-rule/exchanges/${encodeURIComponent(exchangeId)}/retry-requests`,
    { method: 'POST', body: request }
  )) as TravelRuleRetryResult
}

export async function fetchTravelRuleConfiguration(): Promise<TravelRuleConfiguration> {
  return (await apiRequest<TravelRuleConfiguration>(
    '/api/v1/compliance/travel-rule/configuration/current?includeDraft=true&includeHistory=true'
  )) as TravelRuleConfiguration
}

export async function saveTravelRuleConfigurationDraft(
  request: TravelRuleConfigurationDraftRequest
): Promise<TravelRuleConfigurationDraftResult> {
  return (await apiRequest<TravelRuleConfigurationDraftResult>(
    '/api/v1/compliance/travel-rule/configuration/draft',
    { method: 'PUT', body: request }
  )) as TravelRuleConfigurationDraftResult
}

export async function runTravelRuleConfigurationSimulation(
  request: TravelRuleConfigurationSimulationRequest
): Promise<TravelRuleSimulationResult> {
  return (await apiRequest<TravelRuleSimulationResult>(
    '/api/v1/compliance/travel-rule/configuration/simulations',
    { method: 'POST', body: request }
  )) as TravelRuleSimulationResult
}

export async function approveTravelRuleConfigurationVersion(
  versionKey: string,
  request: TravelRuleConfigurationApprovalRequest
): Promise<TravelRuleConfigurationApprovalResult> {
  return (await apiRequest<TravelRuleConfigurationApprovalResult>(
    `/api/v1/compliance/travel-rule/configuration/versions/${encodeURIComponent(versionKey)}/approval`,
    { method: 'POST', body: request }
  )) as TravelRuleConfigurationApprovalResult
}

export async function fetchTravelRuleEvidenceChain(
  caseKey: string
): Promise<TravelRuleEvidenceChain> {
  return (await apiRequest<TravelRuleEvidenceChain>(
    `/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(caseKey)}`
  )) as TravelRuleEvidenceChain
}

export async function fetchTravelRuleEvidenceNodeDetail(
  evidenceChainKey: string,
  nodeKey: string
): Promise<TravelRuleEvidenceNodeDetail> {
  return (await apiRequest<TravelRuleEvidenceNodeDetail>(
    `/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(evidenceChainKey)}/nodes/${encodeURIComponent(nodeKey)}`
  )) as TravelRuleEvidenceNodeDetail
}

export async function generateTravelRuleReportBasis(
  evidenceChainKey: string,
  request: TravelRuleReportBasisRequest
): Promise<TravelRuleReportBasis> {
  return (await apiRequest<TravelRuleReportBasis>(
    `/api/v1/compliance/travel-rule/evidence-chains/${encodeURIComponent(evidenceChainKey)}/report-basis`,
    { method: 'POST', body: request }
  )) as TravelRuleReportBasis
}

// ─── 合规规则 ───

/**
 * 分页查询规则（含条件）
 * POST /compliance/rules/list
 */
export async function fetchComplianceRules(query: ComplianceRuleQuery = {}): Promise<PageRiskRule> {
  const body = {
    pageIndex: query.pageIndex ?? 1,
    pageSize: query.pageSize ?? 20,
    sortFields: query.sortFields,
    queryList: query.queryList ?? []
  }
  return (await apiRequest<PageRiskRule>('/compliance/rules/list', {
    method: 'POST',
    body
  })) as PageRiskRule
}

/**
 * 查询规则详情（含条件）
 * GET /compliance/rules/{id}
 */
export async function fetchComplianceRuleDetail(id: number | string): Promise<ComplianceRuleView> {
  return (await apiRequest<ComplianceRuleView>(
    `/compliance/rules/${encodeURIComponent(id)}`
  )) as ComplianceRuleView
}

/**
 * 新增规则
 * POST /compliance/rules
 */
export async function createComplianceRule(
  request: ComplianceRuleRequest
): Promise<ComplianceRuleView> {
  return (await apiRequest<ComplianceRuleView>('/compliance/rules', {
    method: 'POST',
    body: request
  })) as ComplianceRuleView
}

/**
 * 修改规则
 * PUT /compliance/rules/{id}
 */
export async function updateComplianceRule(
  id: number | string,
  request: ComplianceRuleRequest
): Promise<ComplianceRuleView> {
  return (await apiRequest<ComplianceRuleView>(`/compliance/rules/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: request
  })) as ComplianceRuleView
}

/**
 * 启用/停用规则
 * PUT /compliance/rules/{id}/enabled
 */
export async function updateComplianceRuleEnabled(
  id: number | string,
  request: ComplianceRuleEnableRequest
): Promise<ComplianceRuleView> {
  return (await apiRequest<ComplianceRuleView>(
    `/compliance/rules/${encodeURIComponent(id)}/enabled`,
    {
      method: 'PUT',
      body: request
    }
  )) as ComplianceRuleView
}

/**
 * 删除规则（内置规则不可删除）
 * DELETE /compliance/rules/{id}
 */
export async function deleteComplianceRule(id: number | string): Promise<void> {
  await apiRequest<void>(`/compliance/rules/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

/**
 * 列出因子目录；enabled=true 时仅返回启用中的因子
 * GET /compliance/factors
 */
export async function fetchComplianceFactors(enabled?: boolean): Promise<FactorView[]> {
  const query = enabled === undefined ? '' : `?enabled=${enabled}`
  return (await apiRequest<FactorView[]>(`/compliance/factors${query}`)) as FactorView[]
}

/** 币种 Travel Rule 汇率/门槛配置（1 coin = ? USD） */
export interface TravelRuleCoinRate {
  id: number
  coinId: string
  usdRate: number
  minAmountUsd: number
  enabled: boolean
  updatedAt: string
}

/**
 * 查询全部币种门槛与汇率配置
 * GET /compliance/travel-rule/coins/list
 */
export async function fetchTravelRuleCoinRates(): Promise<TravelRuleCoinRate[]> {
  return (await apiRequest<TravelRuleCoinRate[]>(
    '/compliance/travel-rule/coins/list'
  )) as TravelRuleCoinRate[]
}

// ─── 合规交易透镜（/compliance/transactions/*）───

/**
 * 分页查询交易流水
 * POST /compliance/transactions/list
 */
export async function fetchTransactionLensList(
  query: TransactionLensQuery = {}
): Promise<PageTransactionLensItemView> {
  return (await apiRequest<PageTransactionLensItemView>('/compliance/transactions/list', {
    method: 'POST',
    body: query
  })) as PageTransactionLensItemView
}

/**
 * 查询交易透镜统计
 * GET /compliance/transactions/summary
 */
export async function fetchTransactionLensSummary(): Promise<TransactionLensSummaryView> {
  return (await apiRequest<TransactionLensSummaryView>(
    '/compliance/transactions/summary'
  )) as TransactionLensSummaryView
}

/**
 * 查询交易详情头卡
 * GET /compliance/transactions/{orderId}/overview
 */
export async function fetchTransactionLensOverview(
  orderId: string
): Promise<TransactionLensItemView> {
  return (await apiRequest<TransactionLensItemView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/overview`
  )) as TransactionLensItemView
}

/**
 * 查询交易合规详情
 * GET /compliance/transactions/{orderId}/compliance
 */
export async function fetchTransactionComplianceTab(orderId: string): Promise<ComplianceTabView> {
  return (await apiRequest<ComplianceTabView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/compliance`
  )) as ComplianceTabView
}

/**
 * 查询交易 Travel Rule 详情
 * GET /compliance/transactions/{orderId}/travel-rule
 */
export async function fetchTransactionTravelRuleTab(orderId: string): Promise<TravelRuleTabView> {
  return (await apiRequest<TravelRuleTabView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/travel-rule`
  )) as TravelRuleTabView
}

/**
 * 查询交易 Sign-off 详情
 * GET /compliance/transactions/{orderId}/signoff
 */
export async function fetchTransactionSignoffTab(orderId: string): Promise<SignoffTabView> {
  return (await apiRequest<SignoffTabView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/signoff`
  )) as SignoffTabView
}

/**
 * 查询交易资金处置详情
 * GET /compliance/transactions/{orderId}/disposition
 */
export async function fetchTransactionDispositionTab(orderId: string): Promise<DispositionTabView> {
  return (await apiRequest<DispositionTabView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/disposition`
  )) as DispositionTabView
}

/**
 * 查询交易链上详情
 * GET /compliance/transactions/{orderId}/onchain
 */
export async function fetchTransactionOnChainTab(orderId: string): Promise<OnChainTabView> {
  return (await apiRequest<OnChainTabView>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/onchain`
  )) as OnChainTabView
}

/**
 * 放行交易
 * POST /compliance/transactions/{orderId}/approve
 */
export async function approveTransaction(
  orderId: string,
  params?: { operator?: string; note?: string }
): Promise<boolean> {
  const q = queryString({ operator: params?.operator, note: params?.note })
  return (await apiRequest<boolean>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/approve${q}`,
    { method: 'POST' }
  )) as boolean
}

/**
 * 拒绝交易
 * POST /compliance/transactions/{orderId}/reject
 */
export async function rejectTransaction(
  orderId: string,
  params?: { operator?: string; note?: string }
): Promise<boolean> {
  const q = queryString({ operator: params?.operator, note: params?.note })
  return (await apiRequest<boolean>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/reject${q}`,
    { method: 'POST' }
  )) as boolean
}

/**
 * 恢复挂起出金订单
 * POST /compliance/transactions/{orderId}/resume
 */
export async function resumeTransaction(orderId: string): Promise<boolean> {
  return (await apiRequest<boolean>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/resume`,
    { method: 'POST' }
  )) as boolean
}

/**
 * 取消挂起出金订单
 * POST /compliance/transactions/{orderId}/cancel
 */
export async function cancelTransaction(orderId: string, reason?: string): Promise<boolean> {
  const q = reason ? `?reason=${encodeURIComponent(reason)}` : ''
  return (await apiRequest<boolean>(
    `/compliance/transactions/${encodeURIComponent(orderId)}/cancel${q}`,
    { method: 'POST' }
  )) as boolean
}

// ─── Travel Rule 通知审核（/compliance/notifications，双向）───

/**
 * 分页查询 Travel Rule 通知（双向）
 * GET /compliance/notifications
 */
export async function fetchInboundNotifications(
  params?: InboundNotificationQuery
): Promise<InboundNotificationPage> {
  const q = queryString({
    direction: params?.direction,
    status: params?.status,
    ecode: params?.ecode,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    keyword: params?.keyword,
    page: params?.page,
    pageSize: params?.pageSize
  })
  return (await apiRequest<InboundNotificationPage>(
    `/compliance/notifications${q}`
  )) as InboundNotificationPage
}

/**
 * 查看通知详情
 * GET /compliance/notifications/{id}
 */
export async function fetchInboundNotificationDetail(
  id: number | string
): Promise<InboundNotificationDetail> {
  return (await apiRequest<InboundNotificationDetail>(
    `/compliance/notifications/${encodeURIComponent(id)}`
  )) as InboundNotificationDetail
}

/**
 * 接受通知
 * POST /compliance/notifications/{id}/accept
 */
export async function acceptInboundNotification(id: number | string): Promise<unknown> {
  return (await apiRequest<unknown>(`/compliance/notifications/${encodeURIComponent(id)}/accept`, {
    method: 'POST'
  })) as unknown
}

/**
 * 拒绝通知
 * POST /compliance/notifications/{id}/reject
 */
export async function rejectInboundNotification(
  id: number | string,
  request?: InboundRejectRequest
): Promise<unknown> {
  return (await apiRequest<unknown>(`/compliance/notifications/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: request ?? {}
  })) as unknown
}

// ─── 合规告警（/compliance/alerts/*）───

/**
 * 分页查询合规告警
 * POST /compliance/alerts/list
 */
export async function fetchComplianceAlerts(
  query: ComplianceAlertQuery = {}
): Promise<ComplianceAlertPage> {
  const body = {
    pageIndex: query.pageIndex ?? 1,
    pageSize: query.pageSize ?? 20,
    sortFields: query.sortFields,
    queryList: query.queryList ?? []
  }
  return (await apiRequest<ComplianceAlertPage>('/compliance/alerts/list', {
    method: 'POST',
    body
  })) as ComplianceAlertPage
}

/**
 * 查询告警详情（含时间线）
 * GET /compliance/alerts/{id}
 */
export async function fetchComplianceAlertDetail(
  id: number | string
): Promise<ComplianceAlertDetail> {
  return (await apiRequest<ComplianceAlertDetail>(
    `/compliance/alerts/${encodeURIComponent(id)}`
  )) as ComplianceAlertDetail
}
