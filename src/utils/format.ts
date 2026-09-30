import { translateUiText } from '@/utils/text'
import BigNumber from 'bignumber.js'

/**
 * 统一时间格式："2026-09-21 15:42"（到分钟，浏览器本地时区）。
 *
 * 接口返回的时间串（如 "2026-09-21T15:42:31"）为 UTC 存储，
 * 无时区后缀时补 Z 再解析，保证按本地时区正确换算显示。
 */
function formatLocalMinute(input: string): string {
  // 无时区后缀的 UTC 串：补 Z 后按本地时区解析
  const normalized = /[Zz]|[+-]\d{2}:?\d{2}$/.test(input) ? input : `${input.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return input
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** "2026-09-21 15:42"（到分钟，本地时区） */
export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-'
  }
  return formatLocalMinute(value)
}

export function formatRecoveryCodes(value?: string | null): string {
  if (!value) {
    return '-'
  }
  return value
    .split(/[\s,]+/)
    .filter(Boolean)
    .join('\n')
}

export function normalizeBearer(value?: string | null): string {
  if (!value) {
    return ''
  }
  return value.replace(/^Bearer\s+/i, '').trim()
}

export function resolveRoleLabel(roles?: string[]): string {
  const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : 'OPERATIONS'
  switch (role.toUpperCase()) {
    case 'ADMIN':
    case 'ADMINISTRATOR':
    case 'SYSTEM_OWNER':
      return 'Administrator'
    case 'SYSTEM_ADMIN':
      return 'System Administrator'
    case 'SYSTEM_STAFF':
      return 'System Staff'
    default:
      return translateUiText(role.replace(/_/g, ' '))
  }
}

export function badgeTone(
  value?: string | null
): 'success' | 'warn' | 'danger' | 'info' | 'neutral' {
  const normalized = (value || '').toLowerCase()
  if (
    normalized.includes('approve') ||
    normalized.includes('active') ||
    normalized.includes('complete') ||
    normalized.includes('configured')
  ) {
    return 'success'
  }
  if (
    normalized.includes('reject') ||
    normalized.includes('overdue') ||
    normalized.includes('closed') ||
    normalized.includes('blocked')
  ) {
    return 'danger'
  }
  if (
    normalized.includes('supplement') ||
    normalized.includes('manual') ||
    normalized.includes('near')
  ) {
    return 'warn'
  }
  if (
    normalized.includes('review') ||
    normalized.includes('provider') ||
    normalized.includes('pending')
  ) {
    return 'info'
  }
  return 'neutral'
}

export function formatCoinBalance(raw: string | null | undefined, decimals: number): string {
  if (!raw) return '0'
  const num = new BigNumber(raw).div(new BigNumber(10).pow(decimals))
  if (num.isNaN()) return '0'
  if (num.isZero()) return '0'
  const formatted = num.toFixed(decimals)
  const trimmed = formatted.replace(/0+$/, '').replace(/\.$/, '')
  return trimmed || '0'
}

/** 原型统一时间格式："Sep 21, 2026 at 15:42 UTC"（到分钟 + 时区），全站列表/详情共用 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  return formatLocalMinute(iso)
}

/**
 * 构建 tx hash 的区块链浏览器 URL（规则与 custody-manager 的 buildTxLink 同源）。
 * 未知网络回退 etherscan；tx 或 network 为空返回 ''（调用方按纯文本渲染）。
 */
export function buildTxLink(tx: string, network: string): string {
  if (!tx || !network) return ''
  const hash = tx.replaceAll('"', '')
  if (network.includes('sepolia')) {
    return `https://sepolia.etherscan.io/tx/${hash}`
  }
  if (network.includes('goerli')) {
    return `https://goerli.etherscan.io/tx/${hash}`
  }
  if (network.includes('optimism')) {
    return `https://optimistic.etherscan.io/tx/${hash}`
  }
  if (network.includes('arbitrum')) {
    return `https://arbiscan.io/tx/${hash}`
  }
  if (network.includes('bsc')) {
    return `https://bscscan.com/tx/${hash}`
  }
  if (network.includes('polygon')) {
    return `https://polygonscan.com/tx/${hash}`
  }
  if (network.includes('zkSync')) {
    return `https://zkscan.io/explorer/tx/${hash}`
  }
  if (network.includes('base')) {
    return `https://basescan.org/tx/${hash}`
  }
  if (network.includes('linea')) {
    return `https://explorer.linea.build/tx/${hash}`
  }
  if (network.includes('mantle')) {
    return `https://explorer.mantlenetwork.io/tx/${hash}`
  }
  if (network.includes('zkEVM')) {
    return `https://explorer.public.zkevm-test.net/tx/${hash}`
  }
  if (network.includes('tron') && network.includes('nile')) {
    return `https://nile.tronscan.org/#/transaction/${hash}`
  }
  if (network.includes('tron')) {
    return `https://tronscan.org/#/transaction/${hash}`
  }
  if (network.includes('sui') && network.includes('testnet')) {
    return `https://suiscan.xyz/testnet/tx/${hash}`
  }
  if (network.includes('sui')) {
    return `https://suiscan.xyz/mainnet/tx/${hash}`
  }
  return `https://etherscan.io/tx/${hash}`
}

/** 截断长 hex 字符串（地址、tx hash），默认前 6 后 4；可指定前后长度 */
export function compactHex(value: string | null | undefined, prefixLen = 6, suffixLen = 4): string {
  if (!value) return '-'
  const minLen = prefixLen + suffixLen + 3
  if (value.length <= minLen) return value
  return `${value.slice(0, prefixLen)}...${value.slice(-suffixLen)}`
}

/** 将 [Date, Date] 范围格式化为 { from, to }，格式 "YYYY-MM-DD" */
export function formatDateRangeValue(range: [Date, Date]): { from: string; to: string } {
  const [from, to] = range
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`
  }
}

/** 将币种基础单位数值格式化为 Gwei，如 1999000000 wei → "1.999 Gwei" */
export function formatGasFee(raw: string | number, baseUnitName: string): string {
  const num = typeof raw === 'string' ? Number(raw) : raw
  if (!num || num === 0) return `0 G${baseUnitName}`
  const scaled = num / 1e9
  const s = String(scaled)
  // 去掉小数部分尾部的无效 0（仅影响 . 之后），如 "1.200" → "1.2"，"10000" 不变
  const cleaned = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  return `${cleaned} G${baseUnitName}`
}
