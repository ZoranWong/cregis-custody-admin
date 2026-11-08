/**
 * 商户状态映射验收用例（需求第 6 节）。
 *
 * 仓库没有引入测试框架（无 vitest/jest），用 tsx 直接跑：
 *   npx tsx src/features/merchant/merchantStatus.acceptance.ts
 *
 * 覆盖：FROZEN 最高优先级、KYB Case 优先于商户自身状态、无 KYB Case 兜底、
 * 三个拒绝状态互不合并、拒绝原因按来源取值。
 */
import {
  MerchantStatus,
  resolveMerchantRejectReason,
  resolveMerchantStatus
} from '@/utils/merchantStatus'

interface Case {
  merchantStatus: string
  latestKybStatus?: string | null
  expected: MerchantStatus
}

/** 需求第 6 节验收表，顺序与原始用例一致 */
const CASES: Case[] = [
  { merchantStatus: 'FROZEN', latestKybStatus: 'APPROVED', expected: MerchantStatus.Frozen },
  {
    merchantStatus: 'FROZEN',
    latestKybStatus: 'ADMIN_REJECTED',
    expected: MerchantStatus.Frozen
  },
  {
    merchantStatus: 'FROZEN',
    latestKybStatus: 'FINAL_REJECTED',
    expected: MerchantStatus.Frozen
  },
  { merchantStatus: 'FROZEN', latestKybStatus: 'REJECTED', expected: MerchantStatus.Frozen },
  { merchantStatus: 'ACTIVE', latestKybStatus: null, expected: MerchantStatus.Active },
  {
    merchantStatus: 'PENDING',
    latestKybStatus: null,
    expected: MerchantStatus.PendingInitialReview
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'PENDING_SCREENING',
    expected: MerchantStatus.PendingInitialReview
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'DRAFT',
    expected: MerchantStatus.KybInProgress
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'SUBMITTED',
    expected: MerchantStatus.KybInProgress
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'NEED_SUPPLEMENT',
    expected: MerchantStatus.KybInProgress
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'PENDING_FINAL_REVIEW',
    expected: MerchantStatus.PendingFinalReview
  },
  { merchantStatus: 'ACTIVE', latestKybStatus: 'APPROVED', expected: MerchantStatus.Active },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'ADMIN_REJECTED',
    expected: MerchantStatus.InitialRejected
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'FINAL_REJECTED',
    expected: MerchantStatus.FinalRejected
  },
  {
    merchantStatus: 'ACTIVE',
    latestKybStatus: 'REJECTED',
    expected: MerchantStatus.KybRejected
  },
  {
    merchantStatus: 'CANCELLED',
    latestKybStatus: 'ADMIN_REJECTED',
    expected: MerchantStatus.InitialRejected
  },
  {
    merchantStatus: 'CANCELLED',
    latestKybStatus: 'FINAL_REJECTED',
    expected: MerchantStatus.FinalRejected
  },
  {
    merchantStatus: 'CANCELLED',
    latestKybStatus: 'REJECTED',
    expected: MerchantStatus.KybRejected
  },
  {
    merchantStatus: 'CANCELLED',
    latestKybStatus: 'CANCELLED',
    expected: MerchantStatus.Cancelled
  }
]

let failed = 0

for (const item of CASES) {
  const actual = resolveMerchantStatus({
    merchantStatus: item.merchantStatus,
    latestKybStatus: item.latestKybStatus
  })
  if (actual !== item.expected) {
    failed += 1
    console.error(
      `FAIL merchant=${item.merchantStatus} kyb=${item.latestKybStatus ?? '无'} → ${actual}，预期 ${item.expected}`
    )
  }
}

/** 三个拒绝状态必须独立保留，不能合并成同一个值 */
const rejectedStatuses = [
  MerchantStatus.InitialRejected,
  MerchantStatus.FinalRejected,
  MerchantStatus.KybRejected
]
if (new Set(rejectedStatuses).size !== 3) {
  failed += 1
  console.error('FAIL 三个拒绝状态出现了重复值')
}

/** 拒绝原因按来源取值：初审 / 终审用 Admin 原因，KYB 用 Sumsub reviewComment */
const reasons = {
  screeningReason: 'screening-reason',
  finalReviewReason: 'final-review-reason',
  reviewComment: 'sumsub-review-comment'
}
const reasonCases: Array<[MerchantStatus, string]> = [
  [MerchantStatus.InitialRejected, reasons.screeningReason],
  [MerchantStatus.FinalRejected, reasons.finalReviewReason],
  [MerchantStatus.KybRejected, reasons.reviewComment]
]
for (const [status, expected] of reasonCases) {
  const actual = resolveMerchantRejectReason(status, reasons)
  if (actual !== expected) {
    failed += 1
    console.error(`FAIL ${status} 拒绝原因 → ${actual}，预期 ${expected}`)
  }
}

/** 未定义组合返回 null，调用方沿用现有逻辑（不擅自映射） */
if (resolveMerchantStatus({ merchantStatus: 'CANCELLED' }) !== null) {
  failed += 1
  console.error('FAIL 无 KYB Case 的 CANCELLED 应返回 null')
}

if (failed > 0) {
  console.error(`\n商户状态验收：${failed} 项失败 / 共 ${CASES.length + 4} 项`)
  process.exit(1)
}

console.log(`商户状态验收通过：${CASES.length + 4} 项全部符合预期`)
