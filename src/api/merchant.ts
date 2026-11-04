import { apiRequest } from '@/utils/http/request'
import { MerchantSelfStatus } from '@/enums/merchantEnum'
import type { MerchantDocumentType } from '@/enums/merchantEnum'

// ─── Types ───

export interface MerchantRecord {
  id: number
  code: string
  merchantName: string
  email: string
  /** 商户自身状态：PENDING 为入驻申请，其余为已入驻商户（对外状态用 resolveMerchantStatus 计算） */
  status: MerchantSelfStatus | string
  /** 最新一条 KYB Case 的状态：PENDING_SCREENING / DRAFT / SUBMITTED / NEED_SUPPLEMENT / PENDING_FINAL_REVIEW / APPROVED / ADMIN_REJECTED / FINAL_REJECTED / REJECTED / CANCELLED */
  kybStatus?: string | null
  /**
   * 企业聚合状态（后端按「商户状态 + 最新 KYB 状态」计算，与 console 一致）。
   * 前端用 resolveMerchantStatus 复算，两者不一致时以前端为准并告警，见 utils/merchantStatus.ts。
   */
  enterpriseStatus?: string | null
  /** 投资人类别：决定初审问卷展示哪一组字段 */
  investorType?: 'INSTITUTIONAL_INVESTOR' | 'QUALIFIED_INVESTOR' | string | null
  /** 商户来源：PLATFORM（平台创建）/ THIRD_PARTY（三方企业，无需 KYB） */
  source?: 'PLATFORM' | 'THIRD_PARTY' | string | null
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
  /** 需要排除的状态（每个都按 `status != value` 追加；与 status / statusSecondary 同时生效） */
  statusExcludes?: string[]
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

  // 额外排除的状态（如「商户列表」= status != PENDING 且 status != CANCELLED）
  for (const excluded of query.statusExcludes ?? []) {
    if (excluded) {
      queryList.push({ key: 'status', oper: '!=', value: excluded, join: 'and' })
    }
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
  /** 投资人类别：决定初审问卷展示哪一组字段（Institutional / Qualified） */
  investorType?: 'INSTITUTIONAL_INVESTOR' | 'QUALIFIED_INVESTOR' | string | null
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
  /** 公司法定地址（原型 Company Legal Address） */
  companyAddress?: string | null
  website?: string | null
  businessDescription?: string | null
  beneficiaryCount?: number
  pepStatus?: string | null
  annualVolumeUsd?: string | null
  sourceOfFunds?: string | null
  useCase?: string | null
  regulated?: boolean
  regulatoryAction?: boolean
  /** 是否由 BD 团队推荐；true 时展示 bdName / bdEmail */
  bdReferral?: boolean
  bdUserId?: number | null
  bdName?: string | null
  bdEmail?: string | null
  /** 是否是代表企业的授权人 */
  authorisedPerson?: boolean
  /** 是否满足净资产要求（仅 Qualified Investor） */
  netAssetsMet?: boolean
  /** 董事是否具备虚拟资产相关知识（仅 Qualified Investor） */
  directorsVaKnowledge?: boolean
  /** 是否已阅读并同意风险揭示书 */
  riskDisclosureAccepted?: boolean
  riskDisclosureAcceptedAt?: string | null
  /** 是否已阅读并同意隐私政策 */
  privacyPolicyAccepted?: boolean
  privacyPolicyAcceptedAt?: string | null
  screeningStatus?: string | null
  screeningReason?: string | null
  screeningNote?: string | null
  reviewedBy?: number
  reviewedAt?: string | null
  version?: number
  createTime?: string
  updateTime?: string
}

/** 审核操作时间线：节点未发生时后端下发 null */
export interface KybApprovalTimeline {
  /** 初审通过时间 */
  screeningReviewedAt?: string | null
  /** 三方（Sumsub）审核通过时间 */
  providerApprovedAt?: string | null
  /** 终审通过时间 */
  finalReviewedAt?: string | null
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
  dataSource: 'sumsub' | 'local' | string
  companyName: string
  /** 企业主体验证结果：Verified / Rejected / Pending（三方原样返回） */
  companyVerificationStatus: string
  /** 受益人/申报资料同步完成时间 */
  profileSyncedAt?: string | null
  beneficiaries: KybIdentityBeneficiary[]
}

export interface KybIdentityBeneficiary {
  /** 受益人在企业内的 ID（后端未下发时为 null） */
  id?: number | null
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
  /** 企业聚合状态（后端计算）；前端用 resolveMerchantStatus 复算，二者应一致 */
  enterpriseStatus?: string | null
  merchantType?: 'NON_FINANCIAL_CORPORATE' | 'REGULATED_VASP' | 'INTERNAL_SYSTEM' | string | null
  investorType?: 'INSTITUTIONAL_INVESTOR' | 'QUALIFIED_INVESTOR' | string | null
  source?: 'PLATFORM' | 'THIRD_PARTY' | string | null
  email: string
  industryType?: string | null
  kybCaseId?: number
  kybCaseNo?: string | null
  /** 最新一条 KYB Case 状态（审核流程内部状态，不等同于商户对外状态） */
  kybStatus:
    | 'DRAFT'
    | 'PENDING_SCREENING'
    | 'SUBMITTED'
    | 'NEED_SUPPLEMENT'
    | 'PENDING_FINAL_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'ADMIN_REJECTED'
    | 'FINAL_REJECTED'
    | 'CANCELLED'
    | string
  kybStageLabel?: string | null
  appliedAt?: string | null
  /**
   * 审核操作时间（各节点由后端在动作发生时写入，未发生的节点为 null）。
   *   screeningReviewedAt  初审通过时间
   *   providerApprovedAt   三方（Sumsub）审核通过时间
   *   finalReviewedAt      终审通过时间
   */
  approvalTimeline?: KybApprovalTimeline | null
  /** 初审问卷（按 investorType 展示不同字段） */
  questionnaire?: KybQuestionnaire | null
  beneficiaries?: KybBeneficiary[]
  /** Sumsub 身份验证结果；尚未完成 KYB 建档时为 null */
  identityVerification?: KybIdentityVerification | null
  complianceStatus?: ComplianceStatus | null
  /** 初审（资格筛查）拒绝原因 */
  screeningReason?: string | null
  /** 终审拒绝原因（旧字段，后端已改为 rejectReason） */
  finalReviewReason?: string | null
  /** 拒绝原因：后端统一字段，终审拒绝时为终审理由 */
  rejectReason?: string | null
  /** 拒绝时间 */
  rejectedAt?: string | null
  /** 三方审核评论（Sumsub reviewComment）；接口未下发时为 null / undefined */
  reviewComment?: string | null
  /** KYB 验证链接（后端返回，含过期时间） */
  kybSdkLink?: {
    url: string
    externalUserId: string
    issuedAt: string
    expiresAt: string
  } | null
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
 * Admin 预审通过（初审通过 → 进入 KYB）
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
 * Admin 预审拒绝（初审拒绝）
 * 前置: kyb.status = PENDING_SCREENING
 * 后置: kyb.status → ADMIN_REJECTED（商户对外状态 INITIAL_REJECTED / 初审拒绝）
 */
export async function rejectKybScreening(ecode: string, reason?: string): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/kyb/screening/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })
}

/**
 * KYB 终审通过（provider 通过后的最终审批）
 * 前置: kyb.status = PENDING_FINAL_REVIEW
 * 后置: 企业激活并创建金库
 */
export async function approveKybFinalReview(ecode: string): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/kyb/final-approval/approve`, {
    method: 'POST',
    body: {}
  })
}

/**
 * KYB 终审拒绝
 * 前置: kyb.status = PENDING_FINAL_REVIEW
 * 后置: kyb.status → FINAL_REJECTED（商户对外状态 FINAL_REJECTED / 复审拒绝）
 */
export async function rejectKybFinalReview(ecode: string, reason?: string): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/kyb/final-approval/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })
}

// ─── 修改问卷 BD 推荐人信息 ───

/** 修改问卷 BD 推荐人请求体 */
export interface AdminMerchantQuestionnaireBdRequest {
  /** 是否由 BD 团队推荐；false 表示清空推荐人信息 */
  bdReferral: boolean
  /** BD 推荐人后台用户 ID（o_sys_user.id）；bdReferral=true 时必填 */
  bdUserId?: number
}

/**
 * 修改问卷 BD 推荐人信息（仅入驻中可改）
 * POST /merchant/{ecode}/questionnaire/bd-referral
 */
export async function updateQuestionnaireBdReferral(
  ecode: string,
  data: AdminMerchantQuestionnaireBdRequest
): Promise<KybQuestionnaire> {
  return (await apiRequest<KybQuestionnaire>(
    `/merchant/${encodeURIComponent(ecode)}/questionnaire/bd-referral`,
    { method: 'POST', body: data }
  )) as KybQuestionnaire
}

// ─── KYB 受益人同步（POST /merchant/{ecode}/kyb/beneficiaries/refresh）───

/** provider 侧受益人明细（最小 PII 口径） */
export interface KybBeneficiaryProfile {
  beneficiaryId?: string | null
  /** provider 侧 individual applicant ID */
  applicantId?: string | null
  /** ubo / director / shareholder */
  types?: string[]
  shareSize?: number | null
  submitted?: boolean | null
  firstName?: string | null
  lastName?: string | null
  /** GREEN / RED / UNKNOWN */
  reviewAnswer?: string | null
}

export interface KybApplicantProfileResult {
  providerCode?: string | null
  /** 公司 applicant ID */
  applicantId?: string | null
  companyName?: string | null
  registrationNumber?: string | null
  country?: string | null
  beneficiaries?: KybBeneficiaryProfile[] | null
}

// ─── KYB 验证链接（POST /merchant/{ecode}/kyb/sdk-link）───

/** Sumsub WebSDK 直达链接 */
export interface MerchantSdkLinkView {
  /** 前端跳转到此 URL 开始 KYB 认证 */
  url: string
  /** 业务系统用户 ID（商户 ecode） */
  externalUserId: string
}

/**
 * 生成 KYB 验证链接并发送邮件（链接同时返回给运营直接使用）。
 * POST /merchant/{ecode}/kyb/sdk-link
 */
export async function createKybSdkLink(ecode: string): Promise<MerchantSdkLinkView> {
  return (await apiRequest<MerchantSdkLinkView>(
    `/merchant/${encodeURIComponent(ecode)}/kyb/sdk-link`,
    { method: 'POST', body: {} }
  )) as MerchantSdkLinkView
}

/**
 * 手动刷新受益人：强制从 provider（Sumsub）拉取一次并落库。
 * 用于「KYB 步骤状态不更新」时的手动同步。
 * POST /merchant/{ecode}/kyb/beneficiaries/refresh
 */
export async function refreshKybBeneficiaries(ecode: string): Promise<KybApplicantProfileResult> {
  return (await apiRequest<KybApplicantProfileResult>(
    `/merchant/${encodeURIComponent(ecode)}/kyb/beneficiaries/refresh`,
    { method: 'POST', body: {} }
  )) as KybApplicantProfileResult
}

// ─── 企业文档（终审材料：合同 / 订单等）───

/** 企业合同/商务订单文档（GET /merchant/{ecode}/documents） */
export interface MerchantDocumentView {
  id: number
  ecode: string
  /** 文档类型：CONTRACT / MOU / LOI / NDA / ORDER / PO / ANNEX / OTHER */
  docType: MerchantDocumentType | string
  docTypeLabel?: string | null
  title?: string | null
  fileName?: string | null
  /** 绝对访问 URL */
  fileUrl: string
  contentType?: string | null
  fileSize?: number | null
  remark?: string | null
  uploader?: string | null
  uploadedAt?: string | null
}

export interface MerchantDocumentPage {
  records: MerchantDocumentView[]
  total: number
  size: number
  current: number
}

export interface MerchantDocumentCreateInput {
  docType: MerchantDocumentType | string
  /** 标题，可空（留空时后端/前端用文件名兜底展示） */
  title?: string
  /** 通用上传接口返回的绝对 URL */
  fileUrl: string
  /** 上传接口返回的原始文件名 */
  fileName?: string
  remark?: string
}

/**
 * 查询企业文档（分页）
 * GET /merchant/{ecode}/documents?docType=&keyword=&page=&size=
 */
export async function fetchMerchantDocuments(
  ecode: string,
  query: { docType?: string; keyword?: string; page?: number; size?: number } = {}
): Promise<MerchantDocumentPage> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    size: String(query.size ?? 50)
  })
  if (query.docType) params.set('docType', query.docType)
  if (query.keyword) params.set('keyword', query.keyword)
  return (await apiRequest<MerchantDocumentPage>(
    `/merchant/${encodeURIComponent(ecode)}/documents?${params.toString()}`
  )) as MerchantDocumentPage
}

/**
 * 保存企业文档（先调 /file/upload 拿到 fileUrl，再登记）
 * POST /merchant/{ecode}/documents
 */
export async function createMerchantDocument(
  ecode: string,
  input: MerchantDocumentCreateInput
): Promise<MerchantDocumentView> {
  return (await apiRequest<MerchantDocumentView>(
    `/merchant/${encodeURIComponent(ecode)}/documents`,
    { method: 'POST', body: input }
  )) as MerchantDocumentView
}

/**
 * 作废企业文档（软删除，文件与审计记录保留）
 * DELETE /merchant/{ecode}/documents/{id}
 */
export async function deleteMerchantDocument(ecode: string, id: number): Promise<void> {
  await apiRequest(`/merchant/${encodeURIComponent(ecode)}/documents/${id}`, {
    method: 'DELETE'
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

/**
 * 修改问卷业务答案请求体（仅入驻中可改）
 * POST /merchant/{ecode}/questionnaire
 */
export interface AdminMerchantQuestionnaireUpdateRequest {
  investorType?: 'INSTITUTIONAL_INVESTOR' | 'QUALIFIED_INVESTOR'
  legalName?: string
  primaryActivity?: string
  companyAddress?: string
  website?: string
  bdReferral?: boolean
  bdUserId?: number
  authorisedPerson?: boolean
  netAssetsMet?: boolean
  directorsVaKnowledge?: boolean
  riskDisclosureAccepted?: boolean
  privacyPolicyAccepted?: boolean
}

/**
 * 修改问卷业务答案（仅入驻中可改）
 * 整体覆盖最新问卷的业务答案，同步案件最近提交 payload；仅企业状态为 PENDING 时允许。
 */
export async function updateQuestionnaire(
  ecode: string,
  data: AdminMerchantQuestionnaireUpdateRequest
): Promise<KybQuestionnaire> {
  return (await apiRequest<KybQuestionnaire>(
    `/merchant/${encodeURIComponent(ecode)}/questionnaire`,
    { method: 'POST', body: data }
  )) as KybQuestionnaire
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
    statuses: [MerchantSelfStatus.Active, MerchantSelfStatus.Frozen, MerchantSelfStatus.Pending],
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
