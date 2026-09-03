/**
 * 合规规则字典 — 决策/范围/严重级别/状态的 key-value 定义
 *
 * value 为后端枚举值（稳定 key），i18n 按 dictKey 配置翻译。
 * 后台接口接入后，只需保证 value 与后端枚举一致即可。
 */

export interface DictItem {
  /** 后端枚举值（稳定 key） */
  value: string
  /** i18n 键 */
  labelKey: string
}

/** 决策类型 */
export const DECISION_DICT: DictItem[] = [
  { value: 'AUTO_REJECT', labelKey: 'rules.decisions.autoReject' },
  { value: 'SUBMIT_REVIEW', labelKey: 'rules.decisions.submitReview' },
  { value: 'HOLD', labelKey: 'rules.decisions.hold' }
]

/** 范围 */
export const SCOPE_DICT: DictItem[] = [
  { value: 'GLOBAL', labelKey: 'rules.scopes.global' },
  { value: 'MERCHANT_SPECIFIC', labelKey: 'rules.scopes.merchantSpecific' }
]

/** 严重级别 */
export const SEVERITY_DICT: DictItem[] = [
  { value: 'ROUTINE', labelKey: 'rules.severities.routine' },
  { value: 'MEDIUM', labelKey: 'rules.severities.medium' },
  { value: 'CRITICAL', labelKey: 'rules.severities.critical' }
]

/** 规则状态 */
export const RULE_STATUS_DICT: DictItem[] = [
  { value: 'ACTIVE', labelKey: 'rules.statuses.active' },
  { value: 'PENDING', labelKey: 'rules.statuses.pending' },
  { value: 'CANCELLED', labelKey: 'rules.statuses.cancelled' }
]

/** 交易方向 */
export const DIRECTION_DICT: DictItem[] = [
  { value: 'OUTGOING', labelKey: 'rules.outgoing' },
  { value: 'INCOMING', labelKey: 'rules.incoming' }
]

/**
 * 规则阶段 — 全局固定配置
 * value 即 stage 编号（后端枚举），各页面只传编号，不传文字。
 * labelKey / descriptionKey 按 direction 区分出金/入金描述。
 */
export interface StageItem {
  value: string
  labelKey: string
  outgoingDescKey: string
  incomingDescKey: string
}

export const STAGE_DICT: StageItem[] = [
  {
    value: 'DUE_DILIGENCE',
    labelKey: 'rules.stages.dueDiligence',
    outgoingDescKey: 'rules.stages.outgoingDueDiligenceDesc',
    incomingDescKey: 'rules.stages.incomingDueDiligenceDesc'
  },
  {
    value: 'MISMATCH_HOLD',
    labelKey: 'rules.stages.mismatchHold',
    outgoingDescKey: 'rules.stages.mismatchHoldDesc',
    incomingDescKey: 'rules.stages.mismatchHoldDesc'
  }
]

function lookupLabel(dict: DictItem[], value: string): string | undefined {
  return dict.find((d) => d.value === value)?.labelKey
}

/** 决策 value → i18n key */
export function decisionLabelKey(value: string): string | undefined {
  return lookupLabel(DECISION_DICT, value)
}

/** 范围 value → i18n key */
export function scopeLabelKey(value: string): string | undefined {
  return lookupLabel(SCOPE_DICT, value)
}

/** 严重级别 value → i18n key */
export function severityLabelKey(value: string): string | undefined {
  return lookupLabel(SEVERITY_DICT, value)
}

/** 规则状态 value → i18n key */
export function ruleStatusLabelKey(value: string): string | undefined {
  return lookupLabel(RULE_STATUS_DICT, value)
}

/** 方向 value → i18n key */
export function directionLabelKey(value: string): string | undefined {
  return lookupLabel(DIRECTION_DICT, value)
}

/** 阶段编号 → i18n key（label） */
export function stageLabelKey(value: string): string | undefined {
  return STAGE_DICT.find((s) => s.value === value)?.labelKey
}

/** 阶段编号 + 方向 → i18n key（description） */
export function stageDescKey(
  value: string,
  direction: 'OUTGOING' | 'INCOMING' | string
): string | undefined {
  const stage = STAGE_DICT.find((s) => s.value === value)
  if (!stage) return undefined
  return direction === 'OUTGOING' ? stage.outgoingDescKey : stage.incomingDescKey
}
