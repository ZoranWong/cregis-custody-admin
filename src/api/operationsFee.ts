// v2 API — Fee Monitor (从 v1 src/api/operationsFee.ts 移植)
import { apiRequest } from '@/utils/http/request'
import type {
  FeeOverviewView,
  FeeRankingResponseView,
  FeeMerchantDailyResponseView,
  NativeCoinConsumptionView,
  PlatformGasConfigView,
  MerchantGasConfigView,
  GasCostResponseView,
  GasTopupRecordResponseView,
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
  ecode: string
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
