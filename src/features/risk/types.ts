// Risk types — from v1 src/features/risk/types.ts
import type { TicketPagination, TicketSla } from '@/features/tickets/types'

export type RiskQueueTab = 'disposition' | 'approval'
export type RiskCaseStatus =
  'pending' | 'reviewing' | 'pending_approval' | 'approved' | 'rejected' | 'escalated'
export type RiskPriority = 'high' | 'medium' | 'low'

export interface RiskCaseQueueRequest {
  tab?: RiskQueueTab
  priority?: RiskPriority
  riskType?: string
  merchantName?: string
  status?: RiskCaseStatus
  page?: number
  pageSize?: number
}

export interface RiskCaseQueueItem {
  ticketId: string
  ticketNumber: string
  caseId: string
  priority: RiskPriority | string
  merchantName: string
  riskType: string
  submittedAt: string
  sla?: TicketSla | null
  status: RiskCaseStatus | string
  assigneeName?: string | null
  assigneeInitials?: string | null
  ticketVersion: number
}

export interface RiskCaseQueueResponse {
  items: RiskCaseQueueItem[]
  pagination: TicketPagination
  filterOptions: Record<string, string[]>
}

export interface RiskCaseProjection {
  ticketId: string
  caseId: string
  caseNumber: string
  riskType: string
  riskLevel: string
  status: string
  domainPriority: string
  domainSummary?: string
  readonlyAfterEscalation: boolean
  rawProjection: Record<string, unknown>
}

export interface RiskCaseDetailResponse {
  ticketShell: any
  riskCase: RiskCaseProjection
  kytSummary: any
  merchantContext: any
  disposition: any
  adjudication: any
  escalationRequest?: any | null
  followUpRefs: any[]
  evidenceRefs: any[]
  comments: any[]
  operationHistory: any[]
  availableActions: string[]
  ticketVersion: number
}

export interface RiskDispositionRequest {
  ticketVersion: number
  opinion: string
  notes?: string
}
export interface RiskAdjudicationRequest {
  ticketVersion: number
  decision: string
  opinion: string
}
export interface RiskEscalationRequest {
  ticketVersion: number
  reason: string
  notes?: string
  confirmed: boolean
}

export interface RiskOutboxRequest {
  type?: string
  deliveryStatus?: string
  recipient?: string
  timeRange?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface RiskOutboxNotification {
  notificationId: string
  type: string
  caseId: string
  caseMerchant: string
  recipient: string
  sentAt: string
  deliveryStatus: string
  body: string
  decision: string
  decisionBy: string
  decidedAt: string
}

export interface RiskOutboxResponse {
  items: RiskOutboxNotification[]
  pagination: TicketPagination
  filterOptions: Record<string, string[]>
}
