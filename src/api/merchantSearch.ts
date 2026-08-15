// @ts-nocheck
import { apiRequest } from '@/utils/http/request'

export interface MerchantSearchQuery {
  merchantName?: string
  pageIndex?: number
  pageSize?: number
}

export interface MerchantListItemView {
  id: number
  code: string
  merchantName: string
}

export interface MerchantListResponseView {
  records: MerchantListItemView[]
  total: number
  current: number
}

export function fetchMerchantList(
  query: MerchantSearchQuery = {}
): Promise<MerchantListResponseView> {
  return apiRequest<MerchantListResponseView>('/merchant/list', {
    method: 'POST',
    body: {
      pageIndex: query.pageIndex ?? 1,
      pageSize: query.pageSize ?? 20,
      queryList: query.merchantName
        ? [{ key: 'merchantName', value: query.merchantName, oper: ':' }]
        : []
    }
  })
}
