/**
 * 交易阶段编排 — 「哪些事件出现在这笔交易上」的唯一判定入口。
 *
 * 关键约定（与后端确认过）：
 *   1. 阶段是否显示，只由【出入金方向】+【对手方有没有 name(Travel Rule PII)】决定，
 *      与阶段自身的状态取值无关。状态值只决定颜色，不决定显不显示。
 *   2. 判别"有没有 Travel Rule"要看对手方的 name，不能看 travelRule 状态值。
 *      实测 50 笔订单：以 ivms101Pii 是否为 null 为真值，
 *        - 对手方 name 判定  50/50 命中
 *        - travelRule !== 'na' 49/50，反例 I202609112098320881708306432
 *          （travelRule=pending 但 ivms101Pii 为 null，实为个人入金）
 *   3. na 表示"未执行 / 无法判断该事件是否发生"，阶段槽位仍然保留，只是渲染成灰色。
 *
 * 四场景产出：
 *   出金 · VASP   Compliance → Travel Rule → Sign-off  → On-Chain
 *   出金 · 个人   Compliance → Sign-off                → On-Chain
 *   入金 · VASP   Compliance → Travel Rule             → On-Chain → Fund Disposition
 *   入金 · 个人   Compliance                           → On-Chain → Fund Disposition
 */

export type StageKey = 'compliance' | 'travelRule' | 'signoff' | 'onchain' | 'disposition'

/** 编排所需的最小交易信息（列表项与 overview 均满足） */
export interface StageSource {
  direction: string
  originator?: { name?: string | null } | null
  beneficiary?: { name?: string | null } | null
}

/**
 * 对手方：出金看受益方，入金看发起方。
 * direction 大小写不一致（列表 / overview 用小写，告警接口用大写），统一归一化。
 */
export function counterparty(tx: StageSource): { name?: string | null } | null {
  const outgoing = String(tx.direction).toLowerCase() === 'outgoing'
  return (outgoing ? tx.beneficiary : tx.originator) ?? null
}

/** 是否发生 Travel Rule —— 以对手方是否携带 name(PII) 为准，不看状态值 */
export function hasTravelRule(tx: StageSource): boolean {
  return !!counterparty(tx)?.name
}

/** 交易方向（归一化后） */
export function isOutgoing(tx: StageSource): boolean {
  return String(tx.direction).toLowerCase() === 'outgoing'
}

/** 按方向 + 对手方 name 是否存在，产出该交易应展示的阶段序列 */
export function buildStages(tx: StageSource): StageKey[] {
  const outgoing = isOutgoing(tx)
  const keys: StageKey[] = ['compliance']
  if (hasTravelRule(tx)) keys.push('travelRule')
  if (outgoing) keys.push('signoff')
  keys.push('onchain') // 出金入金都有
  if (!outgoing) keys.push('disposition')
  return keys
}

/** 阶段 → 展示标签的 i18n 键 */
export const STAGE_LABEL_KEYS: Record<StageKey, string> = {
  compliance: 'txLens.detail.tabCompliance',
  travelRule: 'txLens.detail.tabTravelRule',
  signoff: 'txLens.detail.tabSignOff',
  onchain: 'txLens.detail.tabOnChain',
  disposition: 'txLens.detail.compFundDisposition'
}
