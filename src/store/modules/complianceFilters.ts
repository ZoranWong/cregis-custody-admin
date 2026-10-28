/**
 * 合规模块筛选状态（跨页面保留）。
 *
 * 三个列表页的筛选条件放在全局 Pinia：从详情页返回时无需重新输入即可沿用，
 * 刷新页面则回到默认条件。
 */
import { defineStore } from 'pinia'
import { reactive } from 'vue'

// ─── Transaction Lens ───

export interface TxLensFilters {
  /** 选中商户 ecode；配套 `merchantName` 用于返回详情页时下拉框显示企业名称 */
  merchant: string
  merchantName?: string
  dateRange: string[]
  direction: string
  compliance: string
  travelRule: string
  signOff: string
  onChain: string
  fundDisposition: string
  reviewResult: string
  pageNum: number
  pageSize: number
}

// ─── Compliance Alerts (queue) ───

export interface ComplianceAlertFilters {
  merchantEcode: string
  merchantName?: string
  direction: string
  decision: string
  dispositionStatus: string
  pageIndex: number
  pageSize: number
}

// ─── Travel Rule Workbench ───

export interface TravelRuleFilters {
  merchant: string
  merchantName?: string
  dateFrom: '' | Date
  search: string
  direction: string
  status: string
  page: number
  pageSize: number
}

export const useComplianceFilterStore = defineStore('complianceFilters', () => {
  const txLens = reactive<TxLensFilters>({
    merchant: '',
    dateRange: [],
    direction: '',
    compliance: '',
    travelRule: '',
    signOff: '',
    onChain: '',
    fundDisposition: '',
    reviewResult: '',
    pageNum: 1,
    pageSize: 10
  })

  const alerts = reactive<ComplianceAlertFilters>({
    merchantEcode: '',
    direction: '',
    decision: '',
    dispositionStatus: '',
    pageIndex: 1,
    pageSize: 20
  })

  const travelRule = reactive<TravelRuleFilters>({
    merchant: '',
    merchantName: '',
    dateFrom: '',
    search: '',
    direction: '',
    status: '',
    page: 1,
    pageSize: 10
  })

  function resetTxLens(): void {
    txLens.merchant = ''
    txLens.dateRange = []
    txLens.direction = ''
    txLens.compliance = ''
    txLens.travelRule = ''
    txLens.signOff = ''
    txLens.onChain = ''
    txLens.fundDisposition = ''
    txLens.reviewResult = ''
    txLens.pageNum = 1
    txLens.pageSize = 10
  }

  function resetAlerts(): void {
    alerts.merchantEcode = ''
    alerts.direction = ''
    alerts.decision = ''
    alerts.dispositionStatus = ''
    alerts.pageIndex = 1
    alerts.pageSize = 20
  }

  function resetTravelRule(): void {
    travelRule.merchant = ''
    travelRule.dateFrom = ''
    travelRule.search = ''
    travelRule.direction = ''
    travelRule.status = ''
    travelRule.page = 1
    travelRule.pageSize = 10
  }

  return {
    txLens,
    alerts,
    travelRule,
    resetTxLens,
    resetAlerts,
    resetTravelRule
  }
})
