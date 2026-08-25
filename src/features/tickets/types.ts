export type TicketCenter = 'operations' | 'risk' | 'compliance'
export type TicketQueue = 'all' | 'triage' | 'domain_processing' | 'supervisor_escalation'
export type TicketDisplayStatus =
  'all_open' | 'new' | 'in_progress' | 'pending_review' | 'completed' | 'closed'
export type TicketUrgency = 'all' | 'critical' | 'high' | 'medium' | 'low'
export type TicketScope = 'all' | 'mine'
export type TicketAction =
  | 'start_progress'
  | 'reassign'
  | 'add_comment'
  | 'add_evidence'
  | 'submit_completion'
  | 'close'
  | 'withdraw'

export interface TicketQueueRequest {
  center?: TicketCenter
  queue?: TicketQueue
  displayStatus?: TicketDisplayStatus
  urgency?: TicketUrgency
  ticketType?: string
  scope?: TicketScope
  search?: string
  page?: number
  pageSize?: number
}

export interface TicketPagination {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

export interface TicketActorRef {
  accountId: string | null
  displayName: string | null
  unassigned?: boolean
}

export interface TicketMerchantRef {
  merchantId: string
  displayName: string
}

export interface TicketSla {
  remainingText: string
  ratioRemaining: number | null
  breached: boolean
  severity: 'ok' | 'warning' | 'danger' | 'none'
}

export interface TicketQueueItem {
  ticketId: string
  ticketNumber: string
  title: string
  ticketType: string
  domainExtension?: TicketDomainExtension
  upstreamTriggerSource: string
  urgency: string
  displayStatus: string
  sla: TicketSla
  assignee: TicketActorRef
  merchant?: TicketMerchantRef
  currentQueue: string
  ticketVersion: number
}

export interface TicketQueueResponse {
  items: TicketQueueItem[]
  pagination: TicketPagination
  filterOptions: Record<string, string[]>
  adapterTypeProfiles?: TicketAdapterTypeProfile[]
  semanticErrors?: TicketSemanticError[]
}

export interface TicketAdapterTypeProfile {
  ticketType: string
  typeFamily: string
  owningCenter: string
  domainOwner: string
  allowedDomainObjectType: string
  initialQueue: string
  defaultUrgency: string
  closePolicy: string
  activeState: string
}

export interface TicketDomainExtensionBinding {
  bindingId: string
  ticketId: string
  ticketType: string
  domainOwner: string
  domainObjectType: string
  domainObjectRef: string
  domainCaseRef?: string
  projectionSchemaKey: string
  projectionVersion: number
  syncDirection: string
  lifecycleState: string
}

export interface TicketDomainExtension {
  typeProfile: TicketAdapterTypeProfile
  binding: TicketDomainExtensionBinding
  projectionSchemaKey: string
  projection: Record<string, unknown>
}

export interface TicketSemanticError {
  semanticCode: string
  httpStatus: number
  meaning: string
  frontendRule: string
}

export interface TicketAuditEvent {
  eventId: string
  ticketId: string
  eventType: string
  actor: string
  actorType?: string
  occurredAt: string
  summary: string
  beforeState?: string
  afterState?: string
}

export interface TicketComment {
  commentId: string
  author: string
  createdAt: string
  body: string
}

export interface TicketEvidenceRef {
  evidenceId: string
  label: string
  refType?: string
  refValue?: string
  createdAt: string
  createdBy: string
}

export interface TicketActionPermission {
  enabled: boolean
  disabledReason?: string
}

export interface TicketDetailView {
  ticket: {
    ticketId: string
    ticketNumber: string
    title: string
    ticketType: string
    engineState: string
    displayStatus: string
    terminalDisposition?: string
    urgency: string
    creator: TicketActorRef
    assignee: TicketActorRef
    createdAt: string
    updatedAt?: string
  }
  businessContext: {
    merchant?: TicketMerchantRef
    upstreamTriggerSource: string
    currentQueue: string
    sla: TicketSla
  }
  detail: {
    description: string
    typeExtensionSummary?: string
    domainExtension?: TicketDomainExtension
  }
  followUpRefs: Array<{ ticketId: string; ticketType: string; displayStatus: string }>
  evidenceRefs: TicketEvidenceRef[]
  comments: TicketComment[]
  auditEvents: TicketAuditEvent[]
  availableActions: TicketAction[]
  actionPermissions: Record<TicketAction, TicketActionPermission>
  ticketVersion: number
}

export interface TicketVersionRequest {
  ticketVersion: number
  comment?: string
}

export interface TicketReassignRequest {
  ticketVersion: number
  targetAssigneeAccountId: string
  targetQueue?: string
  reason: string
}

export interface TicketCompletionRequest {
  ticketVersion: number
  completionPayload: Record<string, unknown>
}

export interface TicketCloseRequest {
  ticketVersion: number
  terminalDisposition: 'resolved' | 'rejected' | 'cancelled' | 'superseded'
  closeReason: string
}

export interface TicketReasonRequest {
  ticketVersion: number
  reason: string
}

export interface TicketCommentRequest {
  body: string
}

export interface TicketEvidenceRequest {
  label: string
  refType: 'file' | 'external_link' | 'case_ref' | 'trace_ref'
  refValue: string
}

export interface TicketAuditTimelineResponse {
  items: TicketAuditEvent[]
  pagination: TicketPagination
}

export interface OpsCollaborationCreateRequest {
  title: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  description: string
  merchantId: string
  upstreamTriggerSource: 'risk' | 'compliance' | 'manual'
  collaboratorAccountIds: string[]
}

export interface OpsCollaborationCreateResponse {
  createdTicket: {
    ticketId: string
    ticketNumber: string
    detailRoute: string
  }
}

export interface TicketSearchResponse<T> {
  items: T[]
}

export interface KybContextAttachRequest {
  ticketVersion: number
  merchantSubjectRefId: string
  caseRefId: string
  verificationSessionRefId?: string
  manualReviewTaskRefId?: string
  kybActionHint?:
    'submit' | 'request_docs' | 'resubmit' | 'review' | 'approve' | 'reject' | 'escalate'
}
