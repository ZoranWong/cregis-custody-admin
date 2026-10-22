// v2 API — Fee Monitor (从 v1 src/api/operationsFee.ts 移植)
import { apiRequest } from '@/utils/http/request'
import type {
  FeeOverviewView,
  FeeRankingResponseView,
  FeeMerchantDailyResponseView,
  NativeCoinConsumptionView,
  PlatformGasConfigView,
  MerchantGasConfigView,
  TopUpOverviewView,
  MerchantBillingRecordResponseView
} from '@/features/ops/fee/types'

export interface FeeOverviewQuery {
  startDate?: string
  endDate?: string
  ecode?: string
  network?: string
}

export interface FeeRankingQuery {
  startDate?: string
  endDate?: string
  pageNum?: number
  pageSize?: number
  network?: string
}

export interface FeeMerchantDailyQuery {
  startDate?: string
  endDate?: string
  /** 留空表示平台维度（全部商户汇总），用于概览趋势图 */
  ecode?: string
  pageNum?: number
  pageSize?: number
  network?: string
}

export interface FeeNativeCoinQuery {
  startDate?: string
  endDate?: string
  ecode: string
  network?: string
}

export interface MerchantGasConfigQuery {
  ecode: string
  network?: string
}

export interface GasTopupRecordQuery {
  ecode?: string
  pageNum?: number
  pageSize?: number
}

function toQueryString<T extends object>(values: T): string {
  const params = new URLSearchParams()
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function fetchFeeOverview(query: FeeOverviewQuery = {}): Promise<FeeOverviewView> {
  return (await apiRequest<FeeOverviewView>(
    `/feeCenter/feeMonitorMerchantDailyStat/overview${toQueryString(query)}`
  )) as FeeOverviewView
}

export async function fetchFeeRanking(
  query: FeeRankingQuery = {}
): Promise<FeeRankingResponseView> {
  return (await apiRequest<FeeRankingResponseView>(
    `/feeCenter/feeMonitorMerchantDailyStat/ranking${toQueryString(query)}`
  )) as FeeRankingResponseView
}

export async function fetchMerchantFeeDaily(
  query: FeeMerchantDailyQuery
): Promise<FeeMerchantDailyResponseView> {
  return (await apiRequest<FeeMerchantDailyResponseView>(
    `/feeCenter/feeMonitorMerchantDailyStat/merchantFeeDailyPage${toQueryString(query)}`
  )) as FeeMerchantDailyResponseView
}

export async function fetchNativeCoinConsumption(
  query: FeeNativeCoinQuery
): Promise<NativeCoinConsumptionView[]> {
  return (await apiRequest<NativeCoinConsumptionView[]>(
    `/feeCenter/feeMonitorMerchantDailyStat/nativeCoinConsumption${toQueryString(query)}`
  )) as NativeCoinConsumptionView[]
}

export async function fetchPlatformGasConfigList(): Promise<PlatformGasConfigView[]> {
  return (await apiRequest<PlatformGasConfigView[]>(
    '/feeCenter/platformGasConfig/list'
  )) as PlatformGasConfigView[]
}

export async function updatePlatformGasConfig(payload: PlatformGasConfigView): Promise<void> {
  await apiRequest<void>('/feeCenter/platformGasConfig/update', { method: 'POST', body: payload })
}

export async function addPlatformGasConfig(payload: PlatformGasConfigView): Promise<void> {
  await apiRequest<void>('/feeCenter/platformGasConfig/add', { method: 'POST', body: payload })
}

export async function fetchMerchantGasConfigList(
  query: MerchantGasConfigQuery
): Promise<MerchantGasConfigView[]> {
  return (await apiRequest<MerchantGasConfigView[]>(
    `/feeCenter/merchant/gas/config/list${toQueryString(query)}`
  )) as MerchantGasConfigView[]
}

export async function updateMerchantGasConfig(payload: MerchantGasConfigView): Promise<void> {
  await apiRequest<void>('/feeCenter/merchant/gas/config/update', { method: 'POST', body: payload })
}

export async function addMerchantGasConfig(payload: MerchantGasConfigView): Promise<void> {
  await apiRequest<void>('/feeCenter/merchant/gas/config/add', { method: 'POST', body: payload })
}

export async function fetchUSDTRecord(query: {
  startDate: string
  endDate: string
  ecode: string
  coinId?: string
  pageNum?: number
  pageSize?: number
}): Promise<MerchantBillingRecordResponseView> {
  return (await apiRequest<MerchantBillingRecordResponseView>(
    `/feeCenter/feeMonitorMerchantDailyStat/getUSDTRecord${toQueryString(query)}`
  )) as MerchantBillingRecordResponseView
}

export async function fetchTopUpOverview(query: {
  startDate: string
  endDate: string
  ecode: string
  coinId?: string
}): Promise<TopUpOverviewView> {
  return (await apiRequest<TopUpOverviewView>(
    `/feeCenter/feeMonitorMerchantDailyStat/topUp/overview${toQueryString(query)}`
  )) as TopUpOverviewView
}

/** 充值账单记录（Credit Increase 数据源）：金额为 USDT base unit（6 位小数） */
export interface CustomerTopupBillingRecord {
  id: number
  amount: string | number
  coinId: string
  createTime: string
  direction: string
  type: string
  transferEcode: string
  remark?: string | null
  txCount?: number | null
}

interface CustomerTopupBillingResponse {
  records: CustomerTopupBillingRecord[]
  total: number
  current: number
  size: number
}

/**
 * 平台维度的信用额度入账（Credit Increase）汇总。
 *
 * 后端没有提供平台级聚合接口（topUp/overview 必须传 ecode），
 * 因此按日期区间拉取账单记录（createTime 支持 >= / < 条件）后在前端求和。
 * 金额单位与 USDT 一致（base unit，1e6）。
 */
export async function fetchCreditIncreaseTotal(params: {
  startDate: string
  endDate: string
}): Promise<number> {
  const endExclusive = (() => {
    const d = new Date(`${params.endDate}T00:00:00`)
    d.setDate(d.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })()
  const result = (await apiRequest<CustomerTopupBillingResponse>(
    '/billing/getCustomerTopupBilling',
    {
      method: 'POST',
      body: {
        pageIndex: 1,
        pageSize: 500,
        sortFields: 'createTime_d',
        queryList: [
          { key: 'createTime', value: params.startDate, oper: '>=', join: 'and' },
          { key: 'createTime', value: endExclusive, oper: '<', join: 'and' }
        ]
      }
    }
  )) as CustomerTopupBillingResponse
  const records = result?.records ?? []
  const totalBaseUnit = records.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  return totalBaseUnit / 1_000_000
}
