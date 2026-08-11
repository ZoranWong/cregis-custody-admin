// System Admin types — 系统管理类型定义

import type { TicketPagination } from "@/features/tickets/types";

export type EmployeeStatus = "all" | "pending_activation" | "active" | "disabled" | "expired";

export interface EmployeePageQuery {
  pageNum?: number; pageSize?: number;
  status?: EmployeeStatus; searchQuery?: string;
}

export interface EmployeeRowView {
  accountId: string; displayName: string; email: string;
  activationStatus: "pending" | "completed" | "expired";
  accountStatus: "enabled" | "disabled";
  roleCode: string; lastSignInAt?: string;
  authorizedDomainIds: string[]; defaultEntryId: string;
}

export interface EmployeeCreateInput {
  displayName: string; email: string;
  initialRoleCode: string; authorizedDomainIds: string[];
  defaultEntryId: string;
}

export interface SystemMonitorMetric {
  key: string; label: string; value: number; trend: number; unit: string;
}

export interface SystemMonitorServiceStatus {
  name: string; status: "healthy" | "degraded" | "down"; latency: number;
}

export interface SystemMonitorResponse {
  metrics: SystemMonitorMetric[]; services: SystemMonitorServiceStatus[];
}