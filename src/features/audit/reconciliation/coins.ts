/**
 * Daily Reconciliation — 资产行工具。
 *
 * 后端日终对账接口就绪前，资产行以 mock 数据为准（不请求 `/coin/list`，
 * 接口不可用时列表也能完整展示）；系统币种列表只用于补充资产图标。
 * 接口接入后可改用 assetsFromCoinList 以系统 coin 列表重建资产行。
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

/**
 * 从资产行里解析详情页要展示的资产。
 *
 * URL 里的 coinId / network 可能不是 mock 资产（系统 coin 列表与 mock 币种不一致，
 * 或手动拼的链接），此时按「精确匹配 → 同 coinId → 第一个资产」降级，避免详情页空白。
 */
export function resolveReconciliationAsset(
  rows: ReconciliationAssetRowView[],
  coinId: string,
  network: string
): ReconciliationAssetRowView | null {
  if (!rows.length) return null
  const id = coinId.toUpperCase()
  return (
    rows.find((r) => r.coinId.toUpperCase() === id && networkMatches(r.network, network)) ??
    rows.find((r) => r.coinId.toUpperCase() === id) ??
    rows[0]!
  )
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
