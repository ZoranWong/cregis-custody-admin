/**
 * 企业主体类型（entityType）展示文案。
 *
 * 商户列表与商户详情共用，避免两处各写一份映射后出现
 * 「列表 Non-Financial Corporate / 详情 LLC」这类不一致。
 */

const ENTITY_TYPE_LABELS: Record<string, string> = {
  NON_FINANCIAL_CORPORATE: 'Non-Financial Corporate',
  REGULATED_VASP: 'Regulated VASP',
  INTERNAL_SYSTEM: 'Internal System'
}

/** 需要整体大写的常见缩写：llc → LLC、ltd → LTD */
const ACRONYMS = new Set(['llc', 'ltd', 'inc', 'plc', 'ngo', 'vasp', 'llp'])

export function entityTypeLabel(value?: string | null): string {
  const s = (value || '').trim()
  if (!s) return '-'
  if (ENTITY_TYPE_LABELS[s]) return ENTITY_TYPE_LABELS[s]
  // 未匹配的值转标题大小写：partnership → Partnership，llc → LLC
  return s
    .split('_')
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase()
      if (ACRONYMS.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}
