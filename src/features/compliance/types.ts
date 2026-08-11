// Compliance types — from v1 src/features/compliance/types.ts
import type { TicketPagination, TicketSla } from "@/features/tickets/types";

export type ComplianceCaseType = "rule_review" | "escalation";
export type CompliancePriority = "high" | "medium" | "low";
export type ComplianceFinalDecision = "approve" | "reject" | "request_revision" | "confirm" | "overturn" | "return_for_supplement";

export interface ComplianceCaseQueueRequest {
  tab?: ComplianceCaseType | "all" | "travel_rule"; caseType?: ComplianceCaseType; priority?: CompliancePriority;
  subjectName?: string; status?: string; page?: number; pageSize?: number;
  sortField?: "priority" | "submitted_at" | "subject_name"; sortDirection?: "asc" | "desc";
}

export interface ComplianceCaseQueueItem {
  ticketId: string; ticketNumber: string; caseId: string; caseType: ComplianceCaseType | string;
  subjectName: string; priority: CompliancePriority | string; submittedAt: string;
  sla?: TicketSla | null; status: string; assigneeName?: string | null; assigneeInitials?: string | null; ticketVersion: number;
}

export interface ComplianceCaseQueueResponse {
  items: ComplianceCaseQueueItem[]; pagination: TicketPagination;
  tabInfo: { currentTab: string; tabEnabled: boolean }; filterOptions: Record<string, string[]>;
}

export interface ComplianceCaseDetailResponse {
  ticketShell: any; complianceCase: any; review: any; finalDecision: any;
  ticketVersion: number; outboxNotification?: ComplianceOutboxNotification | null;
}

export interface ComplianceReviewRequest { ticketVersion: number; opinion: string }
export interface ComplianceFinalDecisionRequest { ticketVersion: number; decision: ComplianceFinalDecision; opinion: string }

export interface ComplianceOutboxRequest {
  type?: string; deliveryStatus?: string; page?: number; pageSize?: number;
  sortField?: "sent_at"; sortDirection?: "asc" | "desc";
}

export interface ComplianceOutboxNotification {
  notificationId: string; type: string; caseId: string; caseSubject: string;
  recipient: string; sentAt: string; deliveryStatus: string;
  body: string; decision: string; decisionBy: string; decidedAt: string;
}

export interface ComplianceOutboxResponse {
  items: ComplianceOutboxNotification[]; pagination: TicketPagination; filterOptions: Record<string, string[]>;
}

export interface TravelRuleCaseRequest {
  lifecycleStatus?: string; priority?: string; query?: string; page?: number; pageSize?: number;
}

export interface TravelRuleCase {
  caseKey: string; subjectRef: string; subjectName: string; txHash: string; amount: string;
  currency: string; counterpartyVasp: string; lifecycleStatus: string; decisionStatus: string;
  priority: string; updatedAt: string; exchangeStatus: string; jurisdiction: string; threshold: string;
}

export interface TravelRuleCaseListResponse { items: TravelRuleCase[]; pagination: TicketPagination; filterOptions: Record<string, string[]>; }
export interface TravelRuleCaseDetail { caseView: TravelRuleCase; reviewHistory: any[]; supplementRequests: any[]; }

export interface TravelRuleReviewRequest { decision: "CLEAR" | "BLOCK" | "REQUEST_RESUBMIT"; opinion: string }
export interface TravelRuleReviewResult { review: any; caseView: TravelRuleCase; }
export interface TravelRuleSupplementRequest { target: string; description: string; deadline: string }
export interface TravelRuleSupplementResult { supplementRequest: any; caseView: TravelRuleCase; }

export interface TravelRuleExchangeRequest { direction?: string; status?: string; vasp?: string; page?: number; pageSize?: number; }
export interface TravelRuleExchange { id: string; caseRef: string; direction: string; vasp: string; status: string; }
export interface TravelRuleExchangeListResponse { items: TravelRuleExchange[]; pagination: TicketPagination; }
export interface TravelRuleExchangeDetail { exchange: TravelRuleExchange; }
export interface TravelRuleRetryRequest { retryReason: string }
export interface TravelRuleRetryResult { exchange: TravelRuleExchange; }

export interface TravelRuleConfiguration {
  configurationKey?: string; activeVersion?: string; approvalStatus?: string;
  version: string; status: string; scope: string; updatedAt: string;
  guardrail: string; conditions: any[]; currentVersion?: any | null; draftVersion?: any | null;
  versionHistory?: any[]; updatedBy?: string;
}

export interface TravelRuleConfigurationDraftRequest { triggerGroups: any[]; validationRules: any; diffSummary: string; submittedBy: string; }
export interface TravelRuleConfigurationDraftResult { version: any; validationStatus: string; }
export interface TravelRuleConfigurationSimulationRequest { versionKey: string; sampleTransactionInfo: any; counterpartyVaspRef: string; }
export interface TravelRuleSimulationResult { triggered: boolean; triggerReason: string; expectedLifecycleStatus: string; }
export interface TravelRuleConfigurationApprovalRequest { decision: "APPROVE" | "REJECT"; approvalOpinion: string; approvedBy: string; }
export interface TravelRuleConfigurationApprovalResult { version: any; approvalStatus: string; activeVersion: string; }

export interface TravelRuleEvidenceChain { evidenceChainKey: string; nodes: any[]; }
export interface TravelRuleEvidenceNodeDetail { node: any; detailFacts: any[]; }
export interface TravelRuleReportBasisRequest { templateType: string; caseRef: string; }
export interface TravelRuleReportBasis { reportBasisKey: string; templateType: string; generationStatus: string; }