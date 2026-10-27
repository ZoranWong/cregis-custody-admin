/**
 * Daily Reconciliation — 币种来源。
 *
 * 资产行以「系统 coin 列表」（`/coin/list`，经 useCoinStore 缓存）为准：
 * coinId / network / decimals / 图标都取自系统配置，对账指标按 coinId + network
 * 从对账视图回填。这样列表里不会出现系统里不存在、或已软删除的币种。
 */
import type { CoinOnChainView } from '@/api/coin'
import type { ReconciliationAssetRowView } from './types'

/** 网络标识容错匹配：ethereum ↔ ethereum-sepolia、solana ↔ solana-testnet */
export function networkMatches(a: string, b: string): boolean {
  const na = a.toLowerCase()
  const nb = b.toLowerCase()
  if (na === nb) return true
  const base = (n: string) => n.split(/[-_]/)[0]
  return base(na) === base(nb)
}

/**
 * 用系统币种列表重建资产行：
 * 每个币种一行；能按 coinId + network 对上对账数据的沿用其指标，否则显示空指标。
 */
export function assetsFromCoinList(
  coins: CoinOnChainView[],
  rows: ReconciliationAssetRowView[]
): ReconciliationAssetRowView[] {
  return coins.map((coin) => {
    const matched = rows.find(
      (r) =>
        r.coinId.toUpperCase() === coin.coinId.toUpperCase() &&
        networkMatches(r.network, coin.network)
    )
    if (matched) {
      // 精度以系统币种配置为准（对账视图里的精度可能与线上配置不同）
      return { ...matched, coinId: coin.coinId, network: coin.network, decimals: coin.decimals }
    }
    return {
      coinId: coin.coinId,
      network: coin.network,
      decimals: coin.decimals,
      treasuryUnitCount: 0,
      accountCount: 0,
      lastClosedBalance: '0',
      lastClosedDate: '',
      unreconciledDays: 0
    }
  })
}

/** coinId@network → 图标地址 */
export function coinIconMap(coins: CoinOnChainView[]): Map<string, string> {
  const map = new Map<string, string>()
  coins.forEach((c) => {
    if (c.coinIconUrl) map.set(coinKey(c.coinId, c.network), c.coinIconUrl)
  })
  return map
}

export function coinKey(coinId: string, network: string): string {
  return `${coinId.toUpperCase()}@${network.toLowerCase()}`
}

/** 图标缺失/加载失败时的字母角标配色（token 定义见 tailwind.css） */
export function coinFallbackStyle(coinId: string): Record<string, string> {
  const id = coinId.toLowerCase()
  const known = ['usdt', 'usdc', 'btc', 'eth', 'sol', 'trx'].includes(id) ? id : 'default'
  return { background: `var(--coin-${known}-bg)`, color: `var(--coin-${known}-text)` }
}

/** 商户行汇总：资产数 / 阻塞数 / 最长与累计未对账天数，全部由资产行重新计算 */
export function assetRollup(rows: ReconciliationAssetRowView[]): {
  assetCount: number
  blockedAssets: number
  maxUnreconciledDays: number
  totalUnreconciledDays: number
} {
  const days = rows.map((r) => r.unreconciledDays)
  return {
    assetCount: rows.length,
    blockedAssets: days.filter((d) => d > 0).length,
    maxUnreconciledDays: days.length ? Math.max(...days) : 0,
    totalUnreconciledDays: days.reduce((sum, d) => sum + d, 0)
  }
}
