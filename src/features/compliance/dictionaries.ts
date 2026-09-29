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
  { value: 'SUBMIT_FOR_REVIEW', labelKey: 'rules.decisions.submitReview' },
  { value: 'HOLD', labelKey: 'rules.decisions.hold' }
]

/** 范围 */
export const SCOPE_DICT: DictItem[] = [
  { value: 'GLOBAL', labelKey: 'rules.scopes.global' },
  { value: 'MERCHANT', labelKey: 'rules.scopes.merchant' }
]

/** 严重级别 */
export const SEVERITY_DICT: DictItem[] = [
  { value: 'ROUTINE', labelKey: 'rules.severities.routine' },
  { value: 'MEDIUM', labelKey: 'rules.severities.medium' },
  { value: 'CRITICAL', labelKey: 'rules.severities.critical' }
]

/** 交易方向 */
export const DIRECTION_DICT: DictItem[] = [
  { value: 'ALL', labelKey: 'rules.all' },
  { value: 'OUTGOING', labelKey: 'rules.outgoing' },
  { value: 'INCOMING', labelKey: 'rules.incoming' }
]

/**
 * 规则阶段 — 接口无 stage 字段，前端统一按 DUE_DILIGENCE 处理
 */
export interface StageItem {
  value: string
  labelKey: string
  outgoingDescKey: string
  incomingDescKey: string
}

export const STAGE_DICT: StageItem[] = [
  {
    value: 'TRAVEL_RULE_AUTO_ACCEPT',
    labelKey: 'rules.stages.travelRuleAutoAccept',
    outgoingDescKey: '',
    incomingDescKey: 'rules.stages.travelRuleAutoAcceptDesc'
  },
  {
    value: 'DUE_DILIGENCE',
    labelKey: 'rules.stages.dueDiligence',
    outgoingDescKey: 'rules.stages.outgoingDueDiligenceDesc',
    incomingDescKey: 'rules.stages.incomingDueDiligenceDesc'
  },
  {
    value: 'MISMATCH_HOLD',
    labelKey: 'rules.stages.mismatchHold',
    outgoingDescKey: '',
    incomingDescKey: 'rules.stages.mismatchHoldDesc'
  }
]

function lookupLabel(dict: DictItem[], value: string): string | undefined {
  return dict.find((d) => d.value === value)?.labelKey
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

/**
 * 风险因子目录 — 前端统一定义的 field 名称
 *
 * 后端已支持查询的因子（field 名需与后端一致）：
 *  - risk_score
 *  - counterparty_type
 *  - vasp_status
 *  - vasp_regulatory
 *  - counterparty_jurisdiction
 *  - screening.beneficiary_address
 *  - screening.originator_address
 *  - amount（金额）
 *
 * 其余因子为前端自定义 field，后续由后端补充字典即可。
 */

export interface FactorOption {
  /** 后端 field 名（稳定 key） */
  key: string
  /** i18n 键 */
  labelKey: string
  /** 域 i18n 键 */
  domainKey: string
  /** 运算符 */
  operator: string
  /** 因子类型：multi=多选，input=输入框 */
  type: 'multi' | 'input'
  /** multi 类型的可选项（'__countries__' 表示国家列表） */
  options: string[]
  /** input 类型的用途提示 i18n 键 */
  hintKey?: string
  /**
   * 后端是否已支持该字段（2026-09-08 实测 /compliance/rules 接口白名单）。
   * false 的因子仅目录展示，编辑器禁用勾选，等后端补字典后放开。
   */
  supported: boolean
}

export const FACTOR_CATALOG: FactorOption[] = [
  // ── 后端已支持（实测 200）──
  {
    key: 'risk_score',
    labelKey: 'rules.factors.riskScore',
    domainKey: 'rules.factorDomains.customerDueDiligence',
    operator: 'gt',
    type: 'input',
    options: [],
    hintKey: 'rules.factorHints.riskScore',
    supported: true
  },
  {
    key: 'counterparty_type',
    labelKey: 'rules.factors.counterpartyType',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'eq',
    type: 'multi',
    options: ['mixed', 'unhosted'],
    supported: true
  },
  {
    key: 'vasp_status',
    labelKey: 'rules.factors.vaspStatus',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'eq',
    type: 'multi',
    options: ['registered', 'unlicensed', 'unregulated'],
    supported: true
  },
  {
    key: 'vasp_regulatory',
    labelKey: 'rules.factors.regulatory',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'eq',
    type: 'multi',
    options: ['verified', 'unverified'],
    supported: true
  },
  {
    key: 'counterparty_jurisdiction',
    labelKey: 'rules.factors.jurisdiction',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'in',
    type: 'multi',
    options: ['__countries__'],
    supported: true
  },
  {
    key: 'screening.beneficiary_address',
    labelKey: 'rules.factors.beneficiaryAddress',
    domainKey: 'rules.factorDomains.screening',
    operator: 'in',
    type: 'multi',
    options: ['mixer', 'darknet', 'ransomware', 'sanctionsAddr', 'theftScam', 'structuring'],
    supported: true
  },
  {
    key: 'screening.originator_address',
    labelKey: 'rules.factors.originatorAddress',
    domainKey: 'rules.factorDomains.screening',
    operator: 'in',
    type: 'multi',
    options: ['mixer', 'darknet', 'ransomware', 'sanctionsAddr', 'theftScam', 'structuring'],
    supported: true
  },
  // ── 前端定义，后端白名单未支持（实测 400415 CONDITION_FIELD_INVALID）──
  {
    key: 'amount',
    labelKey: 'rules.factors.amount',
    domainKey: 'rules.factorDomains.customerDueDiligence',
    operator: 'gte',
    type: 'input',
    options: [],
    hintKey: 'rules.factorHints.amount',
    supported: false
  },
  {
    key: 'tr_capable',
    labelKey: 'rules.factors.trCapable',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'in',
    type: 'multi',
    options: ['yes', 'no'],
    supported: true
  },
  {
    key: 'ivms101_valid',
    labelKey: 'rules.factors.ivms101Valid',
    domainKey: 'rules.factorDomains.counterpartyVasp',
    operator: 'in',
    type: 'multi',
    options: ['valid', 'invalid'],
    supported: true
  },
  // ── travelRule 域（后端已支持）──
  {
    key: 'beneficiary_name_match',
    labelKey: 'rules.factors.beneficiaryNameMatch',
    domainKey: 'rules.factorDomains.travelRule',
    operator: 'eq',
    type: 'multi',
    options: ['match', 'mismatch'],
    supported: true
  },
  {
    key: 'amount_deviation',
    labelKey: 'rules.factors.amountDeviation',
    domainKey: 'rules.factorDomains.travelRule',
    operator: 'gt',
    type: 'input',
    options: [],
    hintKey: 'rules.factorHints.amountDeviation',
    supported: true
  },
  // ── 后端返回但未启用（enabled=false），仅目录展示置灰 ──
  {
    key: 'onboarding_state',
    labelKey: 'rules.factors.onboardingStatus',
    domainKey: 'rules.factorDomains.customerDueDiligence',
    operator: 'in',
    type: 'multi',
    options: ['onboarded', 'pending', 'labeled', 'frozen', 'offboarded'],
    supported: false
  },
  {
    key: 'customer_risk_level',
    labelKey: 'rules.factors.customerRiskLevel',
    domainKey: 'rules.factorDomains.customerDueDiligence',
    operator: 'in',
    type: 'multi',
    options: ['low', 'medium', 'high'],
    supported: false
  },
  {
    key: 'screening.counterparty_vasp',
    labelKey: 'rules.factors.counterpartyVasp',
    domainKey: 'rules.factorDomains.screening',
    operator: 'in',
    type: 'multi',
    options: ['ofacSdn', 'euList', 'unSecurity', 'pep', 'adverseMedia', 'criminal'],
    supported: false
  },
  {
    key: 'screening.beneficiary_entity',
    labelKey: 'rules.factors.beneficiary',
    domainKey: 'rules.factorDomains.screening',
    operator: 'in',
    type: 'multi',
    options: ['ofacSdn', 'euList', 'unSecurity', 'pep', 'adverseMedia', 'criminal'],
    supported: false
  }
]

/**
 * 条件运算符 → 展示符号（对齐原型）
 *  - 相等/包含类 → 冒号：`Beneficiary: OFAC SDN`
 *  - 比较类 → 数学符号：`Amount ≥ 10,000 AED`
 */
const OPERATOR_SYMBOLS: Record<string, string> = {
  eq: ':',
  in: ':',
  contains: ':',
  neq: '≠',
  not_in: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤'
}

export function operatorSymbol(value: string): string {
  return OPERATOR_SYMBOLS[value] || value || ':'
}

/** 冒号类运算符（冒号前不留空格，其余运算符两侧留空格） */
const COLON_OPERATORS = new Set([':', '≠'])

export function factorByKey(value: string): FactorOption | undefined {
  return FACTOR_CATALOG.find((f) => f.key === value)
}

// ─── 统一格式化注册表 ───
//
// 规则相关的所有枚举展示（列表 / 详情 / 编辑器 / tx-lens 命中规则）
// 统一走这里，避免各组件各写一套 map。组件只调用下方导出的
// *Label / *Tag 函数并传入 t，不再自行维护映射。

export type Translate = (key: string) => string

/** 枚举 → 可读标签：按字典查 i18n key，缺失时回退原值（空值显示 '--'） */
function labelOf(
  dict: DictItem[],
  value: string | null | undefined,
  t: Translate,
  fallbackToValue = true
): string {
  if (!value) return '--'
  const key = lookupLabel(dict, value)
  if (key) return t(key)
  return fallbackToValue ? value : '--'
}

/** 决策枚举 → 标签（AUTO_REJECT / SUBMIT_FOR_REVIEW / HOLD） */
export function decisionLabel(value: string | null | undefined, t: Translate): string {
  return labelOf(DECISION_DICT, value, t)
}

/** 范围枚举 → 标签 */
export function scopeLabel(value: string | null | undefined, t: Translate): string {
  return labelOf(SCOPE_DICT, value, t)
}

/** 严重级别枚举 → 标签（ROUTINE / MEDIUM / CRITICAL） */
export function severityLabel(value: string | null | undefined, t: Translate): string {
  return labelOf(SEVERITY_DICT, value, t)
}

/** 交易方向枚举 → 标签 */
export function directionLabel(value: string | null | undefined, t: Translate): string {
  return labelOf(DIRECTION_DICT, value, t)
}

/** 阶段编号 → 标签 */
export function stageLabel(value: string | null | undefined, t: Translate): string {
  return labelOf(STAGE_DICT, value, t)
}

/** 因子 field → 标签（未收录的 field 用 fallback；无 fallback 则原样展示） */
export function factorLabel(
  value: string | null | undefined,
  t: Translate,
  fallback?: string
): string {
  if (!value) return fallback || '--'
  const key = FACTOR_CATALOG.find((f) => f.key === value)?.labelKey
  if (key) return t(key)
  return fallback || value
}

/** 因子取值 → 标签；非字典 key（自由输入 / 复合值）原样返回 */
export function factorOptionLabel(value: string, t: Translate): string {
  if (value.includes(' — ')) return value
  const translated = t(`rules.factorOptions.${value}`)
  return translated.startsWith('rules.factorOptions.') ? value : translated
}

/** el-tag type 取值 */
export type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

/** 严重级别 → el-tag type */
export function severityTagType(value: string): TagType {
  if (value === 'CRITICAL') return 'danger'
  if (value === 'MEDIUM') return 'warning'
  return 'info'
}

/** 方向 → el-tag type */
export function directionTagType(value: string): TagType {
  if (value === 'OUTGOING') return 'primary'
  if (value === 'INCOMING') return 'success'
  return 'info'
}

/**
 * 条件 → 展示文本，对齐原型：
 *   相等/包含 → `对手方类型: 未托管`
 *   比较类   → `金额 ≥ 10000`
 */
export function conditionText(
  cond: { field: string; operator?: string; value?: string },
  t: Translate
): string {
  const field = factorLabel(cond.field, t)
  const op = operatorSymbol(cond.operator || 'eq')
  const raw = cond.value ?? ''
  if (!raw) return `${field}${op} --`
  const values = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => factorOptionLabel(v, t))
  const joiner = COLON_OPERATORS.has(op) ? `${op} ` : ` ${op} `
  return `${field}${joiner}${values.join(', ')}`
}

/** 条件中的因子 → 所属域标签（未收录归入 otherDomain） */
export function conditionDomainLabel(field: string, t: Translate): string {
  const key = FACTOR_CATALOG.find((f) => f.key === field)?.domainKey
  return key ? t(key) : t('rules.otherDomain')
}
