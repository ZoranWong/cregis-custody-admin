// Audit types — 审计管理类型定义

import type { TicketPagination } from "@/features/tickets/types";

export interface AuditTrailQuery {
  startDate?: string; endDate?: string; actor?: string; actionType?: string;
  targetModule?: string; targetId?: string; page?: number; pageSize?: number;
}

export interface AuditTrailEvent {
  eventId: string; occurredAt: string; actorId: string; actorName: string;
  actorRole: string; actionType: string; targetModule: string; targetId: string;
  targetLabel: string; outcome: string; ipAddress: string;
  beforeSnapshot?: string; afterSnapshot?: string; reason?: string;
}

export interface AuditTrailResponse {
  items: AuditTrailEvent[]; pagination: TicketPagination;
}

export interface AuditSupervisionMetric {
  key: string; label: string; value: number; trend: number; unit: string;
}

export interface AuditSupervisionResponse {
  metrics: AuditSupervisionMetric[]; recentEvents: AuditTrailEvent[];
}

export interface AuditPlan {
  planId: string; title: string; scope: string; owner: string;
  status: string; startDate: string; endDate: string; progress: number;
}

export interface AuditPlanListResponse {
  items: AuditPlan[]; pagination: TicketPagination;
}

export interface AuditFinding {
  findingId: string; title: string; severity: string; status: string;
  owner: string; dueDate: string; description: string; remediation: string;
}

export interface AuditFindingListResponse {
  items: AuditFinding[]; pagination: TicketPagination;
}

export interface AuditRegulatoryReport {
  reportId: string; title: string; jurisdiction: string; status: string;
  generatedAt: string; format: string; downloadRef?: string;
}

export interface AuditRegulatoryReportListResponse {
  items: AuditRegulatoryReport[]; pagination: TicketPagination;
}

export interface AuditExportRequest {
  startDate: string; endDate: string; modules: string[]; format: "csv" | "xlsx" | "json";
}

export interface AuditExportResult {
  exportId: string; status: string; downloadRef?: string;
}