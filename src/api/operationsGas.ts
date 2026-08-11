// @ts-nocheck
import { apiRequest } from "@/utils/http/request";
import type {
  GasAccountDetailView,
  GasAccountListView,
  GasConfigurationListView,
  GasConfigurationUpdateResponseView,
  GasConsumptionItemView,
  GasConsumptionResponseView,
  GasHomeActivityListView,
  GasNeedsAttentionResponseView,
  GasOperationsPaginationView,
  GasOperationsFoundationView,
  GasOverviewResponseView,
  GasTopUpItemView,
  GasTopUpResponseView
} from "@/features/ops/gas/types";

export interface GasConsumptionQuery {
  cusAccountId?: number;
  txId?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
  sortDirection?: "asc" | "desc";
}

export interface GasTopUpQuery {
  ecode?: string;
  network?: string;
  coinId?: string;
  address?: string;
  txId?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
  sortDirection?: "asc" | "desc";
}

export interface GasOverviewQuery {
  query?: string;
  ecode?: string;
  merchantName?: string;
  projectId?: number;
  network?: string;
  coinId?: string;
  healthState?: string;
  sourceStatus?: string;
  taskType?: string;
  page?: number;
  pageSize?: number;
  activityPage?: number;
  activityPageSize?: number;
  sortField?: "lookup_relevance" | "health_priority" | "last_consumed_at" | "last_top_up_at";
  sortDirection?: "asc" | "desc";
}

export interface GasConfigurationQuery {
  ecode?: string;
  network?: string;
  coinId?: string;
}

export interface GasConfigurationUpdatePayload {
  gasConfigRef: string;
  threshold: string;
  amountPerTopUp?: string;
  reason: string;
  expectedVersion?: string;
}

function toQueryString<T extends object>(values: T): string {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchGasOperationsFoundation(): Promise<GasOperationsFoundationView> {
  return apiRequest<GasOperationsFoundationView>("/v1/ops/gas/foundation");
}

export function fetchGasOverview(query: GasOverviewQuery = {}): Promise<GasOverviewResponseView> {
  return apiRequest<GasOverviewResponseView>(`/v1/ops/gas/overview${toQueryString(query)}`);
}

export function fetchGasConsumption(query: GasConsumptionQuery = {}): Promise<GasConsumptionResponseView> {
  return apiRequest<GasConsumptionResponseView>(`/v1/ops/gas/consumption${toQueryString(query)}`);
}

export function fetchGasTopUps(query: GasTopUpQuery = {}): Promise<GasTopUpResponseView> {
  return apiRequest<GasTopUpResponseView>(`/v1/ops/gas/top-ups${toQueryString(query)}`);
}

export function fetchGasConfiguration(query: GasConfigurationQuery = {}): Promise<GasConfigurationListView> {
  return apiRequest<GasConfigurationListView>(`/v1/ops/gas/configuration${toQueryString(query)}`);
}

export function updateGasConfiguration(payload: GasConfigurationUpdatePayload): Promise<GasConfigurationUpdateResponseView> {
  return apiRequest<GasConfigurationUpdateResponseView>("/v1/ops/gas/configuration/update", {
    method: "POST",
    body: payload
  });
}

export interface GasRecentActivitiesQuery {
  ecode?: string;
  network?: string;
  page?: number;
  pageSize?: number;
}

export interface GasNeedsAttentionQuery {
  query?: string;
  ecode?: string;
  merchantName?: string;
  projectId?: number;
  network?: string;
  coinId?: string;
  healthState?: string;
  sourceStatus?: string;
  taskType?: string;
  page?: number;
  pageSize?: number;
  activityPage?: number;
  activityPageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface GasAccountsQuery {
  ecode?: string;
  page?: number;
  pageSize?: number;
}

export interface GasAccountDetailParams {
  cusAccountId: number;
}

export function fetchGasRecentActivities(query: GasRecentActivitiesQuery = {}): Promise<GasHomeActivityListView> {
  return apiRequest<GasHomeActivityListView>(`/v1/ops/gas/recent-activities${toQueryString(query)}`);
}

export function fetchGasNeedsAttention(query: GasNeedsAttentionQuery = {}): Promise<GasNeedsAttentionResponseView> {
  return apiRequest<GasNeedsAttentionResponseView>(`/v1/ops/gas/needs-attention${toQueryString(query)}`);
}

export function fetchGasAccounts(query: GasAccountsQuery = {}): Promise<GasAccountListView> {
  return apiRequest<GasAccountListView>(`/v1/ops/gas/accounts${toQueryString(query)}`);
}

export function fetchGasAccountDetail(params: GasAccountDetailParams): Promise<GasAccountDetailView> {
  return apiRequest<GasAccountDetailView>(`/v1/ops/gas/account-detail${toQueryString(params)}`);
}
