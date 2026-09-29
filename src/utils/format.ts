import { translateUiText } from '@/utils/text'
import BigNumber from 'bignumber.js'

const datetimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return datetimeFormatter.format(date)
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

/** 将 ISO 时间字符串格式化为 "YYYY-MM-DD HH:MM:SS"，常用于表格中的等宽时间显示 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
