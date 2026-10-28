/**
 * 商户相关的接口枚举。
 *
 * 取值必须与后端字段逐字一致（直接作为 queryList 的 value 传给接口，
 * 也对不上时会在列表里显示成原始值 / 筛不出数据）。
 */

/** 商户状态（merchant.status） */
export enum MerchantStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Frozen = 'FROZEN',
  Pending = 'PENDING'
}

/** KYB 状态（来自合规案件，非商户表字段；merchant.kybStatus） */
export enum KybStatus {
  AdminRejected = 'ADMIN_REJECTED',
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  NeedSupplement = 'NEED_SUPPLEMENT',
  PendingScreening = 'PENDING_SCREENING',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

/** KYB 被拒的两种终态（人工预审拒绝 / 三方审核拒绝） */
export const KYB_REJECTED_STATES: string[] = [KybStatus.AdminRejected, KybStatus.Rejected]

/** 已入驻后的商户状态（排除 PENDING 入驻申请） */
export const MERCHANT_ONBOARDED_STATES: string[] = [
  MerchantStatus.Active,
  MerchantStatus.Frozen,
  MerchantStatus.Cancelled
]
