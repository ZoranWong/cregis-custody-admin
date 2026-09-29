/**
 * 交易阶段编排 — 「哪些事件出现在这笔交易上」的唯一判定入口。
 *
 * 关键约定（与后端确认过）：
 *   1. 阶段槽位只由【出入金方向】决定，方向固定哪些阶段出现；
 *      对手方有没有 did(Notabene VASP 标识) 只决定 travelRule 槽位是否可用（disabled）。
 *   2. 判别"有没有 Travel Rule"要看对手方的 did，不能看 travelRule 状态值。
 *      实测列表数据：did 与 Travel Rule 信息完全对应；
 *      travelRule 状态值不可靠（存在 tr=pending 但双方均无 did 的个人转账脏数据）。
 *   3. 无 Travel Rule 信息时槽位保留、不可点击、渲染成灰色（na），
 *      状态显示"无 Travel Rule 信息"，列表与详情一致。
 *
 * 四场景产出：
 *   出金（无论 VASP/个人） Compliance → Travel Rule → Sign-off → On-Chain
 *     —— 个人出金时 Travel Rule 置灰不可点
 *   入金（无论 VASP/个人） Travel Rule → On-Chain → Compliance → Fund Disposition
 *     —— 个人入金时 Travel Rule 置灰不可点
 */

export type StageKey = 'compliance' | 'travelRule' | 'signoff' | 'onchain' | 'disposition'

/** 编排所需的最小交易信息（列表项与 overview 均满足） */
export interface StageSource {
  direction: string
  originator?: { did?: string | null } | null
  beneficiary?: { did?: string | null } | null
  onchain?: string | null
}

/**
 * 对手方：出金看受益方，入金看发起方。
 * direction 大小写不一致（列表 / overview 用小写，告警接口用大写），统一归一化。
 */
export function counterparty(tx: StageSource): { did?: string | null } | null {
  const outgoing = String(tx.direction).toLowerCase() === 'outgoing'
  return (outgoing ? tx.beneficiary : tx.originator) ?? null
}

/** 是否发生 Travel Rule —— 以对手方是否携带 did(Notabene VASP 标识) 为准，不看状态值 */
export function hasTravelRule(tx: StageSource): boolean {
  return !!counterparty(tx)?.did
}

/** 交易方向（归一化后） */
export function isOutgoing(tx: StageSource): boolean {
  return String(tx.direction).toLowerCase() === 'outgoing'
}

/**
 * 按方向产出该交易应展示的阶段序列。
 * 入金按业务时序排列：Travel Rule → On-Chain → Compliance → Fund Disposition。
 */
export function buildStages(tx: StageSource): StageKey[] {
  if (isOutgoing(tx)) {
    return ['compliance', 'travelRule', 'signoff', 'onchain']
  }
  return ['travelRule', 'onchain', 'compliance', 'disposition']
}

/**
 * 阶段是否不可用（置灰、不可点击）。
 * 目前只有 travelRule 会：无对手方 PII（个人转账）时该槽位保留但不可进入。
 */
export function isStageDisabled(tx: StageSource, key: StageKey): boolean {
  return key === 'travelRule' && !hasTravelRule(tx)
}

/** 阶段 → 展示标签的 i18n 键 */
export const STAGE_LABEL_KEYS: Record<StageKey, string> = {
  compliance: 'txLens.detail.tabCompliance',
  travelRule: 'txLens.detail.tabTravelRule',
  signoff: 'txLens.detail.tabSignOff',
  onchain: 'txLens.detail.tabOnChain',
  disposition: 'txLens.detail.compFundDisposition'
}
