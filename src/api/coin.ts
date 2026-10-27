// v2 API — 币种列表（从 v1 src/api/coin.ts 移植）
import { apiRequest } from '@/utils/http/request'

export interface CoinOnChainView {
  coinId: string
  unit: string
  coinIconUrl: string
  prec: number
  coinType: string
  decimals: number
  tokenFlag: number
  coinIdOnChain: string
  network: string
  appendix: string
  withdrawingFee: string
  /** 0 = 正常，1 = 已删除（后端会返回软删除记录） */
  isDeleted?: number
}

export async function fetchCoinList(): Promise<CoinOnChainView[]> {
  return (await apiRequest<CoinOnChainView[]>('/coin/list')) as CoinOnChainView[]
}
