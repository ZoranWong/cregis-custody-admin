// Strategy types — from v1
export interface RiskStrategyRuleListRequest {
  status?: string
  ruleType?: string
  scope?: string
  keyword?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: string
}

export interface RiskStrategyRuleListItem {
  ruleId: string
  ruleName: string
  ruleType: string
  status: string
  scopeSummary: string
  currentVersionRef: string
  riskMappingLevel: string
  updatedBy: string
}

export interface RiskStrategyRuleListResponse {
  items: RiskStrategyRuleListItem[]
  pagination: { page: number; pageSize: number; totalPages: number; totalCount: number }
  filterOptions?: Record<string, string[]>
}

export interface RiskStrategyRuleDetailResponse {
  ruleId: string
  ruleName: string
  status: string
  currentVersion: any
  versionHistory: any[]
  conditions: any[]
  testSummary: any
}
