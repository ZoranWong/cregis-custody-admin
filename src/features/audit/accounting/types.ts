/**
 * Accounting — 视图模型。
 *
 * 原型：docs/prototype/.../pages-v2/audit-merchants.html（页面标题 Accounting）。
 *
 * 数据来自真实接口（docs/custody-admin.openapi.yaml）：
 *   POST /projectUnitAccountingRecord/list/unit       对账记录（按财资单元）
 *   POST /projectUnitAccountingRecord/list/account    资金流水（按 custody 账户）
 *   POST /projectUnitAccountingRecord/daily           余额趋势（按日/周/月聚合）
 *   GET  /projectUnitAccountingRecord/listUnitsByEcode    商户下的财资单元
 *   GET  /projectUnitAccountingRecord/listAccountsByUnitId 单元下的账户
 *
 * 字段命名与后端一致（camelCase），金额均为「币种最小单位」的整数，
 * 由页面结合 coinStore 的 decimals 换算成展示值。
 */

/** 对账记录（POST /projectUnitAccountingRecord/list/unit 返回项） */
export interface AccountingRecordView {
  id: number
  ecode: string
  projectId: number
  treasuryUnitId: number
  coinId: string
  network: string
  /** 活动类型，如 TRANSFER_IN / PAYOUT */
  activity: string
  /** 金额（最小单位） */
  amount: number
  direction: 'IN' | 'OUT'
  fromAddress: string
  toAddress: string
  /** 前余额（最小单位） */
  preBalance: number
  /** 后余额（最小单位） */
  postBalance: number
  txId: string
  orderId: string
  remark: string
  /** 所属日期 yyyy-MM-dd */
  belongDate: string
  createTime: string
}

/** 资金流水类型（ProjectUnitFundRecord.txType） */
export type FundRecordTxType =
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'WITHDRAW'
  | 'ALLOCATE_IN'
  | 'ALLOCATE_OUT'
  | 'POOL_IN'
  | 'POOL_OUT'
  | 'GAS_OUT'
  | 'FEE_OUT'
  | 'DEPLOY'

/** 资金流水（POST /projectUnitAccountingRecord/list/account 返回项） */
export interface FundRecordView {
  id: number
  ecode: string
  projectId: number
  treasuryUnitId: number
  cusAccountId: number
  txId: string
  orderId: string
  coinId: string
  network: string
  fromAddr: string
  toAddr: string
  direction: 'IN' | 'OUT'
  amount: number
  preBalance: number
  postBalance: number
  /** 手续费（字符串，接口直接返回） */
  fee: string
  txType: FundRecordTxType | string
  createTime: string
}

/** 余额统计（POST /projectUnitAccountingRecord/daily 返回项） */
export interface AccountStatView {
  coinId: string
  totalBalance: string
  freezeBalance: string
  holdBalance?: string
  availableBalance: string
  totalIncome: string
  totalOutcome: string
  statDate: string
}

/** 财资单元（GET /projectUnitAccountingRecord/listUnitsByEcode 返回项） */
export interface TreasuryUnitView {
  id: number
  ecode: string
  projectId: number
  name: string
  coinIds: Array<{ coinId: string; network: string }>
  status?: string
}

/** custody 账户（GET /projectUnitAccountingRecord/listAccountsByUnitId 返回项） */
export interface CustodyAccountView {
  id: number
  ecode: string
  vaultCode: string
  vaultAccountId: string
  projectId: number
  treasuryUnitId: number
  accountName: string
  coinId: string
  network: string
  /** FREEZE / PRIMARY / PAYOUT / PAYIN / GENERAL_GAS / QUARANTINE */
  type: string
  balance: number
  freezeBalance: number
  holdBalance: number
  income: number
  outcome: number
  status: number
}

export interface AccountingRecordQuery {
  pageNumber?: number
  pageSize?: number
  /** 商户编码 */
  ecode?: string
  treasuryUnitId?: number
  cusAccountId?: number
  coinId?: string
  /** yyyy-MM-dd */
  startDate?: string
  /** yyyy-MM-dd */
  endDate?: string
}

export interface DailyBalanceQuery {
  coinIds?: string[]
  /** 返回的聚合点数量（后端默认 30） */
  number?: number
  projectId?: number
  treasuryUnitId?: number
  cusAccountId?: number
  vaultAccountId?: string
  startDate?: string
  endDate?: string
  network?: string
  /** 1 日 / 2 周 / 3 月 / 4 季 / 5 年 */
  dateType?: 1 | 2 | 3 | 4 | 5
  ecode?: string
}

/** 原型的时间粒度切换：Daily / Weekly / Monthly */
export type TrendGranularity = 'daily' | 'weekly' | 'monthly'

/** 聚合后的趋势点（页面用） */
export interface TrendPoint {
  /** 展示用标签，如 "10-19" / "Oct" */
  label: string
  /** 原始统计日期（yyyy-MM-dd），用于 tooltip */
  statDate: string
  /** 折合主币种后的总余额 */
  balance: number
  inflow: number
  outflow: number
}

/** 账户维度开关（原型"Account"筛选项） */
export type AccountTypeFilter = '' | 'PRIMARY' | 'PAYOUT' | 'PAYIN'
