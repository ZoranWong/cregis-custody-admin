import { apiRequest } from '@/utils/http/request'

// ─── Types ───

export interface MerchantRecord {
  id: number
  code: string
  merchantName: string
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string
  createTime: string
  updateTime: string
  creatorId: number
  // Optional fields
  dateOfIncorporation?: string | null
  dbaName?: string | null
  entityType?: string | null
  jurisdiction?: string | null
  registrationNumber?: string | null
  sumsubApplicantId?: string | null
  taxId?: string | null
}

export interface MerchantListResponse {
  current: number
  pages: number
  size: number
  total: number
  records: MerchantRecord[]
}

export interface MerchantQuery {
  pageNum?: number
  pageSize?: number
  status?: string
  keyword?: string
}

// ─── API Functions ───

/**
 * 获取商户列表
 * POST /merchant/list
 */
export async function fetchMerchantList(query: MerchantQuery = {}): Promise<MerchantListResponse> {
  const body = {
    pageIndex: query.pageNum || 1,
    pageSize: query.pageSize || 10,
    queryList: buildQueryList(query)
  }

  return (await apiRequest<MerchantListResponse>('/merchant/list', {
    method: 'POST',
    body
  })) as MerchantListResponse
}

/**
 * 获取商户详情
 * GET /merchant/{id}
 */
export async function fetchMerchantDetail(merchantId: number | string): Promise<MerchantRecord> {
  return (await apiRequest<MerchantRecord>(`/merchant/${merchantId}`)) as MerchantRecord
}

// ─── Helper Functions ───

function buildQueryList(
  query: MerchantQuery
): Array<{ key: string; oper: '=' | ':'; value: string; join: 'and' }> {
  const queryList: Array<{ key: string; oper: '=' | ':'; value: string; join: 'and' }> = []

  if (query.status) {
    queryList.push({ key: 'status', oper: '=', value: query.status, join: 'and' })
  }

  if (query.keyword?.trim()) {
    queryList.push({ key: 'keyword', oper: ':', value: query.keyword.trim(), join: 'and' })
  }

  return queryList
}

// ─── KYB Detail Types (POST /merchant/detail/{ecode}) ───

export interface KybQuestionnaire {
  id: number
  caseId: number
  ecode: string
  legalName: string
  dbaName?: string | null
  jurisdiction?: string | null
  countryCode?: string | null
  dateOfIncorporation?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  entityType?: string | null
  publiclyTraded?: boolean
  employeeCount?: string | null
  primaryActivity?: string | null
  website?: string | null
  businessDescription?: string | null
  beneficiaryCount?: number
  pepStatus?: string | null
  annualVolumeUsd?: string | null
  sourceOfFunds?: string | null
  useCase?: string | null
  regulated?: boolean
  regulatoryAction?: boolean
  screeningStatus?: string | null
  screeningReason?: string | null
  screeningNote?: string | null
  reviewedBy?: number
  reviewedAt?: string | null
  version?: number
  createTime?: string
  updateTime?: string
}

export interface KybBeneficiary {
  id: number
  caseId: number
  questionnaireId: number
  ecode: string
  name: string
  type: 'ubo' | 'director' | 'shareholder' | string
  shareSize?: number | null
  country?: string | null
  dateOfBirth?: string | null
  email?: string | null
  phone?: string | null
  applicantId?: string | null
  status: 'PENDING' | 'LINKED' | 'KYC_PASSED' | string
  createTime?: string
  updateTime?: string
}

export interface AdminMerchantKybDetailView {
  merchantId: number
  ecode: string
  merchantName: string
  merchantStatus: 'PENDING' | 'ACTIVE' | 'FROZEN' | 'CANCELLED' | string
  merchantType: 'NON_FINANCIAL_CORPORATE' | 'REGULATED_VASP' | 'INTERNAL_SYSTEM' | string
  email: string
  industryType?: string | null
  kybCaseId?: number
  kybCaseNo?: string | null
  kybStatus:
    | 'DRAFT'
    | 'PENDING_SCREENING'
    | 'SUBMITTED'
    | 'NEED_SUPPLEMENT'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | string
  kybStageLabel?: string | null
  appliedAt?: string | null
  questionnaire?: KybQuestionnaire | null
  beneficiaries?: KybBeneficiary[]
}

/**
 * 获取商户详情（含 KYB 问卷）
 * POST /merchant/detail/{ecode}
 */
export async function fetchMerchantKybDetail(ecode: string): Promise<AdminMerchantKybDetailView> {
  return (await apiRequest<AdminMerchantKybDetailView>(
    `/merchant/detail/${encodeURIComponent(ecode)}`,
    { method: 'POST', body: {} }
  )) as AdminMerchantKybDetailView
}

/**
 * 获取商户名称列表（用于下拉选择）
 */
export async function fetchMerchantOptions(): Promise<Array<{ label: string; value: string }>> {
  try {
    const response = await fetchMerchantList({ pageSize: 200 })
    return response.records.map((m) => ({
      label: m.merchantName,
      value: m.merchantName
    }))
  } catch {
    return []
  }
}

// ─── Legacy API Functions (for backward compatibility) ───

export interface MerchantListSummaryView {
  totalMerchants: number
  activeMerchants: number
  pendingMerchants: number
  inactiveMerchants: number
}

export interface MerchantFilterOptionsView {
  statuses: string[]
  merchantTypes: string[]
  watchBuckets: string[]
}

export interface MerchantListItemView extends MerchantRecord {
  // Extend with any additional view-specific fields
}

export interface PageResult<T> {
  records: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

/**
 * Legacy: 获取商户列表摘要
 * Note: This is now computed from the list response
 */
export async function fetchMerchantListSummary(): Promise<MerchantListSummaryView> {
  try {
    const response = await fetchMerchantList({ pageSize: 1 })
    const total = response.total || 0
    // Simplified - in real implementation, these would come from backend
    return {
      totalMerchants: total,
      activeMerchants: total,
      pendingMerchants: 0,
      inactiveMerchants: 0
    }
  } catch {
    return {
      totalMerchants: 0,
      activeMerchants: 0,
      pendingMerchants: 0,
      inactiveMerchants: 0
    }
  }
}

/**
 * Legacy: 获取商户筛选选项
 */
export async function fetchMerchantFilterOptions(): Promise<MerchantFilterOptionsView> {
  // Return default options - in real implementation, these would come from backend
  return {
    statuses: ['ACTIVE', 'INACTIVE', 'PENDING'],
    merchantTypes: [],
    watchBuckets: []
  }
}

/**
 * Legacy: 获取商户列表（分页）
 */
export async function fetchMerchants(
  query: MerchantQuery
): Promise<PageResult<MerchantListItemView>> {
  const response = await fetchMerchantList(query)
  return {
    records: response.records,
    pagination: {
      page: response.current,
      pageSize: response.size,
      totalPages: response.pages,
      totalCount: response.total
    }
  }
}
