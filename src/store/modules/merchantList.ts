/**
 * 商户管理列表状态（跨页面保留）。
 *
 * 搜索条件、分页放到全局状态而不是 URL：从详情页返回时条件与页码仍生效，
 * 刷新页面则回到默认条件（URL 里只保留 tab）。
 */
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export type MerchantListTab = 'applications' | 'list'

export interface MerchantApplicationState {
  /** 商户名模糊搜索 */
  merchantName: string
  page: number
  pageSize: number
}

export interface MerchantListState {
  /** 商户状态：ACTIVE / FROZEN / CANCELLED，空串为全部 */
  status: string
  /** 商户名模糊搜索 */
  merchantName: string
  sort: 'recent' | 'name_asc'
  page: number
  pageSize: number
}

export const useMerchantListStore = defineStore('merchantList', () => {
  const activeTab = ref<MerchantListTab>('applications')

  const applications = reactive<MerchantApplicationState>({
    merchantName: '',
    page: 1,
    pageSize: 10
  })

  const list = reactive<MerchantListState>({
    status: '',
    merchantName: '',
    sort: 'recent',
    page: 1,
    pageSize: 10
  })

  return {
    activeTab,
    applications,
    list
  }
})
