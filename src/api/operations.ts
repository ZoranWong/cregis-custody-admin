import { apiRequest } from '@/utils/http/request'
import type {
  OpsHomeSurfaceView,
  OpsMerchantDetailView,
  OpsMerchantListResponse,
  OpsMerchantNotificationRecordView,
  OperationsCustomerStatusChartView,
  OperationsServicePulseChartView,
  OperationsSummaryView,
  OperationsTaskView,
  PageResult
} from '@/types/models'
export {
  createOnboardingCommunication,
  fetchOnboardingApplicationDetail,
  fetchOnboardingApplications,
  fetchOnboardingMerchantManagementLink,
  fetchOnboardingTicketLink,
  refreshOnboardingCase,
  sendOnboardingSupplementReminder
} from '@/api/onboarding'
export type { OnboardingCommunicationRequest, OnboardingQuery } from '@/api/onboarding'

export interface OpsMerchantQuery {
  search?: string
  status?: string
  tier?: string
  expiryRange?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface OpsMerchantNotificationRequest {
  type: string
  title: string
  content: string
}

function toQueryString(
  values: Record<string, string | number | boolean | undefined | null>
): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function fetchOperationsSummary(): Promise<OperationsSummaryView> {
  return apiRequest<OperationsSummaryView>('/api/v1/operations/summary') as any
}

export function fetchOperationsTaskQueue(): Promise<PageResult<OperationsTaskView>> {
  return apiRequest<PageResult<OperationsTaskView>>(
    '/api/v1/operations/task-queue?pageNum=1&pageSize=8'
  ) as any
}

export function fetchOperationsCustomerStatusChart(): Promise<OperationsCustomerStatusChartView> {
  return apiRequest<OperationsCustomerStatusChartView>(
    '/api/v1/operations/charts/customer-status'
  ) as any
}

export function fetchOperationsServicePulseChart(): Promise<OperationsServicePulseChartView> {
  return apiRequest<OperationsServicePulseChartView>(
    '/api/v1/operations/charts/service-pulse'
  ) as any
}

export function fetchOpsHomeSurface(): Promise<OpsHomeSurfaceView> {
  return apiRequest<OpsHomeSurfaceView>('/api/v1/ops/home/surface') as any
}

export function fetchOpsMerchants(query: OpsMerchantQuery): Promise<OpsMerchantListResponse> {
  return apiRequest<OpsMerchantListResponse>(
    `/api/v1/operations/merchants${toQueryString({
      search: query.search,
      status: query.status,
      tier: query.tier,
      expiryRange: query.expiryRange,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize
    })}`
  ) as any
}

export function fetchOpsMerchantDetail(merchantId: string): Promise<OpsMerchantDetailView> {
  return apiRequest<OpsMerchantDetailView>(
    `/api/v1/operations/merchants/${encodeURIComponent(merchantId)}`
  ) as any
}

export function sendOpsMerchantNotification(
  merchantId: string,
  request: OpsMerchantNotificationRequest
): Promise<OpsMerchantDetailView> {
  return apiRequest<OpsMerchantDetailView>(
    `/api/v1/operations/merchants/${encodeURIComponent(merchantId)}/notifications`,
    { method: 'POST', body: request }
  ) as any
}

export function fetchOpsNotifications(): Promise<OpsMerchantNotificationRecordView[]> {
  return apiRequest<OpsMerchantNotificationRecordView[]>('/api/v1/operations/notifications') as any
}
