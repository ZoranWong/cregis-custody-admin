/**
 * 交易状态字典 — 列表页与详情页共用的唯一取值来源
 *
 * 取值定义与后端一致（见 TransactionLensItemView 字段说明）：
 *   compliance    通过 / 标记 / 审查中           clear / flagged / review
 *   travelRule    Travel Rule 状态               complete / pending / mismatch / na
 *   signoff       审批状态                       approved / rejected / pending / na
 *   onchain       链上状态                       broadcasted / confirmed / settled / failed / na
 *   disposition   资金处置（入金）               released / held / forfeited / na
 *   reviewResult  人工复核结果                   tp / fp / fn / none
 *
 * 列表页（阶段圆点）与详情页（步骤条）都从这里取标签与色调，
 * 避免两处各写一份 map 导致取值漂移。
 */
import type { CSSProperties } from 'vue'

export interface TxStateItem {
  /** 后端枚举值 */
  value: string
  /** i18n 键 */
  labelKey: string
}

/** el-tag type 取值 */
export type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const NA_ITEM: TxStateItem = { value: 'na', labelKey: 'txLens.trNa' }

/** 合规状态 */
export const COMPLIANCE_DICT: TxStateItem[] = [
  { value: 'clear', labelKey: 'txLens.clear' },
  { value: 'flagged', labelKey: 'txLens.flagged' },
  { value: 'review', labelKey: 'txLens.inReview' }
]

/** Travel Rule 状态 */
export const TRAVEL_RULE_DICT: TxStateItem[] = [
  { value: 'complete', labelKey: 'txLens.trComplete' },
  { value: 'pending', labelKey: 'txLens.trPending' },
  { value: 'mismatch', labelKey: 'txLens.trMismatch' },
  NA_ITEM
]

/** 审批（Sign-off）状态 */
export const SIGNOFF_DICT: TxStateItem[] = [
  { value: 'approved', labelKey: 'txLens.soApproved' },
  { value: 'rejected', labelKey: 'txLens.soRejected' },
  { value: 'pending', labelKey: 'txLens.soPending' },
  NA_ITEM
]

/** 链上状态 */
export const ONCHAIN_DICT: TxStateItem[] = [
  { value: 'broadcasted', labelKey: 'txLens.broadcasted' },
  { value: 'confirmed', labelKey: 'txLens.confirmed' },
  { value: 'settled', labelKey: 'txLens.settled' },
  { value: 'failed', labelKey: 'txLens.failed' },
  NA_ITEM
]

/** 资金处置状态（入金） */
export const DISPOSITION_DICT: TxStateItem[] = [
  { value: 'released', labelKey: 'txLens.fdReleased' },
  { value: 'held', labelKey: 'txLens.fdHeld' },
  { value: 'forfeited', labelKey: 'txLens.fdForfeited' },
  NA_ITEM
]

/** 人工复核结果（同时兼容 tp 与 true_positive 两种写法） */
export const REVIEW_RESULT_DICT: TxStateItem[] = [
  { value: 'none', labelKey: 'txLens.rrNone' },
  { value: 'tp', labelKey: 'txLens.truePositive' },
  { value: 'true_positive', labelKey: 'txLens.truePositive' },
  { value: 'fp', labelKey: 'txLens.falsePositive' },
  { value: 'false_positive', labelKey: 'txLens.falsePositive' },
  { value: 'fn', labelKey: 'txLens.falseNegative' },
  { value: 'false_negative', labelKey: 'txLens.falseNegative' }
]

/** 合规结论（交易详情/ 告警详情接口实测取值） */
export const CONCLUSION_DICT: TxStateItem[] = [
  { value: 'PASS', labelKey: 'alerts.conclusionPass' },
  { value: 'HOLD', labelKey: 'alerts.conclusionHold' },
  { value: 'BLOCK', labelKey: 'alerts.conclusionBlock' },
  { value: 'MANUAL_REVIEW', labelKey: 'alerts.manualReview' }
]

/** 业务决策（/compliance/alerts 接口实测取值：PASS / HOLD / BLOCK） */
export const DECISION_DICT: TxStateItem[] = [
  { value: 'PASS', labelKey: 'alerts.decisionPass' },
  { value: 'HOLD', labelKey: 'alerts.decisionHold' },
  { value: 'BLOCK', labelKey: 'alerts.decisionBlock' }
]

/**
 * 处置状态（/compliance/alerts 接口实测取值）。
 * 后端定义：CLEAR / PENDING / DECLINED / BLOCKED
 * 与台账时间线的事件类型（APPROVE / REJECT / RELEASE）不是同一套枚举，勿混用。
 */
export const DISPOSITION_STATUS_DICT: TxStateItem[] = [
  { value: 'PENDING', labelKey: 'alerts.dispositionPending' },
  { value: 'CLEAR', labelKey: 'alerts.dispositionCleared' },
  { value: 'DECLINED', labelKey: 'alerts.dispositionDeclined' },
  { value: 'BLOCKED', labelKey: 'alerts.dispositionBlocked' }
]

/**
 * 复核结果（告警列表 / 交易详情接口实测取值）。
 * 与列表页 reviewResult 的小写缩写（tp / fp / fn / none）不是同一套枚举。
 */
export const REVIEW_OUTCOME_DICT: TxStateItem[] = [
  { value: 'NONE', labelKey: 'alerts.rrNone' },
  { value: 'TRUE_POSITIVE', labelKey: 'alerts.rrTruePositive' },
  { value: 'TRUE_NEGATIVE', labelKey: 'alerts.rrTrueNegative' },
  { value: 'FALSE_POSITIVE', labelKey: 'alerts.rrFalsePositive' },
  { value: 'FALSE_NEGATIVE', labelKey: 'alerts.rrFalseNegative' }
]

/**
 * Travel Rule 通知状态（/compliance/notifications 接口实测取值）。
 * 与 tx-lens 阶段字段的 TRAVEL_RULE_DICT（complete / pending / mismatch）不是同一套枚举。
 */
export const NOTIFICATION_STATUS_DICT: TxStateItem[] = [
  { value: 'CREATED', labelKey: 'travelRule.stCreated' },
  { value: 'PII_APPENDED', labelKey: 'travelRule.stPiiAppended' },
  { value: 'UNMATCHED', labelKey: 'travelRule.stUnmatched' },
  { value: 'AUTHORIZED', labelKey: 'travelRule.stAuthorized' },
  { value: 'ACCEPTED', labelKey: 'travelRule.stAccepted' },
  { value: 'REJECTED', labelKey: 'travelRule.stRejected' },
  { value: 'SETTLING', labelKey: 'travelRule.stSettling' },
  { value: 'SETTLED', labelKey: 'travelRule.stSettled' },
  { value: 'REVERTED', labelKey: 'travelRule.stReverted' }
]

/** 处置时间线事件类型（RiskDispositionEventView.eventType） */
export const ALERT_EVENT_DICT: TxStateItem[] = [
  { value: 'HOLD', labelKey: 'alerts.evtHold' },
  { value: 'AUTO_ESCALATED', labelKey: 'alerts.evtAutoEscalated' },
  { value: 'MANUAL_REVIEW', labelKey: 'alerts.evtManualReview' },
  { value: 'APPROVE', labelKey: 'alerts.evtApprove' },
  { value: 'REJECT', labelKey: 'alerts.evtReject' },
  { value: 'RELEASE', labelKey: 'alerts.evtRelease' }
]

/**
 * 状态色调 — 列表阶段圆点 / 详情步骤条 / 各 tab 时间线共用。
 *
 * 后端在三个位置用三套命名空间表达同一组语义：
 *   - 阶段字段   clear / review / settled / held / na …            （小写业务值）
 *   - 时间线节点 info / completed / failed / pending               （TabTimelineNodeView.status）
 * 这里合并成一张表，调用方不必关心来源。
 */
export type Tone = 'done' | 'progress' | 'error' | 'info' | 'na'

const TONES: Record<string, Tone> = {
  // 终态 · 正常
  clear: 'done',
  complete: 'done',
  approved: 'done',
  settled: 'done',
  confirmed: 'done',
  released: 'done',
  completed: 'done',
  success: 'done',
  SETTLED: 'done',
  ACCEPTED: 'done',
  AUTHORIZED: 'done',
  // 进行中
  review: 'progress',
  pending: 'progress',
  broadcasted: 'progress',
  held: 'progress',
  CREATED: 'progress',
  PII_APPENDED: 'progress',
  UNMATCHED: 'progress',
  SETTLING: 'progress',
  // 终态 · 异常
  flagged: 'error',
  mismatch: 'error',
  rejected: 'error',
  failed: 'error',
  forfeited: 'error',
  error: 'error',
  REJECTED: 'error',
  REVERTED: 'error',
  // 纯信息（时间线节点专用）
  info: 'info',
  // 未执行 / 不适用
  na: 'na'
}

/** 色调 → 主色。圆点与文字都取自这里，保证两者颜色一致 */
const TONE_COLORS: Record<Tone, string> = {
  done: 'var(--el-color-success)',
  progress: 'var(--el-color-warning)',
  error: 'var(--el-color-danger)',
  info: 'var(--el-color-primary)',
  na: 'var(--el-text-color-placeholder)'
}

/** 小圆点外环（浅色） */
const TONE_RINGS: Record<Tone, string> = {
  done: 'var(--el-color-success-light-5)',
  progress: 'var(--el-color-warning-light-5)',
  error: 'var(--el-color-danger-light-5)',
  info: 'var(--el-color-primary-light-5)',
  na: 'transparent'
}

/** 大圆（步骤条）外环（更浅） */
const TONE_RINGS_SOFT: Record<Tone, string> = {
  done: 'var(--el-color-success-light-8)',
  progress: 'var(--el-color-warning-light-8)',
  error: 'var(--el-color-danger-light-8)',
  info: 'var(--el-color-primary-light-8)',
  na: 'transparent'
}

/**
 * 状态值 → 色调。未登记的取值一律回退 na（灰）。
 * 不回退 progress —— 否则 held / na 这类未登记值会被误染成“进行中”。
 */
export function toneOf(value: string | null | undefined): Tone {
  if (!value) return 'na'
  return TONES[value] || 'na'
}

/** 色调 → 小圆点样式（12px，列表阶段点 / 时间线节点） */
export function toneDotStyle(tone: Tone): CSSProperties {
  return {
    background: TONE_COLORS[tone],
    boxShadow: tone === 'na' ? 'none' : `0 0 0 2px ${TONE_RINGS[tone]}`
  }
}

/** 色调 → 大圆样式（36px，详情步骤条） */
export function toneCircleStyle(tone: Tone): CSSProperties {
  if (tone === 'na') {
    return {
      background: 'var(--el-fill-color-dark)',
      color: 'var(--el-text-color-placeholder)'
    }
  }
  return {
    background: TONE_COLORS[tone],
    color: '#fff',
    boxShadow: `0 0 0 4px ${TONE_RINGS_SOFT[tone]}`
  }
}

/** 色调 → 文字颜色（与圆点同源，保证两者一致） */
export function toneTextStyle(tone: Tone): CSSProperties {
  return { color: TONE_COLORS[tone] }
}

export type Translate = (key: string) => string

/** 状态值 → 标签；未知取值原样返回 */
export function txStateLabel(
  dict: TxStateItem[],
  value: string | null | undefined,
  t: Translate
): string {
  if (!value) return '--'
  const key = dict.find((d) => d.value === value)?.labelKey
  return key ? t(key) : value
}

/** 人工复核结果 → el-tag type */
export function reviewResultTagType(value: string | null | undefined): TagType {
  const v = (value || '').toLowerCase()
  if (v === 'tp' || v === 'true_positive') return 'success'
  if (v === 'fp' || v === 'false_positive') return 'warning'
  if (v === 'fn' || v === 'false_negative') return 'danger'
  return 'info'
}

/** 链上状态 → el-tag type（详情页头卡） */
export function onchainTagType(value: string | null | undefined): TagType {
  if (value === 'settled' || value === 'confirmed') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'broadcasted') return 'warning'
  return 'info'
}

/** 业务决策 → el-tag type */
export function decisionTagType(value: string | null | undefined): TagType {
  if (value === 'BLOCK') return 'danger'
  if (value === 'HOLD') return 'warning'
  if (value === 'PASS') return 'success'
  return 'info'
}

/** 处置状态 → el-tag type */
/**
 * 处置状态 → el-tag type（对齐原型 badge 配色）
 *   PENDING  待审核  warning（原型 status-pending）
 *   CLEAR    已通过  success（原型 status-approved）
 *   DECLINED 已拒绝  danger（原型 status-rejected）
 *   BLOCKED  已阻断  danger（同为终态拒绝，原型未单列）
 */
export function dispositionTagType(value: string | null | undefined): TagType {
  if (value === 'CLEAR') return 'success'
  if (value === 'PENDING') return 'warning'
  if (value === 'DECLINED' || value === 'BLOCKED') return 'danger'
  return 'info'
}

/** Travel Rule 通知状态 → el-tag type（与 TONES 同口径） */
export function notificationTagType(value: string | null | undefined): TagType {
  switch (toneOf(value)) {
    case 'done':
      return 'success'
    case 'progress':
      return 'warning'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

/**
 * 风险分 → el-tag type。
 * 阈值按椭圆曲线风险分口径（0-10）划分，与规则列表的 CRITICAL/MEDIUM 阈值保持同序。
 */
export function riskScoreTagType(value: number | null | undefined): TagType {
  if (value == null) return 'info'
  if (value >= 7) return 'danger'
  if (value >= 4) return 'warning'
  return 'success'
}

/** 风险分 → i18n 标签键；0 表示未评分，不展示。 */
export function riskScoreLabelKey(value: number | null | undefined): string | null {
  if (value == null || value === 0) return null
  if (value >= 7) return 'alerts.riskHigh'
  if (value >= 4) return 'alerts.riskMedium'
  return 'alerts.riskLow'
}
