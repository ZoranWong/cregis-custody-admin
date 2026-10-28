import { apiRequest } from '@/utils/http/request'
import { MerchantStatus } from '@/enums/merchantEnum'

// ─── Types ───

export interface MerchantRecord {
  id: number
  code: string
  merchantName: string
  email: string
  /** 商户状态：PENDING 为入驻申请，其余为已入驻商户 */
  status: MerchantStatus | string
  /** KYB 阶段：入驻申请列表展示的状态即该字段（PENDING_SCREENING / DRAFT / SUBMITTED / APPROVED / REJECTED ...） */
  kybStatus?: string | null
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
  /** `status` 的比较方式，默认 `=`；传 `!=` 用于「排除某状态」 */
  statusOper?: '=' | '!='
  /** 第二个 status 条件（与 `status` 同时生效，均为 `=`） */
  statusSecondary?: string
  /** 商户名模糊搜索（merchantName like %value%） */
  merchantName?: string
  /**
   * 商户名「非空」条件。默认所有商户列表查询都会带上
   * `merchantName != ''`：接口把 NULL 与 '' 都当空值，传 '' 能同时排除两者
   * （传 null 会被当成去掉该条件，返回 0 条）。
   */
  merchantNameNonNull?: boolean
  /** @deprecated 用 `merchantName`；保留仅为兼容旧的列表 composable */
  keyword?: string
  sort?: 'createTime_desc' | 'updateTime_desc' | 'merchantName_asc'
}

// ─── API Functions ───

/**
 * 获取商户列表
 * POST /merchant/list
 */
export async function fetchMerchantList(query: MerchantQuery = {}): Promise<MerchantListResponse> {
  const sortMap: Record<string, string> = {
    createTime_desc: 'createTime_d',
    updateTime_desc: 'updateTime_d',
    merchantName_asc: 'merchantName_a'
  }

  const body = {
    pageIndex: query.pageNum || 1,
    pageSize: query.pageSize || 10,
    sortFields: query.sort ? sortMap[query.sort] || 'createTime_d' : 'createTime_d',
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
): Array<{ key: string; oper: '=' | '!=' | ':'; value: string; join: 'and' }> {
  const queryList: Array<{ key: string; oper: '=' | '!=' | ':'; value: string; join: 'and' }> = []

  if (query.status) {
    queryList.push({
      key: 'status',
      oper: query.statusOper || '=',
      value: query.status,
      join: 'and'
    })
  }

  // 第二个状态条件（如 status != PENDING 且 status = ACTIVE）
  if (query.statusSecondary) {
    queryList.push({ key: 'status', oper: '=', value: query.statusSecondary, join: 'and' })
  }

  // 商户名「非空」：所有列表查询默认带上，与系统默认条件 merchantName != null 对齐。
  // 必须用空串而不是 null —— 接口把 null 当作去掉该条件，会返回 0 条。
  if (!query.merchantName) {
    queryList.push({ key: 'merchantName', oper: '!=', value: '', join: 'and' })
  }

  // 商户名模糊搜索（两个列表共用）
  const merchantName = (query.merchantName ?? query.keyword ?? '').trim()
  if (merchantName) {
    queryList.push({ key: 'merchantName', oper: ':', value: merchantName, join: 'and' })
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

/** Sumsub 侧的身份验证结果（详情接口 `identityVerification`） */
export interface KybIdentityVerification {
  dataSource: 'sumsub' | string
  companyName: string
  /** 企业主体验证结果：Verified / Pending / ...（三方原样返回） */
  companyVerificationStatus: string
  beneficiaries: KybIdentityBeneficiary[]
}

export interface KybIdentityBeneficiary {
  name: string
  type: 'ubo' | 'director' | 'shareholder' | string
  shareSize?: number | null
  /** 三方审查结论：GREEN / RED / YELLOW */
  reviewAnswer?: string | null
  /** 三方验证状态：Verified / Pending / ... */
  verificationStatus: string
  /** 三方 applicantId；未在 Sumsub 建档时为 null */
  applicantId?: string | null
  verifyTime?: string | null
}

/** 企业合规状态（字段为 null 表示不修改，提交时可用） */
export interface ComplianceStatus {
  onboardingStatus?: 'PENDING' | 'ACTIVE' | 'FROZEN' | 'CANCELLED' | string | null
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string | null
  crsFatcaStatus?:
    | 'DEPOSITORY_INSTITUTION'
    | 'CUSTODIAL_INSTITUTION'
    | 'INVESTMENT_ENTITY'
    | 'ACTIVE_NFE'
    | 'PASSIVE_NFE'
    | string
    | null
  sourceOfWealthStatus?: 'VERIFIED' | 'PENDING' | 'NOT_VERIFIED' | string | null
  sourceOfFundsStatus?: 'VERIFIED' | 'PENDING' | 'NOT_VERIFIED' | string | null
  operatorId?: number
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
  /** Sumsub 身份验证结果；尚未完成 KYB 建档时为 null */
  identityVerification?: KybIdentityVerification | null
  complianceStatus?: ComplianceStatus | null
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
 * 修改企业合规状态
 * POST /merchant/{ecode}/compliance-status
 */
export async function updateComplianceStatus(
  ecode: string,
  data: Partial<ComplianceStatus>
): Promise<ComplianceStatus> {
  return (await apiRequest<ComplianceStatus>(
    `/merchant/${encodeURIComponent(ecode)}/compliance-status`,
    { method: 'POST', body: data }
  )) as ComplianceStatus
}

/**
 * Admin 预审通过
 * 前置: kyb.status = PENDING_SCREENING
 * 后置: kyb.status → DRAFT, 注册 Sumsub applicant
 */
export async function approveKybScreening(ecode: string): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/kyb/screening/approve`, {
    method: 'POST',
    body: {}
  })
}

/**
 * Admin 预审拒绝
 * 前置: kyb.status = PENDING_SCREENING
 * 后置: kyb.status → REJECTED
 */
export async function rejectKybScreening(ecode: string, reason?: string): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/kyb/screening/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })
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

export type MerchantListItemView = MerchantRecord

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
    statuses: [MerchantStatus.Active, MerchantStatus.Frozen, MerchantStatus.Pending],
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

// ─── 企业用户（/merchant/{ecode}/user/page）───

/** 企业用户视图：企业成员关系（cus_merchant_staff）与账号（cus_sys_console_user）聚合 */
export interface AdminMerchantUserVO {
  ecode: string
  userId: number
  /** 企业内角色 */
  role:
    | 'MERCHANT_STAFF'
    | 'MERCHANT_OWNER'
    | 'MERCHANT_ADMIN'
    | 'MERCHANT_FUND_OPERATOR'
    | 'MERCHANT_ANYCALL_OPERATOR'
    | string
  /** 企业内状态 */
  state: 'SUSPENDING' | 'ACTIVE' | 'INACTIVE' | string
  /** 账号状态 */
  userState: 'SUSPENDING' | 'ACTIVE' | 'INACTIVE' | string
  username: string
  email: string
  phone: string | null
  pk: string
  passwordSet: boolean
  joinTime: string
  createTime: string
  loginTime: string | null
}

export interface AdminMerchantUserPage {
  records: AdminMerchantUserVO[]
  total: number
  size: number
  current: number
}

export interface MerchantUserQuery {
  pageIndex?: number
  pageSize?: number
  sortFields?: string
  queryList?: Array<{ key: string; value: unknown; oper?: string; join?: string }>
}

/**
 * 分页查询企业用户
 * POST /merchant/{ecode}/user/page
 */
export async function fetchMerchantUsers(
  ecode: string,
  query: MerchantUserQuery = {}
): Promise<AdminMerchantUserPage> {
  return (await apiRequest<AdminMerchantUserPage>(
    `/merchant/${encodeURIComponent(ecode)}/user/page`,
    { method: 'POST', body: query }
  )) as AdminMerchantUserPage
}
