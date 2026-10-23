/**
 * Daily Reconciliation — 视图模型。
 *
 * 原型：docs/prototype/.../pages-v2/
 *   daily-reconciliation.html             商户 → 资产 总览（可展开）
 *   daily-reconciliation-detail.html      资产详情（Reconciled / Unreconciled / Pending TX）
 *   daily-reconciliation-unit-detail.html 财资单元当日明细（Included / Backfill）
 *   daily-reconciliation-pending.html     待入账交易汇总
 *
 * ⚠️ 后端尚未提供日终对账接口（openapi 只有 projectUnitAccountingRecord 的
 * 流水/余额查询，没有「日终快照 + 未对账日期」的聚合视图），
 * 因此当前数据由 features/audit/reconciliation/mock.ts 提供，页面会显示「接口待接入」提示。
 * 接口就绪后替换 mock 模块即可，页面与类型无需改动。
 */

/** 交易在当日对账中的归属 */
export type ReconciliationTxStatus = 'reconciled' | 'held' | 'forfeited' | 'pending'

/** 未对账日期的原因 */
export type UnreconciledReason = 'blockchain_mismatch' | 'pending_previous'

/** 交易日方向 */
export type ReconciliationDirection = 'IN' | 'OUT'

/** 交易对手（原型 Originator / Beneficiary 三行展示：姓名 / 城市 / VASP） */
export interface CounterpartyView {
  name: string
  address: string
  /** 城市，如 Singapore, SG */
  location: string
  /** VASP 机构名；我方为 Self */
  vasp: string
}

/** 一笔对账交易 */
export interface ReconciliationTxView {
  id: string
  orderId: string
  txId: string
  /** 活动类型：PAYIN / PAYOUT / TRANSFER_IN / TRANSFER_OUT / WITHDRAW / GAS_OUT */
  activity: string
  direction: ReconciliationDirection
  /** 金额（币种最小单位整数） */
  amount: string
  coinId: string
  /** 币种精度（随交易携带，汇总页可能混排多个资产） */
  decimals: number
  network: string
  /** 所属日期 yyyy-MM-dd */
  belongDate: string
  createTime: string
  /** 结算时间（单元明细页的 Settled At） */
  settledAt: string
  fromAddress: string
  toAddress: string
  /** 前余额（最小单位）；待入账的 pending 记录为 null */
  preBalance: string | null
  /** 后余额（最小单位）；待入账的 pending 记录为 null */
  postBalance: string | null
  treasuryUnitId: number
  treasuryUnitName: string
  status: ReconciliationTxStatus
  originator: CounterpartyView
  beneficiary: CounterpartyView
  /** 是否为补录交易（Backfill TX） */
  backfill: boolean
}

/** 账户（原型 Account 筛选项：Primary / Payout / Payin） */
export interface ReconciliationAccountView {
  id: string
  name: string
  type: 'PRIMARY' | 'PAYOUT' | 'PAYIN'
  address: string
}

/** 财资单元（Treasury Unit） */
export interface ReconciliationUnitView {
  id: number
  name: string
  /** 交易对手列展示的我方名称，如 Everypay Treasury */
  displayName: string
  accounts: ReconciliationAccountView[]
}

/** 单日财资单元汇总（Reconciled Tab 的表格行） */
export interface ReconciliationUnitDayView {
  unitId: number
  unitName: string
  openingBalance: string
  closingBalance: string
  includedCount: number
  backfillCount: number
}

/** 已对账的一天 */
export interface ReconciliationDayView {
  /** yyyy-MM-dd */
  date: string
  openingBalance: string
  closingBalance: string
  includedTx: ReconciliationTxView[]
  backfillTx: ReconciliationTxView[]
  units: ReconciliationUnitDayView[]
}

/** 未对账的日期（Unreconciled Tab） */
export interface UnreconciledDayView {
  date: string
  /** 最近更新时间 "yyyy-MM-dd HH:mm"，如 "2026-10-20 14:22" */
  statDate: string
  reason: UnreconciledReason
  /** 例如 "3 transactions missing confirmations on Ethereum" */
  detail: string
  affectedUnits: number
  /** 原型中 Pending Previous 没有预期更新时间 */
  expectedNextUpdate: string | null
}

/** 资产级对账状态（详情页整体） */
export interface ReconciliationAssetView {
  coinId: string
  network: string
  /** 金额精度（mock 数据自带；真实接口接入后用 coinStore 的值） */
  decimals: number
  /** 最近一次已关闭的余额（最小单位） */
  lastClosedBalance: string
  /** 最近一次已关闭的日期 yyyy-MM-dd */
  lastClosedDate: string
  /** 未对账天数（最近关闭日之后、今天之前的自然日数） */
  stalenessDays: number
  units: ReconciliationUnitView[]
  /** 已对账日期，按日期正序；最后一天即最近关闭日 */
  days: ReconciliationDayView[]
  /** 待入账交易（最近关闭日之后，Held / Forfeited） */
  pendingTx: ReconciliationTxView[]
  /** 未对账日期，按日期正序 */
  unreconciled: UnreconciledDayView[]
}

/** 列表页展开后的资产行 */
export interface ReconciliationAssetRowView {
  coinId: string
  network: string
  decimals: number
  treasuryUnitCount: number
  accountCount: number
  lastClosedBalance: string
  lastClosedDate: string
  /** 未对账天数 */
  unreconciledDays: number
}

/** 列表页的商户行（可展开） */
export interface ReconciliationMerchantRowView {
  code: string
  merchantName: string
  /** 头像缩写，如 CV */
  initials: string
  assetCount: number
  /** 存在未对账日期的资产数 */
  blockedAssets: number
  maxUnreconciledDays: number
  totalUnreconciledDays: number
  assets: ReconciliationAssetRowView[]
}

/** 列表页查询结果 */
export interface ReconciliationOverviewView {
  merchants: ReconciliationMerchantRowView[]
}
