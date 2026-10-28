/**
 * Gas Operations 列表状态（跨页面保留）。
 *
 * 搜索条件与分页放到全局状态而不是 URL：从详情页返回时条件与页码仍生效，
 * 刷新页面则回到默认条件（URL 里只保留 tab）。
 */
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export type GasTab = 'overview' | 'accounts'

/** Needs Attention 筛选 + 分页 */
export interface GasNeedsAttentionState {
  merchantName: string
  taskType: string
  network: string
  page: number
  pageSize: number
}

/** Recent Activities 筛选 + 分页 */
export interface GasRecentActivitiesState {
  merchantName: string
  event: string
  network: string
  page: number
  pageSize: number
}

/** Accounts 筛选 + 分页 */
export interface GasAccountsState {
  merchantName: string
  page: number
  pageSize: number
}

export const useGasOperationsStore = defineStore('gasOperations', () => {
  const activeTab = ref<GasTab>('overview')

  const needsAttention = reactive<GasNeedsAttentionState>({
    merchantName: '',
    taskType: '',
    network: '',
    page: 1,
    pageSize: 10
  })

  const recentActivities = reactive<GasRecentActivitiesState>({
    merchantName: '',
    event: '',
    network: '',
    page: 1,
    pageSize: 10
  })

  const accounts = reactive<GasAccountsState>({
    merchantName: '',
    page: 1,
    pageSize: 10
  })

  function resetNeedsAttention(): void {
    needsAttention.merchantName = ''
    needsAttention.taskType = ''
    needsAttention.network = ''
    needsAttention.page = 1
    needsAttention.pageSize = 10
  }

  function resetRecentActivities(): void {
    recentActivities.merchantName = ''
    recentActivities.event = ''
    recentActivities.network = ''
    recentActivities.page = 1
    recentActivities.pageSize = 10
  }

  function resetAccounts(): void {
    accounts.merchantName = ''
    accounts.page = 1
    accounts.pageSize = 10
  }

  return {
    activeTab,
    needsAttention,
    recentActivities,
    accounts,
    resetNeedsAttention,
    resetRecentActivities,
    resetAccounts
  }
})
