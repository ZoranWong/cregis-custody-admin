/**
 * v2 store — 国家/地区元数据
 *
 * 按当前 locale 动态加载对应语言的国家列表（只加载当前语言，不一次加载全部）。
 * 提供 ISO 国家代码 → 名称 的映射。
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

interface CountryItem {
  code: string
  name: string
}

export const useCountryStore = defineStore(
  'country',
  () => {
    const map = ref<Record<string, string>>({})
    /** 当前已加载的 locale，避免重复加载 */
    const loadedLocale = ref('')

    async function ensureLoaded(locale: string): Promise<void> {
      if (loadedLocale.value === locale && Object.keys(map.value).length > 0) return
      try {
        // 按需动态 import 对应语言，只加载当前语言的数据
        const mod =
          locale === 'zh'
            ? await import('@/data/countries-zh.json')
            : await import('@/data/countries-en.json')
        const list = (mod.default ?? []) as CountryItem[]
        const next: Record<string, string> = {}
        for (const c of list) next[c.code] = c.name
        map.value = next
        loadedLocale.value = locale
      } catch {
        map.value = {}
      }
    }

    /** 国家代码 → 名称（未知代码原样返回） */
    function countryName(code: string): string {
      return map.value[code] || code
    }

    return {
      map,
      loadedLocale,
      ensureLoaded,
      countryName
    }
  },
  { persist: false }
)
