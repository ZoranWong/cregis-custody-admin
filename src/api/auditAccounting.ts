// v2 API — Accounting（对账 / 资金流水 / 余额统计）
//
// 接口来自 docs/custody-admin.openapi.yaml 的 project-unit-accounting-record-controller，
// 与 custody-manager 的 accounting 页面同源，字段命名保持一致（pageNumber/pageSize + 扁平筛选）。
import { apiRequest } from '@/utils/http/request'
import type {
  AccountingRecordQuery,
  AccountingRecordView,
  CustodyAccountView,
  DailyBalanceQuery,
  FundRecordView,
  TreasuryUnitView,
  AccountStatView
} from '@/features/audit/accounting/types'

export interface AccountingRecordPage {
  records: AccountingRecordView[]
  total: number
  current: number
  size: number
  pages?: number
}

export interface FundRecordPage {
  records: FundRecordView[]
  total: number
  current: number
  size: number
  pages?: number
}

export interface TreasuryUnitPage {
  records: TreasuryUnitView[]
  total: number
  current: number
  size: number
}

export interface CustodyAccountPage {
  records: CustodyAccountView[]
  total: number
  current: number
  size: number
}

/**
 * 去掉空值后拼 query string。
 * 后端的 GET 接口（listUnitsByEcode / listAccountsByUnitId）用 query 参数，
 * 空字符串会被当成有效条件，因此统一在这里过滤。
 */
function toQueryString(values: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** normalize：后端偶发返回 null 字段，列表渲染前统一兜底，避免模板空指针 */
function normalizeRecord(raw: Partial<AccountingRecordView>): AccountingRecordView {
  return {
    id: Number(raw.id ?? 0),
    ecode: raw.ecode ?? '',
    projectId: Number(raw.projectId ?? 0),
    treasuryUnitId: Number(raw.treasuryUnitId ?? 0),
    coinId: raw.coinId ?? '',
    network: raw.network ?? '',
    activity: raw.activity ?? '',
    amount: Number(raw.amount ?? 0),
    direction: raw.direction === 'OUT' ? 'OUT' : 'IN',
    fromAddress: raw.fromAddress ?? '',
    toAddress: raw.toAddress ?? '',
    preBalance: Number(raw.preBalance ?? 0),
    postBalance: Number(raw.postBalance ?? 0),
    txId: raw.txId ?? '',
    orderId: raw.orderId ?? '',
    remark: raw.remark ?? '',
    belongDate: raw.belongDate ?? '',
    createTime: raw.createTime ?? ''
  }
}

/**
 * 对账记录（Treasury Unit 维度）。
 * POST /projectUnitAccountingRecord/list/unit
 */
export async function fetchAccountingRecords(
  query: AccountingRecordQuery = {}
): Promise<AccountingRecordPage> {
  const page = (await apiRequest<Partial<AccountingRecordPage>>(
    '/projectUnitAccountingRecord/list/unit',
    { method: 'POST', body: query }
  )) as Partial<AccountingRecordPage>
  return {
    records: (page.records ?? []).map(normalizeRecord),
    total: Number(page.total ?? 0),
    current: Number(page.current ?? query.pageNumber ?? 1),
    size: Number(page.size ?? query.pageSize ?? 10),
    pages: page.pages
  }
}

/**
 * 资金流水（Custody Account 维度，含手续费与流水类型）。
 * POST /projectUnitAccountingRecord/list/account
 */
export async function fetchFundRecords(query: AccountingRecordQuery = {}): Promise<FundRecordPage> {
  const page = (await apiRequest<Partial<FundRecordPage>>(
    '/projectUnitAccountingRecord/list/account',
    { method: 'POST', body: query }
  )) as Partial<FundRecordPage>
  return {
    records: (page.records ?? []).map((raw) => ({
      id: Number(raw.id ?? 0),
      ecode: raw.ecode ?? '',
      projectId: Number(raw.projectId ?? 0),
      treasuryUnitId: Number(raw.treasuryUnitId ?? 0),
      cusAccountId: Number(raw.cusAccountId ?? 0),
      txId: raw.txId ?? '',
      orderId: raw.orderId ?? '',
      coinId: raw.coinId ?? '',
      network: raw.network ?? '',
      // 对齐 AccountingRecordView 字段名：fromAddr → fromAddress, toAddr → toAddress
      fromAddress: raw.fromAddr ?? '',
      toAddress: raw.toAddr ?? '',
      direction: raw.direction === 'OUT' ? 'OUT' : 'IN',
      amount: Number(raw.amount ?? 0),
      preBalance: Number(raw.preBalance ?? 0),
      postBalance: Number(raw.postBalance ?? 0),
      fee: raw.fee ?? '',
      // 对齐 AccountingRecordView 字段名：txType → activity
      activity: raw.txType ?? '',
      txType: raw.txType ?? '',
      createTime: raw.createTime ?? ''
    })) as FundRecordView[],
    total: Number(page.total ?? 0),
    current: Number(page.current ?? query.pageNumber ?? 1),
    size: Number(page.size ?? query.pageSize ?? 10),
    pages: page.pages
  }
}

/**
 * 余额趋势。
 * POST /projectUnitAccountingRecord/daily
 *
 * 返回结构是 `coinId -> AccountStatView[]`（按日期正序），
 * 页面按 coinId 分组后取主币种画总余额，其余币种只贡献出入金。
 */
export async function fetchDailyBalances(
  query: DailyBalanceQuery = {}
): Promise<Record<string, AccountStatView[]>> {
  const data = (await apiRequest<Record<string, AccountStatView[]>>(
    '/projectUnitAccountingRecord/daily',
    { method: 'POST', body: query }
  )) as Record<string, AccountStatView[]> | null
  return data && typeof data === 'object' ? data : {}
}

/**
 * 商户下的财资单元。
 * GET /projectUnitAccountingRecord/listUnitsByEcode
 */
export async function fetchTreasuryUnits(
  ecode: string,
  pageNumber = 1,
  pageSize = 100
): Promise<TreasuryUnitPage> {
  const page = (await apiRequest<Partial<TreasuryUnitPage>>(
    `/projectUnitAccountingRecord/listUnitsByEcode${toQueryString({ ecode, pageNumber, pageSize })}`
  )) as Partial<TreasuryUnitPage>
  return {
    records: (page.records ?? []) as TreasuryUnitView[],
    total: Number(page.total ?? 0),
    current: Number(page.current ?? pageNumber),
    size: Number(page.size ?? pageSize)
  }
}

/**
 * 财资单元下的 custody 账户。
 * GET /projectUnitAccountingRecord/listAccountsByUnitId
 */
export async function fetchUnitAccounts(
  unitId: number,
  pageNumber = 1,
  pageSize = 100
): Promise<CustodyAccountPage> {
  const page = (await apiRequest<Partial<CustodyAccountPage>>(
    `/projectUnitAccountingRecord/listAccountsByUnitId${toQueryString({ unitId, pageNumber, pageSize })}`
  )) as Partial<CustodyAccountPage>
  return {
    records: (page.records ?? []) as CustodyAccountView[],
    total: Number(page.total ?? 0),
    current: Number(page.current ?? pageNumber),
    size: Number(page.size ?? pageSize)
  }
}
