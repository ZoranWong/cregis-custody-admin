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
  { value: 'tn', labelKey: 'txLens.trueNegative' },
  { value: 'true_negative', labelKey: 'txLens.trueNegative' },
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

/**
 * 色调 → 状态色（打点 / 文字同源，保证两者颜色一致）。
 *
 * 取值全部来自 tailwind.css 的 --tone-* 阶梯，而非 --el-color-*：
 * Element 的 500 级基色是为「实心块 + 白字」设计的，当文字用在白底上实测仅
 * 1.84–3.29:1，不达 WCAG AA；--tone-*-text 在亮/暗两种模式下均 ≥4.5:1。
 * 详见 tailwind.css 中 Status Tone 段的注释。
 */
const TONE_COLORS: Record<Tone, string> = {
  done: 'var(--tone-done-text)',
  progress: 'var(--tone-progress-text)',
  error: 'var(--tone-error-text)',
  info: 'var(--tone-info-text)',
  na: 'var(--el-text-color-placeholder)'
}

/** 标记色（圆点实心部分），≥3:1 非文本对比度 */
const TONE_MARKS: Record<Tone, string> = {
  done: 'var(--tone-done-mark)',
  progress: 'var(--tone-progress-mark)',
  error: 'var(--tone-error-mark)',
  info: 'var(--tone-info-mark)',
  na: 'var(--el-text-color-placeholder)'
}

/** 小圆点外环（浅色） */
const TONE_RINGS: Record<Tone, string> = {
  done: 'var(--tone-done-ring)',
  progress: 'var(--tone-progress-ring)',
  error: 'var(--tone-error-ring)',
  info: 'var(--tone-info-ring)',
  na: 'transparent'
}

/** 大圆（步骤条）外环（更浅） */
const TONE_RINGS_SOFT: Record<Tone, string> = {
  done: 'var(--tone-done-ring-soft)',
  progress: 'var(--tone-progress-ring-soft)',
  error: 'var(--tone-error-ring-soft)',
  info: 'var(--tone-info-ring-soft)',
  na: 'transparent'
}

/**
 * 状态值 → 色调。未登记的取值一律回退 na（灰）。
 * 不回退 progress —— 否则 held / na 这类未登记值会被误染成“进行中”。
 */
/**
 * 时间线节点色调。
 *
 * 时间线记录的是【已经发生】的事件序列，因此节点默认都是「已完成」（done 绿）；
 * 失败态单独保留红色，否则整条线全绿会让「失败」这一关键信息消失。
 *
 * 不能直接用 toneOf(node.status)：后端给时间线节点的 status 一律是 'info'
 * （纯信息），照着渲染会整条线全蓝，与语义不符。
 */
const TIMELINE_ERROR_STATES = new Set(['FAILED', 'REVERTED', 'REJECTED', 'CANCELLED'])

export function timelineNodeTone(node: { label?: string | null; status?: string | null }): Tone {
  const s = (node.label || '').toUpperCase()
  if (TIMELINE_ERROR_STATES.has(s)) return 'error'
  return 'done'
}

export function toneOf(value: string | null | undefined): Tone {
  if (!value) return 'na'
  return TONES[value] || 'na'
}

/**
 * 色调 → 小圆点样式（12px，列表阶段点 / 时间线节点）。
 *
 * na（未执行/不适用）用【空心】而非实心浅灰：
 * 它与 info 同为圆点、仅色相不同，色盲用户与低对比环境下无法分辨。
 * 形状差异（空心 vs 实心）让状态不依赖颜色也能被读出。
 */
export function toneDotStyle(tone: Tone): CSSProperties {
  if (tone === 'na') {
    return {
      background: 'transparent',
      boxSizing: 'border-box',
      border: '1.5px solid var(--el-text-color-placeholder)'
    }
  }
  return {
    background: TONE_MARKS[tone],
    boxShadow: `0 0 0 2px ${TONE_RINGS[tone]}`
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
    background: TONE_MARKS[tone],
    color: '#fff',
    boxShadow: `0 0 0 4px ${TONE_RINGS_SOFT[tone]}`
  }
}

/** 色调 → 文字颜色（与圆点同源，保证两者一致） */
export function toneTextStyle(tone: Tone): CSSProperties {
  return { color: TONE_COLORS[tone] }
}

/** 色调 → 纯色字符串（用于 :style 绑定的非 CSSProperties 场景，如 border-color） */
export function toneColor(tone: Tone): string {
  return TONE_COLORS[tone]
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

/**
 * 复核结果 → el-tag type。
 *
 * 四类结果各占一个色相，不能都塞进 success/warning/danger：
 *   TP 真阳性 正确命中  → success  绿
 *   TN 真阴性 正确排除  → info     中性（正确但非命中，不应与 TP 同色）
 *   FP 假阳性 误报      → warning  琥珀
 *   FN 假阴性 漏判      → 需独立色相（红已被 flagged/rejected 占用），
 *                        故走 tone-purple，见 reviewResultStyle
 */
export function reviewResultTagType(value: string | null | undefined): TagType {
  const v = (value || '').toLowerCase()
  if (v === 'tp' || v === 'true_positive') return 'success'
  if (v === 'tn' || v === 'true_negative') return 'info'
  if (v === 'fp' || v === 'false_positive') return 'warning'
  if (v === 'fn' || v === 'false_negative') return 'danger'
  return 'info'
}

/**
 * 复核结果 → 完整配色（文字色 + 底色）。
 *
 * 与 reviewResultTagType 的差别：FN 在这里用紫色而非 danger 红。
 * 原因：红在合规模块已被 flagged（标记）与 rejected（拒绝）占用，
 * FN 是「漏判」而非「拒绝」，用紫能把它与命中/拒绝区分开——这也是原型的做法。
 * 摘要卡、卡片徽章、详情选择器三处必须共用本函数，否则同一 FN 会出现三种颜色。
 */
export function reviewResultStyle(value: string | null | undefined): {
  color: string
  background: string
} {
  const v = (value || '').toLowerCase()
  switch (v) {
    case 'tp':
    case 'true_positive':
      return { color: 'var(--tone-done-text)', background: 'var(--tone-done-ring-soft)' }
    case 'tn':
    case 'true_negative':
      return { color: 'var(--tone-neutral-text)', background: 'var(--tone-neutral-ring-soft)' }
    case 'fp':
    case 'false_positive':
      return { color: 'var(--tone-progress-text)', background: 'var(--tone-progress-ring-soft)' }
    case 'fn':
    case 'false_negative':
      return { color: 'var(--tone-purple-text)', background: 'var(--tone-purple-ring-soft)' }
    default:
      return { color: 'var(--el-text-color-secondary)', background: 'var(--el-fill-color-light)' }
  }
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
