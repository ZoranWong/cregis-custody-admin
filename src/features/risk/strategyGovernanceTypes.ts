// Strategy governance types — from v1
export interface RiskStrategyReviewListRequest {
  reviewStatus?: string; priority?: string; ruleType?: string; page?: number; pageSize?: number;
}

export interface RiskStrategyReviewListResponse {
  items: any[];
  pagination: { page: number; pageSize: number; totalPages: number; totalCount: number };
}