// @ts-nocheck
import { apiRequest } from "@/utils/http/request";
import type {
  MerchantDetailView,
  MerchantFilterOptionsView,
  MerchantListItemView,
  MerchantListSummaryView,
  PageResult
} from "@/types/models";

export interface MerchantQuery {
  pageNum: number;
  pageSize: number;
  view: string;
  status: string;
  merchantType: string;
  watchBucket: string;
  keyword: string;
  sortFields?: string;
}

export function fetchMerchantListSummary(): Promise<MerchantListSummaryView> {
  return apiRequest<MerchantListSummaryView>("/api/v1/admin/merchants/summary");
}

export function fetchMerchantFilterOptions(): Promise<MerchantFilterOptionsView> {
  return apiRequest<MerchantFilterOptionsView>("/api/v1/admin/merchants/filter-options");
}

export function fetchMerchants(query: MerchantQuery): Promise<PageResult<MerchantListItemView>> {
  return apiRequest<PageResult<MerchantListItemView>>("/api/v1/admin/merchants/page", {
    method: "POST",
    body: toPageQuery(query)
  });
}

export function fetchMerchantDetail(merchantId: string | number, returnTo?: string): Promise<MerchantDetailView> {
  const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
  return apiRequest<MerchantDetailView>(`/api/v1/admin/merchants/${merchantId}${query}`);
}

function toPageQuery(query: MerchantQuery) {
  const queryList: Array<{ key: string; oper: ":" | "="; value: string; join: "and" }> = [];
  addEquals(queryList, "view", query.view);
  addEquals(queryList, "status", query.status);
  addEquals(queryList, "merchantType", query.merchantType);
  addEquals(queryList, "watchBucket", query.watchBucket);
  if (query.keyword.trim()) {
    queryList.push({ key: "keyword", oper: ":", value: query.keyword.trim(), join: "and" });
  }
  return {
    pageIndex: query.pageNum,
    pageSize: query.pageSize,
    sortFields: query.sortFields,
    queryList
  };
}

function addEquals(queryList: Array<{ key: string; oper: ":" | "="; value: string; join: "and" }>, key: string, value: string): void {
  if (value) {
    queryList.push({ key, oper: "=", value, join: "and" });
  }
}
