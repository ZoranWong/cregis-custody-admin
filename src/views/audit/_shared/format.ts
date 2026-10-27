// Accounting / Daily Reconciliation — 共用格式化工具
import BigNumber from 'bignumber.js'

/** 网络标识 → 展示名（与原型 "Ethereum Network" 一致） */
const NETWORK_LABELS: Record<string, string> = {
  ethereum: 'Ethereum Network',
  eth: 'Ethereum Network',
  bitcoin: 'Bitcoin Network',
  btc: 'Bitcoin Network',
  tron: 'Tron Network',
  trx: 'Tron Network',
  solana: 'Solana Network',
  sol: 'Solana Network'
}

export function networkLabel(network: string): string {
  return NETWORK_LABELS[network.toLowerCase()] ?? network
}

/** 原型资产图标配色：底色 + 文字色（取值定义在 tailwind.css，明暗各一套） */
const COIN_COLORS: Record<string, { bg: string; color: string; symbol: string }> = {
  USDT: { bg: 'var(--coin-usdt-bg)', color: 'var(--coin-usdt-text)', symbol: 'T' },
  USDC: { bg: 'var(--coin-usdc-bg)', color: 'var(--coin-usdc-text)', symbol: 'C' },
  BTC: { bg: 'var(--coin-btc-bg)', color: 'var(--coin-btc-text)', symbol: 'B' },
  ETH: { bg: 'var(--coin-eth-bg)', color: 'var(--coin-eth-text)', symbol: 'E' },
  SOL: { bg: 'var(--coin-sol-bg)', color: 'var(--coin-sol-text)', symbol: 'S' },
  TRX: { bg: 'var(--coin-trx-bg)', color: 'var(--coin-trx-text)', symbol: 'X' }
}

export function coinColor(coinId: string): { bg: string; color: string; symbol: string } {
  return (
    COIN_COLORS[coinId.toUpperCase()] ?? {
      bg: 'var(--coin-default-bg)',
      color: 'var(--coin-default-text)',
      symbol: coinId.slice(0, 1).toUpperCase()
    }
  )
}

/** 最小单位整数 → 主币种展示（千分位、自动去除多余尾零） */
export function formatBaseAmount(
  raw: string | number | null | undefined,
  decimals: number
): string {
  if (raw === null || raw === undefined || raw === '') return '—'
  const value = new BigNumber(raw).div(new BigNumber(10).pow(decimals))
  if (value.isNaN()) return '—'
  return value.toFormat()
}

/** 展示用余额：ETH 等 18 位精度的币最多显示 6 位小数，去除多余尾部 0 */
export function formatBaseAmountDisplay(
  raw: string | number | null | undefined,
  decimals: number
): string {
  if (raw === null || raw === undefined || raw === '') return '—'
  const value = new BigNumber(raw).div(new BigNumber(10).pow(decimals))
  if (value.isNaN()) return '—'
  const maxDec = Math.min(6, decimals)
  const fixed = value.toFixed(maxDec, BigNumber.ROUND_DOWN)
  const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '')
  return new BigNumber(trimmed || '0').toFormat()
}

/** 2026-10-19 → Oct 19 */
export function formatShortDate(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(`${date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
}

/** 2026-10-19 → Oct 19, 2026 */
export function formatLongDate(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(`${date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`
}

/** 最近关闭日距今几天（0 = 今天）；无法解析时返回 null */
export function daysSince(date: string | null | undefined, today: string): number | null {
  if (!date) return null
  const from = new Date(`${date.slice(0, 10)}T00:00:00`).getTime()
  const to = new Date(`${today.slice(0, 10)}T00:00:00`).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return null
  return Math.max(0, Math.round((to - from) / 86_400_000))
}

/** 交易活动码 → 可读文案：TRANSFER_IN → Transfer In */
export function activityLabel(activity: string): string {
  if (!activity) return '—'
  return activity
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
