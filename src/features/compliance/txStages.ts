/**
 * 交易阶段编排 — 「哪些事件出现在这笔交易上」的唯一判定入口。
 *
 * 关键约定：
 *   1. 阶段槽位只由【出入金方向】决定，方向固定哪些阶段出现。
 *   2. 判别"有没有 Travel Rule"看对手方的 did（Notabene VASP 标识），不看 travelRule 状态值
 *      （存在 tr=pending 但双方均无 did 的个人转账脏数据）。
 *   3. 无 Travel Rule 信息时该阶段状态按 N/A 展示，与其它 N/A 阶段一样置灰且不可点击。
 *
 * 四场景产出：
 *   出金（无论 VASP/个人） Compliance → Travel Rule → Sign-off → On-Chain
 *   入金（无论 VASP/个人） Travel Rule → On-Chain → Compliance → Fund Disposition
 */

export type StageKey = 'compliance' | 'travelRule' | 'signoff' | 'onchain' | 'disposition'

/** 编排所需的最小交易信息（列表项与 overview 均满足） */
export interface StageSource {
  direction: string
  originator?: { did?: string | null } | null
  beneficiary?: { did?: string | null } | null
  compliance?: string | null
  travelRule?: string | null
  signoff?: string | null
  onchain?: string | null
  disposition?: string | null
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
 * 阶段的有效状态值。
 *
 * travelRule 特例 1：无对手方 did（无 Travel Rule 信息）时按 N/A，
 * 避免脏数据（tr=pending 但实际无 TR）误导展示。
 *
 * travelRule 特例 2：mismatch 必须保留原值。后端把「申报了 VASP 但网络未发现
 * 对手方」这类需要人工审核的交易标记为 mismatch，而这类交易的 did 恰好为 null
 * ——若跟着特例 1 一起置成 N/A，异常会被静默吞掉（实测 orderId
 * O202610222113087512133111808：travelRule=mismatch、did=null）。
 */
export function stageStateOf(tx: StageSource, key: StageKey): string | null | undefined {
  //   if (key === 'travelRule' && !hasTravelRule(tx) && tx.travelRule !== 'mismatch') return 'na'
  const map: Record<StageKey, string | null | undefined> = {
    compliance: tx.compliance,
    travelRule: tx.travelRule,
    signoff: tx.signoff,
    onchain: tx.onchain,
    disposition: tx.disposition
  }
  return map[key]
}

/**
 * 阶段是否不可点击 —— 状态为 N/A（含无 Travel Rule 信息）的阶段全部禁用。
 */
export function isStageDisabled(tx: StageSource, key: StageKey): boolean {
  const state = stageStateOf(tx, key)
  return !state || state === 'na'
}

/** 已完成态：这些状态值表示该阶段已走完，可继续往后找进行中的阶段 */
const COMPLETED_STATES = new Set([
  'clear',
  'complete',
  'completed',
  'approved',
  'settled',
  'confirmed',
  'released',
  'success'
])

/**
 * 当前进行到哪一步 —— 用于从列表进入详情时直接定位。
 * 取第一个「未完成且可进入」的阶段；全部完成时取最后一个可进入阶段。
 * na（未执行/不适用）阶段跳过。
 */
export function currentStage(tx: StageSource): StageKey | null {
  const stages = buildStages(tx).filter((k) => !isStageDisabled(tx, k))
  if (stages.length === 0) return null
  for (const key of stages) {
    const state = (stageStateOf(tx, key) || '').toLowerCase()
    if (state && !COMPLETED_STATES.has(state)) return key
  }
  // 全部已完成：停在最后一步
  return stages[stages.length - 1]
}

/** 阶段 → 展示标签的 i18n 键 */
export const STAGE_LABEL_KEYS: Record<StageKey, string> = {
  compliance: 'txLens.detail.tabCompliance',
  travelRule: 'txLens.detail.tabTravelRule',
  signoff: 'txLens.detail.tabSignOff',
  onchain: 'txLens.detail.tabOnChain',
  disposition: 'txLens.detail.compFundDisposition'
}
