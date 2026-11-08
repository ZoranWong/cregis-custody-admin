/**
 * 商户相关的接口枚举。
 *
 * 取值必须与后端字段逐字一致（直接作为 queryList 的 value 传给接口，
 * 也对不上时会在列表里显示成原始值 / 筛不出数据）。
 *
 * 注意区分两个层次的状态：
 *   · MerchantSelfStatus —— 商户表自身状态（merchant.status 原值，参与接口查询）；
 *   · MerchantStatus     —— 商户对外统一状态（由 resolveMerchantStatus 计算，不直接查库）。
 */

/** 商户自身状态（merchant.status 原值：PENDING 为入驻申请，其余为已入驻商户） */
export enum MerchantSelfStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Frozen = 'FROZEN',
  Pending = 'PENDING'
}

/** 商户对外状态（共 9 个，见 utils/merchantStatus.ts） */
export enum MerchantStatus {
  PendingInitialReview = 'PENDING_INITIAL_REVIEW',
  KybInProgress = 'KYB_IN_PROGRESS',
  PendingFinalReview = 'PENDING_FINAL_REVIEW',
  Active = 'ACTIVE',
  InitialRejected = 'INITIAL_REJECTED',
  FinalRejected = 'FINAL_REJECTED',
  KybRejected = 'KYB_REJECTED',
  Cancelled = 'CANCELLED',
  Frozen = 'FROZEN'
}

/** KYB Case 状态（合规案件内部状态；merchant.kybStatus） */
export enum KybStatus {
  AdminRejected = 'ADMIN_REJECTED',
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  FinalRejected = 'FINAL_REJECTED',
  NeedSupplement = 'NEED_SUPPLEMENT',
  PendingFinalReview = 'PENDING_FINAL_REVIEW',
  PendingScreening = 'PENDING_SCREENING',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

/** KYB 被拒的三种终态（人工初审拒绝 / 人工终审拒绝 / 三方审核拒绝） */
export const KYB_REJECTED_STATES: string[] = [
  KybStatus.AdminRejected,
  KybStatus.FinalRejected,
  KybStatus.Rejected
]

/** 已入驻后的商户状态（排除 PENDING 入驻申请） */
export const MERCHANT_ONBOARDED_STATES: string[] = [
  MerchantSelfStatus.Active,
  MerchantSelfStatus.Frozen,
  MerchantSelfStatus.Cancelled
]

/**
 * 企业文档类型（/merchant/{ecode}/documents 的 docType）。
 *
 * 与终审（PENDING_FINAL_REVIEW）材料分类一一对应：
 *   CONTRACT → Master Agreement（MSA / 托管协议等主合同）
 *   MOU / LOI → LOI / MoU
 *   NDA → NDA
 *   ORDER / PO → Order / PO
 *   ANNEX → Annex & Addendum
 *   OTHER → Others
 */
export enum MerchantDocumentType {
  Contract = 'CONTRACT',
  Mou = 'MOU',
  Loi = 'LOI',
  Nda = 'NDA',
  Order = 'ORDER',
  Po = 'PO',
  Annex = 'ANNEX',
  Other = 'OTHER'
}
