/**
 * 商户详情页展示文案（页头与各面板共用）。
 *
 * 问卷里的 primaryActivity 是枚举（financial_services 等），页头 Business Type 与
 * 初审问卷的 Business Activity 必须用同一套映射，避免一处显示译文、一处显示原始值。
 */
import { entityTypeLabel } from './entityType'

type Translate = (key: string) => string

/** 主营业务（primaryActivity 枚举）→ 展示文案；缺译文时原样展示，不强行转标题大小写 */
export function primaryActivityLabel(value: string | null | undefined, t: Translate): string {
  const s = (value || '').trim()
  if (!s) return ''
  const key = `merchantDetail.primaryActivity_${s}`
  const translated = t(key)
  return translated === key ? s : translated
}

/**
 * 页头 Business Type：Business Activity 优先，缺失时回退问卷主体类型、再回退平台侧 merchantType。
 * 全部缺失返回空串，由调用方隐藏该项（避免显示「-」）。
 */
export function businessTypeLabel(
  source: {
    primaryActivity?: string | null
    entityType?: string | null
    merchantType?: string | null
  },
  t: Translate
): string {
  const activity = primaryActivityLabel(source.primaryActivity, t)
  if (activity) return activity

  if (source.entityType) return entityTypeLabel(source.entityType)

  const merchantType = (source.merchantType || '').trim()
  if (!merchantType) return ''
  const map: Record<string, string> = {
    NON_FINANCIAL_CORPORATE: 'Non-Financial Corporate',
    REGULATED_VASP: 'Regulated VASP',
    INTERNAL_SYSTEM: 'Internal System'
  }
  return map[merchantType] || merchantType
}
