// @ts-nocheck
import { apiRequest } from "@/utils/http/request";
import type {
  CaseFilterOptionsView,
  CaseQueueSummaryView,
  KybCaseDetailView,
  KybCaseListItemView,
  KybTaskListItemView,
  PageResult,
  StaffOption,
  TaskFilterOptionsView,
  TaskQueueSummaryView,
  WorkbenchOverviewView
} from "@/types/models";

export interface CaseQuery {
  pageNum: number;
  pageSize: number;
  view: string;
  currentStage: string;
  providerCode: string;
  priorityLevel: string;
  slaState: string;
  assignedRole: string;
  ownerKeyword: string;
  caseNo: string;
  merchantName: string;
  processingStatus: string;
  decisionStatus: string;
}

export interface TaskQuery {
  pageNum: number;
  pageSize: number;
  taskStatus: string;
  currentStage: string;
  priorityLevel: string;
  slaState: string;
  assignedRole: string;
  ownerKeyword: string;
  caseNo: string;
  merchantName: string;
}

function toQueryString(values: object): string {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value === "" || value == null) {
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchWorkbenchOverview(): Promise<WorkbenchOverviewView> {
  return apiRequest<WorkbenchOverviewView>("/api/v1/admin/kyb/workbench/overview");
}

export function fetchCases(query: CaseQuery): Promise<PageResult<KybCaseListItemView>> {
  return apiRequest<PageResult<KybCaseListItemView>>(`/api/v1/admin/kyb/cases${toQueryString(query)}`);
}

export function fetchCaseSummary(): Promise<CaseQueueSummaryView> {
  return apiRequest<CaseQueueSummaryView>("/api/v1/admin/kyb/cases/summary");
}

export function fetchCaseFilterOptions(): Promise<CaseFilterOptionsView> {
  return apiRequest<CaseFilterOptionsView>("/api/v1/admin/kyb/cases/filter-options");
}

export function fetchTasks(query: TaskQuery): Promise<PageResult<KybTaskListItemView>> {
  return apiRequest<PageResult<KybTaskListItemView>>(`/api/v1/admin/kyb/tasks${toQueryString(query)}`);
}

export function fetchTaskSummary(query: TaskQuery): Promise<TaskQueueSummaryView> {
  return apiRequest<TaskQueueSummaryView>(`/api/v1/admin/kyb/tasks/summary${toQueryString(query)}`);
}

export function fetchTaskFilterOptions(): Promise<TaskFilterOptionsView> {
  return apiRequest<TaskFilterOptionsView>("/api/v1/admin/kyb/tasks/filter-options");
}

export function fetchCaseDetail(caseId: string | number): Promise<KybCaseDetailView> {
  return apiRequest<KybCaseDetailView>(`/api/v1/admin/kyb/cases/${caseId}`);
}

export function approveCase(caseId: string | number, reason: string): Promise<KybCaseDetailView> {
  return apiRequest<KybCaseDetailView>(`/api/v1/admin/kyb/cases/${caseId}/approve`, {
    method: "POST",
    body: { reason }
  });
}

export function rejectCase(caseId: string | number, reason: string): Promise<KybCaseDetailView> {
  return apiRequest<KybCaseDetailView>(`/api/v1/admin/kyb/cases/${caseId}/reject`, {
    method: "POST",
    body: { reason }
  });
}

export function requestDocuments(caseId: string | number, reason: string): Promise<KybCaseDetailView> {
  return apiRequest<KybCaseDetailView>(`/api/v1/admin/kyb/cases/${caseId}/request-documents`, {
    method: "POST",
    body: { reason }
  });
}

export function escalateCase(caseId: string | number, reason: string): Promise<KybCaseDetailView> {
  return apiRequest<KybCaseDetailView>(`/api/v1/admin/kyb/cases/${caseId}/escalate`, {
    method: "POST",
    body: { reason }
  });
}

export function exportCase(caseId: string | number): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>(`/api/v1/admin/kyb/cases/${caseId}/export`);
}

export function claimTask(taskId: string | number): Promise<unknown> {
  return apiRequest<unknown>(`/api/v1/admin/kyb/tasks/${taskId}/claim`, {
    method: "POST",
    body: {}
  });
}

export function markTaskViewed(taskId: string | number): Promise<unknown> {
  return apiRequest<unknown>(`/api/v1/admin/kyb/tasks/${taskId}/mark-viewed`, {
    method: "POST",
    body: {}
  });
}

export function assignTask(taskId: string | number, assignedUserId: string, assignedRole: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/v1/admin/kyb/tasks/${taskId}/assign`, {
    method: "POST",
    body: {
      assignedUserId,
      assignedRole
    }
  });
}

export function exportTask(taskId: string | number): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>(`/api/v1/admin/kyb/tasks/${taskId}/export`);
}

export function fetchStaffOptions(): Promise<StaffOption[]> {
  return apiRequest<StaffOption[]>("/system/staff/list");
}
