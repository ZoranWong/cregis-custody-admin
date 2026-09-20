// Compliance types — from v1 src/features/compliance/types.ts
import type { TicketPagination, TicketSla } from '@/features/tickets/types'

export type ComplianceCaseType = 'rule_review' | 'escalation'
export type CompliancePriority = 'high' | 'medium' | 'low'
export type ComplianceFinalDecision =
  'approve' | 'reject' | 'request_revision' | 'confirm' | 'overturn' | 'return_for_supplement'

export interface ComplianceCaseQueueRequest {
  tab?: ComplianceCaseType | 'all' | 'travel_rule'
  caseType?: ComplianceCaseType
  priority?: CompliancePriority
  subjectName?: string
  status?: string
  page?: number
  pageSize?: number
  sortField?: 'priority' | 'submitted_at' | 'subject_name'
  sortDirection?: 'asc' | 'desc'
}

export interface ComplianceCaseQueueItem {
  ticketId: string
  ticketNumber: string
  caseId: string
  caseType: ComplianceCaseType | string
  subjectName: string
  priority: CompliancePriority | string
  submittedAt: string
  sla?: TicketSla | null
  status: string
  assigneeName?: string | null
  assigneeInitials?: string | null
  ticketVersion: number
}

export interface ComplianceCaseQueueResponse {
  items: ComplianceCaseQueueItem[]
  pagination: TicketPagination
  tabInfo: { currentTab: string; tabEnabled: boolean }
  filterOptions: Record<string, string[]>
}

export interface ComplianceCaseDetailResponse {
  ticketShell: any
  complianceCase: any
  review: any
  finalDecision: any
  ticketVersion: number
  outboxNotification?: ComplianceOutboxNotification | null
}

export interface ComplianceReviewRequest {
  ticketVersion: number
  opinion: string
}
export interface ComplianceFinalDecisionRequest {
  ticketVersion: number
  decision: ComplianceFinalDecision
  opinion: string
}

export interface ComplianceOutboxRequest {
  type?: string
  deliveryStatus?: string
  page?: number
  pageSize?: number
  sortField?: 'sent_at'
  sortDirection?: 'asc' | 'desc'
}

export interface ComplianceOutboxNotification {
  notificationId: string
  type: string
  caseId: string
  caseSubject: string
  recipient: string
  sentAt: string
  deliveryStatus: string
  body: string
  decision: string
  decisionBy: string
  decidedAt: string
}

export interface ComplianceOutboxResponse {
  items: ComplianceOutboxNotification[]
  pagination: TicketPagination
  filterOptions: Record<string, string[]>
}

export interface TravelRuleCaseRequest {
  lifecycleStatus?: string
  priority?: string
  query?: string
  page?: number
  pageSize?: number
}

export interface TravelRuleCase {
  caseKey: string
  subjectRef: string
  subjectName: string
  txHash: string
  amount: string
  currency: string
  counterpartyVasp: string
  lifecycleStatus: string
  decisionStatus: string
  priority: string
  updatedAt: string
  exchangeStatus: string
  jurisdiction: string
  threshold: string
}

export interface TravelRuleCaseListResponse {
  items: TravelRuleCase[]
  pagination: TicketPagination
  filterOptions: Record<string, string[]>
}
export interface TravelRuleCaseDetail {
  caseView: TravelRuleCase
  reviewHistory: any[]
  supplementRequests: any[]
}

export interface TravelRuleReviewRequest {
  decision: 'CLEAR' | 'BLOCK' | 'REQUEST_RESUBMIT'
  opinion: string
}
export interface TravelRuleReviewResult {
  review: any
  caseView: TravelRuleCase
}
export interface TravelRuleSupplementRequest {
  target: string
  description: string
  deadline: string
}
export interface TravelRuleSupplementResult {
  supplementRequest: any
  caseView: TravelRuleCase
}

export interface TravelRuleExchangeRequest {
  direction?: string
  status?: string
  vasp?: string
  page?: number
  pageSize?: number
}
export interface TravelRuleExchange {
  id: string
  caseRef: string
  direction: string
  vasp: string
  status: string
}
export interface TravelRuleExchangeListResponse {
  items: TravelRuleExchange[]
  pagination: TicketPagination
}
export interface TravelRuleExchangeDetail {
  exchange: TravelRuleExchange
}
export interface TravelRuleRetryRequest {
  retryReason: string
}
export interface TravelRuleRetryResult {
  exchange: TravelRuleExchange
}

export interface TravelRuleConfiguration {
  configurationKey?: string
  activeVersion?: string
  approvalStatus?: string
  version: string
  status: string
  scope: string
  updatedAt: string
  guardrail: string
  conditions: any[]
  currentVersion?: any | null
  draftVersion?: any | null
  versionHistory?: any[]
  updatedBy?: string
}

export interface TravelRuleConfigurationDraftRequest {
  triggerGroups: any[]
  validationRules: any
  diffSummary: string
  submittedBy: string
}
export interface TravelRuleConfigurationDraftResult {
  version: any
  validationStatus: string
}
export interface TravelRuleConfigurationSimulationRequest {
  versionKey: string
  sampleTransactionInfo: any
  counterpartyVaspRef: string
}
export interface TravelRuleSimulationResult {
  triggered: boolean
  triggerReason: string
  expectedLifecycleStatus: string
}
export interface TravelRuleConfigurationApprovalRequest {
  decision: 'APPROVE' | 'REJECT'
  approvalOpinion: string
  approvedBy: string
}
export interface TravelRuleConfigurationApprovalResult {
  version: any
  approvalStatus: string
  activeVersion: string
}

export interface TravelRuleEvidenceChain {
  evidenceChainKey: string
  nodes: any[]
}
export interface TravelRuleEvidenceNodeDetail {
  node: any
  detailFacts: any[]
}
export interface TravelRuleReportBasisRequest {
  templateType: string
  caseRef: string
}
export interface TravelRuleReportBasis {
  reportBasisKey: string
  templateType: string
  generationStatus: string
}

// ─── 合规规则（/compliance/rules/*）───

export type RuleDirection = 'ALL' | 'OUTGOING' | 'INCOMING'
export type RuleScopeType = 'GLOBAL' | 'MERCHANT'
export type RuleDecision = 'AUTO_REJECT' | 'SUBMIT_FOR_REVIEW' | 'HOLD'
export type RuleSeverity = 'ROUTINE' | 'MEDIUM' | 'CRITICAL'

/** 规则条件项（新增/修改入参，也用于详情回显） */
export interface RuleCondition {
  field: string
  operator: string // gt / lt / eq / gte / lte / neq / in / not_in / contains
  value: string // in / not_in 用英文逗号分隔
  /** 该因子在本规则内是否启用（规则级开关，默认 true） */
  enabled?: boolean
  sortOrder?: number
  /** 以下为详情回显冗余字段（提交时可传，后端以目录为准） */
  factorName?: string
  valueType?: FactorValueType | string
  domain?: FactorDomain | string
  defaultOperator?: string
  allowedValues?: string[]
}

/** 规则详情视图（含条件） */
export interface ComplianceRuleView {
  id: number
  ruleCode: string
  ruleName: string
  description: string
  direction: RuleDirection | string
  scopeType: RuleScopeType | string
  scopeValue: string | null
  decision: RuleDecision | string
  severity: RuleSeverity | string
  /** 金额门槛(USD)，交易金额达到门槛才校验；null=无门槛 */
  minAmountUsd: number | null
  enabled: boolean
  builtIn: boolean
  conditions: RuleCondition[]
}

/** 规则列表项（RiskRule 实体，不含条件） */
export interface ComplianceRuleItem {
  id: number
  ruleCode: string
  ruleName: string
  description: string
  direction: RuleDirection | string
  scopeType: RuleScopeType | string
  scopeValue: string | null
  decision: RuleDecision | string
  severity: RuleSeverity | string
  minAmountUsd: number | null
  enabled: boolean
  builtIn: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** 新增/修改规则入参 */
export interface ComplianceRuleRequest {
  ruleCode?: string
  ruleName: string
  description?: string
  direction: RuleDirection | string
  scopeType: RuleScopeType | string
  scopeValue?: string | null
  decision: RuleDecision | string
  severity: RuleSeverity | string
  minAmountUsd?: number | null
  enabled?: boolean
  conditions?: RuleCondition[]
}

/** 启用/停用入参 */
export interface ComplianceRuleEnableRequest {
  enabled: boolean
}

/** 分页查询入参（QueryParamRiskRule = 通用分页结构） */
export interface ComplianceRuleQuery {
  pageIndex?: number
  pageSize?: number
  sortFields?: string
  queryList?: Array<{
    key: string
    oper?: string
    value: unknown
    join?: string
  }>
}

/** 分页结果（PageRiskRule） */
export interface PageRiskRule {
  records: ComplianceRuleItem[]
  total: number
  size: number
  current: number
}

// ─── 风控因子目录（/compliance/factors）───

/** 因子值类型 */
export type FactorValueType = 'NUMBER' | 'STRING' | 'TAG_LIST' | 'ENUM'

/** 因子域 */
export type FactorDomain = 'customerDueDiligence' | 'counterpartyVasp' | 'screening'

/** 因子目录项（GET /compliance/factors） */
export interface FactorView {
  factorCode: string
  factorName: string
  valueType: FactorValueType | string
  domain: FactorDomain | string
  defaultOperator: string
  allowedValues: string[]
  enabled: boolean
  builtIn: boolean
  sortOrder: number
}

// ─── 合规交易透镜（/compliance/transactions/*）───

export interface TransactionPartyView {
  name: string | null
  address: string
  detail: string | null
  did?: string | null
}

export interface TransactionLensItemView {
  orderId: string
  direction: string
  amount: string
  coinId: string
  network: string
  createTime: string
  merchantName: string
  originator: TransactionPartyView
  beneficiary: TransactionPartyView
  compliance: string
  travelRule: string
  signoff: string
  onchain: string
  disposition: string
  reviewResult: string
}

export interface PageTransactionLensItemView {
  records: TransactionLensItemView[]
  total: number
  size: number
  current: number
}

export interface TransactionLensQuery {
  pageNum?: number
  pageSize?: number
  direction?: string
  compliance?: string
  travelRule?: string
  signoff?: string
  onchain?: string
  settlement?: string
  outcome?: string
  merchantEcode?: string
  dateFrom?: string
  dateTo?: string
  keyword?: string
}

export interface OperationalStats {
  totalTransactions: number
  settled: number
  rejected: number
  pendingReview: number
}

export interface ReviewResultStats {
  truePositive: number
  trueNegative: number
  falsePositive: number
  falseNegative: number
}

export interface TransactionLensSummaryView {
  operational: OperationalStats
  reviewResult: ReviewResultStats
  pendingReviewBreakdown: string[] | null
}

export interface RuleTriggerView {
  /** 规则 ID，用于跳转规则详情（老接口可能不返回） */
  id?: number
  ruleCode: string
  ruleName: string
  decision: string
  severity: string
  description: string
  /** 命中时该规则的具体条件（field/operator/value），用于展示命中原因 */
  conditions: Array<{
    field: string
    operator?: string
    value?: string
    logicToNext?: string | null
  }>
}

export interface CheckItemView {
  /** 后端返回的可读标签（如 "Onboarding Status"） */
  label: string
  value: string | null
  passed: boolean
}

export interface ScreeningItemView {
  subject: string
  result: string
}

export interface ScreeningView {
  entity: ScreeningItemView[]
  onchain: ScreeningItemView[]
}

export interface TravelRuleSummaryView {
  status: string
  vaspDid: string | null
  ivms101Status: string
}

export interface CommunicationRoundView {
  roundNo: number
  type: string
  status: string
  initiator: string
  requestedAt: string
  responseAt: string
  questions: Record<string, unknown>[]
  payload: Record<string, unknown> | null
}

export interface TimelineNodeView {
  label: string
  detail: string
  time: string
  status: string
}

export interface ComplianceTabView {
  orderId: string
  riskScore: number
  decision: string
  conclusion: string
  dispositionStatus: string | null
  rulesTriggered: RuleTriggerView[]
  cddChecklist: CheckItemView[]
  screening: ScreeningView
  travelRuleSummary: TravelRuleSummaryView
  communication: CommunicationRoundView[]
  timeline: TimelineNodeView[]
}

export interface VaspIdentityView {
  name: string
  originatorDid: string
  beneficiaryDid: string
  status: string
}

export interface TravelRuleTabView {
  orderId: string
  notabeneTxId: string | null
  status: string | null
  vaspIdentity: VaspIdentityView | null
  ivms101Status: string | null
  ivms101Pii: Record<string, unknown> | null
  networkTrace: TimelineNodeView[] | null
  manualTrace: TimelineNodeView[] | null
}

export interface ApproverView {
  attendeeId: number
  status: number
  statusLabel: string
  updatedAt: string
}

export interface SignoffTabView {
  orderId: string
  taskId: string | null
  state: string | null
  initiator: string | null
  threshold: number | null
  total: number | null
  approvers: ApproverView[]
  signers: string[]
}

export interface QuarantineView {
  reasonType: string
  amount: string
  action: string
  status: string
  actionAt: string
  actionNote: string
}

export interface DispositionTabView {
  orderId: string
  status: string
  amount: string
  heldSince: string
  holdBalance: string
  forfeitureDestination: string
  quarantine: QuarantineView[]
}

export interface OnChainTabView {
  orderId: string
  network: string
  txHash: string | null
  status: string
  fee: string | null
  blockNumber: string | null
  blockHash: string | null
  confirmations: number | null
  blockTime: string | null
  finalized: boolean | null
  nonce: string | null
  gasUsed: string | null
  gasPrice: string | null
  timeline: TimelineNodeView[]
}

// ─── 入金通知审核（/compliance/notifications，双向 Travel Rule 通知）───

export interface InboundNotificationItem {
  id: number
  /** 方向：INBOUND-入金 / OUTBOUND-出金 */
  direction: string
  ecode: string | null
  /** 商户名称 */
  enterpriseName: string | null
  /** 币种 ID（旧数据可能为 null，需用 assetCode 兜底解析） */
  coinId: string | null
  network: string | null
  transferId: string
  assetAmount: number
  assetCode: string
  originatorDid: string | null
  beneficiaryDid: string | null
  sourceAddress: string
  settlementAddress: string
  status: string
  notabeneStatus: string | null
  notabeneTxId: string | null
  /** 双方 IVMS101 PII（列表接口已直接返回，用于展示名称/地址） */
  ivms101Payload: Record<string, unknown> | null
  createTime: string
  updateTime: string
}

export interface InboundNotificationPage {
  items: InboundNotificationItem[]
  page: number
  pageSize: number
  total: number
}

export interface InboundNotificationDetail extends InboundNotificationItem {
  clientRef: string | null
  pdUrl: string | null
  webhookEvents: unknown | null
}

export interface InboundNotificationQuery {
  direction?: string
  status?: string
  ecode?: string
  dateFrom?: string
  dateTo?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface InboundRejectRequest {
  reason?: string
  comment?: string
}

// ─── 合规告警（/compliance/alerts/*）───

/** 命中规则明细（告警列表接口已反序列化，不再是 JSON 文本） */
export interface AlertRuleHitView {
  ruleCode: string
  ruleName: string
  decision: string
  severity: string
}

export interface ComplianceAlertItem {
  id: number
  /** 交易金额（链上最小精度 BigInteger，需按币种 decimals 换算） */
  amount: number | string
  bizRefId: string
  /** 业务引用类型：PAYOUT_ORDER / WITHDRAW_ORDER / INBOUND_ORDER */
  bizRefType: string
  /** 内部细粒度结论：PASS / HOLD / BLOCK / MANUAL_REVIEW 等 */
  conclusion: string
  createTime: string
  /** 币种 coinId */
  currency: string
  /** 业务决策：PASS(放行) / HOLD(挂起) / BLOCK(阻断) */
  decision: string
  /** 方向：OUTGOING(出金) / INCOMING(入金) */
  direction: string
  disposedAt: string | null
  disposedBy: string | null
  /** 处置状态：PENDING(待处置) / APPROVED(已放行) / REJECTED(已拒绝) */
  dispositionStatus: string
  merchantEcode: string
  riskScore: number | null
  /** 命中规则明细，列表接口可能为 null */
  ruleHits: AlertRuleHitView[] | null
  originator: TransactionPartyView | null
  beneficiary: TransactionPartyView | null
}

export interface ComplianceAlertPage {
  records: ComplianceAlertItem[]
  total: number
  size: number
  current: number
  pages: number
}

export interface ComplianceAlertQuery {
  pageIndex?: number
  pageSize?: number
  sortFields?: string
  queryList?: Array<{
    key: string
    oper?: string
    value: unknown
    join?: string
  }>
}

export interface ComplianceAlertTimelineEvent {
  id: number
  createTime: string
  /** 事件类型：HOLD / AUTO_ESCALATED / MANUAL_REVIEW / APPROVE / REJECT / RELEASE 等 */
  eventType: string
  operator: string
  /** 事件负载，如 { note: '命中规则自动挂起', direction: 'OUTGOING' } */
  payload: { note?: string; direction?: string } | null
}

export interface ComplianceAlertDetail extends ComplianceAlertItem {
  timeline: ComplianceAlertTimelineEvent[] | null
}
