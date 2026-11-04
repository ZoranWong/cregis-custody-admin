/**
 * 商户对外状态（Merchant Status）统一映射。
 *
 * 系统里有两个层次的状态，**必须分开**：
 *   · KYB Case Status —— 审核流程走到哪一步（PENDING_SCREENING / SUBMITTED / REJECTED ...），
 *     属于合规案件内部字段（merchant.kybStatus）；
 *   · Merchant Status —— 商户对外展示的业务状态（待初审 / KYB中 / 初审拒绝 ...）。
 *
 * 两者不共用枚举。尤其是三个拒绝状态（初审 / 复审 / KYB审核），
 * 保留拒绝来源才能在「审核记录、拒绝原因展示、重新申请」里区分清楚 ——
 * KYB Case 的 REJECTED 只表示「三方审核 RED」，绝不能与商户侧的 REJECTED 混用。
 *
 * 计算优先级（见 resolveMerchantStatus）：
 *   1. 商户自身 FROZEN → 一律 FROZEN
 *   2. 存在最新 KYB Case → 由 KYB Case 状态映射（优先于商户自身状态）
 *   3. 无 KYB Case → 按商户自身状态兜底
 *
 * 枚举定义在 enums/merchantEnum.ts（与 MerchantSelfStatus / KybStatus 并列），
 * 本模块只负责映射关系与计算，保持「枚举定义唯一、映射逻辑唯一」。
 */
import { KybStatus, MerchantSelfStatus, MerchantStatus } from '@/enums/merchantEnum'

export { MerchantStatus }

/** 商户状态展示文案的 i18n key（en/zh 两份字典同 key） */
export const MERCHANT_STATUS_LABEL_KEYS: Record<MerchantStatus, string> = {
  [MerchantStatus.PendingInitialReview]: 'merchantStatus.pendingInitialReview',
  [MerchantStatus.KybInProgress]: 'merchantStatus.kybInProgress',
  [MerchantStatus.PendingFinalReview]: 'merchantStatus.pendingFinalReview',
  [MerchantStatus.Active]: 'merchantStatus.active',
  [MerchantStatus.InitialRejected]: 'merchantStatus.initialRejected',
  [MerchantStatus.FinalRejected]: 'merchantStatus.finalRejected',
  [MerchantStatus.KybRejected]: 'merchantStatus.kybRejected',
  [MerchantStatus.Cancelled]: 'merchantStatus.cancelled',
  [MerchantStatus.Frozen]: 'merchantStatus.frozen'
}

/** 商户状态 → ArtStatusTag 语义色 */
export const MERCHANT_STATUS_TONE: Record<
  MerchantStatus,
  'success' | 'warning' | 'danger' | 'info'
> = {
  [MerchantStatus.PendingInitialReview]: 'warning',
  [MerchantStatus.KybInProgress]: 'info',
  [MerchantStatus.PendingFinalReview]: 'info',
  [MerchantStatus.Active]: 'success',
  [MerchantStatus.InitialRejected]: 'danger',
  [MerchantStatus.FinalRejected]: 'danger',
  [MerchantStatus.KybRejected]: 'danger',
  [MerchantStatus.Cancelled]: 'info',
  [MerchantStatus.Frozen]: 'warning'
}

/**
 * KYB Case 状态 → 商户对外状态（集中映射，唯一来源）。
 *
 * 注意：REJECTED 是 KYB Case 内部状态（三方审核 RED），映射为商户侧的 KYB_REJECTED；
 * ADMIN_REJECTED = 初审拒绝，FINAL_REJECTED = 复审拒绝，三者互不合并。
 */
export const KYB_CASE_TO_MERCHANT_STATUS: Record<KybStatus, MerchantStatus> = {
  // 草稿 / 已提交 / 待补件：都在客户填写与补件阶段
  [KybStatus.Draft]: MerchantStatus.KybInProgress,
  [KybStatus.Submitted]: MerchantStatus.KybInProgress,
  [KybStatus.NeedSupplement]: MerchantStatus.KybInProgress,
  // 等待 Admin 资格筛查 / 等待 Admin 终审
  [KybStatus.PendingScreening]: MerchantStatus.PendingInitialReview,
  [KybStatus.PendingFinalReview]: MerchantStatus.PendingFinalReview,
  // 通过 / 三方通过但 Admin 终审拒绝
  [KybStatus.Approved]: MerchantStatus.Active,
  [KybStatus.FinalRejected]: MerchantStatus.FinalRejected,
  // 初审拒绝 / KYB 三方审核拒绝
  [KybStatus.AdminRejected]: MerchantStatus.InitialRejected,
  [KybStatus.Rejected]: MerchantStatus.KybRejected,
  [KybStatus.Cancelled]: MerchantStatus.Cancelled
}

/**
 * 无 KYB Case 时，按商户自身状态兜底。
 *
 * 只映射已定义的三种（ACTIVE / PENDING / FROZEN）；其余状态（如 CANCELLED）
 * 沿用现有业务逻辑，不在本模块擅自改写 —— 返回 null 由调用方决定如何展示。
 */
export const MERCHANT_SELF_TO_MERCHANT_STATUS: Partial<Record<MerchantSelfStatus, MerchantStatus>> =
  {
    [MerchantSelfStatus.Active]: MerchantStatus.Active,
    [MerchantSelfStatus.Pending]: MerchantStatus.PendingInitialReview,
    [MerchantSelfStatus.Frozen]: MerchantStatus.Frozen
  }

export interface ResolveMerchantStatusInput {
  /** 商户自身状态（merchant.status） */
  merchantStatus?: string | null
  /** 最新一条 KYB Case 的状态（kybStatus）；null / undefined 表示没有 KYB Case */
  latestKybStatus?: string | null
}

function normalize(value?: string | null): string {
  return (value || '').trim().toUpperCase()
}

/**
 * 计算商户对外状态。
 *
 * 返回 null 表示「无 KYB Case 且商户自身状态未定义」（例如 CANCELLED 但没有任何 KYB 记录），
 * 调用方应沿用现有展示逻辑，不要自行猜测。
 */
export function resolveMerchantStatus(
  input: ResolveMerchantStatusInput | null | undefined
): MerchantStatus | null {
  const merchantStatus = normalize(input?.merchantStatus)
  const kybStatus = normalize(input?.latestKybStatus)

  // 优先级 1：商户自身冻结，永远最高
  if (merchantStatus === MerchantSelfStatus.Frozen) return MerchantStatus.Frozen

  // 优先级 2：存在 KYB Case，KYB 结果优先于商户自身状态
  //（商户自身 CANCELLED 也不能覆盖 KYB 的初审 / 复审 / KYB 拒绝结果）
  if (kybStatus) {
    return (KYB_CASE_TO_MERCHANT_STATUS as Record<string, MerchantStatus>)[kybStatus] ?? null
  }

  // 优先级 3：无 KYB Case，按商户自身状态兜底
  return (
    (MERCHANT_SELF_TO_MERCHANT_STATUS as Record<string, MerchantStatus>)[merchantStatus] ?? null
  )
}

/** 后端下发的 enterpriseStatus 是否为合法取值（用于与前端复算结果比对） */
export function isKnownMerchantStatus(value?: string | null): value is MerchantStatus {
  const v = normalize(value)
  return Object.prototype.hasOwnProperty.call(MERCHANT_STATUS_LABEL_KEYS, v)
}

/**
 * 取商户对外状态：优先用前端按规则复算的结果（规则只在一处维护），
 * 复算未覆盖（如无 KYB 的 CANCELLED）而接口已下发 enterpriseStatus 时用接口值兜底。
 *
 * 两个来源不一致会打一条警告，方便发现前后端规则漂移。
 */
export function merchantStatusOf(input: {
  merchantStatus?: string | null
  latestKybStatus?: string | null
  /** 后端下发的 enterpriseStatus */
  apiStatus?: string | null
  /** 用于告警定位的商户编码 */
  ecode?: string | null
}): MerchantStatus | null {
  const resolved = resolveMerchantStatus(input)
  const apiStatus = normalize(input.apiStatus)
  const api = isKnownMerchantStatus(apiStatus) ? (apiStatus as MerchantStatus) : null

  if (resolved && api && resolved !== api) {
    console.warn(
      `[merchantStatus] ${input.ecode || ''} 前端复算 ${resolved} 与接口 enterpriseStatus ${api} 不一致`
    )
  }
  return resolved ?? api
}

/** 对外状态是否已定案（拒绝 / 取消），用于「重新申请」等后续流程判断 */
export function isMerchantRejected(status: MerchantStatus | null): boolean {
  return (
    status === MerchantStatus.InitialRejected ||
    status === MerchantStatus.FinalRejected ||
    status === MerchantStatus.KybRejected
  )
}

/** 拒绝来源：Admin 初审 / Admin 终审 / 三方审核 */
export type MerchantRejectSource = 'INITIAL' | 'FINAL' | 'KYB'

export function merchantRejectSource(status: MerchantStatus | null): MerchantRejectSource | null {
  if (status === MerchantStatus.InitialRejected) return 'INITIAL'
  if (status === MerchantStatus.FinalRejected) return 'FINAL'
  if (status === MerchantStatus.KybRejected) return 'KYB'
  return null
}

/**
 * 拒绝原因 —— 必须与拒绝来源一一对应，不能混用：
 *   INITIAL_REJECTED → Admin 资格筛查拒绝原因（KYB 问卷 screeningReason）
 *   FINAL_REJECTED   → Admin 终审拒绝原因（KYB Case finalReviewReason）
 *   KYB_REJECTED     → Sumsub 审核结论评论（reviewComment，RED 结论）
 *
 * 当前后端尚未下发 reviewComment（openapi 中没有该字段），
 * 这里保留取参位置：接口补齐后直接透传，不需要改调用方。
 */
export interface MerchantRejectReasonInput {
  /** 初审（资格筛查）拒绝原因 */
  screeningReason?: string | null
  /** 终审拒绝原因（后端 rejectReason 优先，兼容旧字段 finalReviewReason） */
  finalReviewReason?: string | null
  /** Sumsub 三方审核评论 */
  reviewComment?: string | null
}

export function resolveMerchantRejectReason(
  status: MerchantStatus | null,
  reasons: MerchantRejectReasonInput
): string {
  switch (merchantRejectSource(status)) {
    case 'INITIAL':
      return reasons.screeningReason || ''
    case 'FINAL':
      return reasons.finalReviewReason || ''
    case 'KYB':
      return reasons.reviewComment || ''
    default:
      return ''
  }
}
