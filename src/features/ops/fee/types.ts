// Fee Monitor – all TypeScript types for the fee operations module.
export interface FeeOverviewView {
  feeCollectedUsdt: number
  txCount: number
  avgFeePerTxUsdt: number
}

export interface FeeRankingItemView {
  rank: number
  transferEcode: string
  ecode: string
  merchantName: string
  network: string
  feeAmount: number
  feeUsdt: number
  txCount: number
}

export interface FeeRankingResponseView {
  records: FeeRankingItemView[]
  current: number
  size: number
  pages: number
  total: number
}

export interface FeeMerchantDailyItemView {
  statDate: string
  feeCollectedUsdt: number
  txCount: number
  avgFeePerTxUsdt: number
}

export interface FeeMerchantDailyResponseView {
  records: FeeMerchantDailyItemView[]
  current: number
  size: number
  pages: number
  total: number
}

export interface NativeCoinConsumptionView {
  network: string
  nativeCoin: string
  totalConsumed: string
  txCount: number
  avgPerTx: string
}

export interface PlatformGasConfigView {
  id?: number
  network: string
  gasPerTx: number
  referenceGas: number
  exchangeRate: number
  platformDiscount: number
  finalFeePerTx: number
  createdTime?: string
  updatedTime?: string
}

export interface MerchantGasConfigView {
  id?: number
  ecode: string
  merchantName?: string
  network: string
  gasPerTx: number
  referenceGas: number
  exchangeRate: number
  discount: number
  finalFeePerTx: number
  createdTime?: string
  updatedTime?: string
}

export interface GasCostItemView {
  id: number
  ecode: string
  merchantName: string
  projectId: number
  network: string
  coinId: string
  txId: string
  amount: string
  createTime: string
}

export interface GasCostResponseView {
  records: GasCostItemView[]
  total: number
  current: number
  pages: number
  size: number
}

export interface GasTopupRecordView {
  id: number
  ecode: string
  merchantName: string
  amount: string
  chainNetwork: string
  txHash: string
  creditBalance: string
  status: string
  createTime: string
}

export interface GasTopupRecordResponseView {
  records: GasTopupRecordView[]
  total: number
  current: number
  pages: number
  size: number
}

export interface TopUpOverviewView {
  balance: string
  topUpBalance: string
  topUpRecords: number
}

export interface MerchantBillingRecordView {
  id: number
  orderId: string
  coinId: string
  network: string
  amount: number
  txCount: number
  direction: string
  txId: string
  discount: number
  address: string
  transferEcode: string
  type: string
  remark: string
  createTime: string
}

export interface MerchantBillingRecordResponseView {
  records: MerchantBillingRecordView[]
  total: number
  current: number
  pages: number
  size: number
}
