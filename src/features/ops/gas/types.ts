export type GasHealthState =
  | 'healthy'
  | 'low_balance'
  | 'missing_account'
  | 'auto_top_up_disabled'
  | 'top_up_failed'
  | 'top_up_pending_or_stale'
  | 'stale_source'
  | 'unknown'
  | 'not_available'

export type GasSourceStatus = 'ok' | 'degraded' | 'unavailable' | 'not_revived'
export type GasTopUpStatus =
  | 'submitted'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'fulfilled_recorded'
  | 'unknown'

export interface GasOperationsSourceAvailabilityView {
  sourceFamily: string
  sourceStatus: GasSourceStatus
  lastCheckedAt: string
  reason: string
}

export interface GasOperationsCapabilityView {
  canReadGasOperations: boolean
  canUpdateConfiguration: boolean
  manualTopUpAvailable: false
  manualTopUpBlockedReason: 'not_confirmed_in_p0_contract'
}

export interface GasOperationsFilterOptionsView {
  networkOptions: string[]
  coinOptions: string[]
  healthStateOptions: GasHealthState[]
  sourceStatusOptions: GasSourceStatus[]
  topUpStatusOptions: GasTopUpStatus[]
  taskTypeOptions: GasHomeTaskType[]
}

export interface GasOperationsFoundationView {
  moduleId: 'gas_operations'
  canonicalApiRoot: '/v1/ops/gas'
  defaultRoute: '/gas-operations'
  capabilities: GasOperationsCapabilityView
  filterOptions: GasOperationsFilterOptionsView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export interface GasOperationsPaginationView {
  page: number
  totalPages: number
  totalCount: number
}

export interface GasHealthView {
  healthState: GasHealthState
  healthReason: string
  healthPriority: number
  recommendedAction: string
  evaluatedAt: string
}

export interface GasAccountStatsView {
  cusAccountId: number
  vaultAccountId: string
  ecode: string
  merchantName: string
  projectId: number
  coinId: string
  network: string
  address: string
  balance: string
  threshold: string
  totalTransfers: number
  totalRefills: number
  transfersPerRefillAvg: number
  refillsPerDayAvg: number
}

export interface GasAccountSummaryView {
  gasAccountRef: string
  gasConfigRef: string | null
  ecode: string
  merchantName: string | null
  projectId: number | null
  cusAccountId: number
  accountId: string | null
  vaultAccountId: string | null
  coinId: string
  network: string
  address: string | null
  balance: string | null
  threshold: string | null
  amountPerTopUp: string | null
  usdtBalance: string | null
  autoTopUpEnabled: boolean | 'not_available'
  lastConsumedAt: string | null
  lastTopUpAt: string | null
  health: GasHealthView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export type GasHomeTaskType =
  | 'low_balance'
  | 'top_up_failed'
  | 'stale_top_up'
  | 'source_unavailable'
  | 'missing_account'
  | 'unknown_evidence'
  | 'usdt_low_balance'

export type GasHomeSeverity = 'action_needed' | 'degraded' | 'unknown' | 'not_available'
export type GasHomeTargetRouteRef =
  | 'account_detail'
  | 'consumption_ledger'
  | 'top_up_records'
  | 'configuration_guardrails'
export type GasHomeActivityType = 'submitted' | 'processing' | 'succeeded' | 'failed' | 'unknown'
export type GasHomeLookupMatchedField =
  | 'merchant_name'
  | 'ecode'
  | 'project_id'
  | 'project_name'
  | 'gas_address'
  | 'gas_account_ref'
  | 'account_id'
  | 'vault_account_id'
  | 'network'
  | 'coin_id'

export interface GasHomeStatusSummaryView {
  actionNeededCount: number
  degradedCount: number
  unknownCount: number
  notAvailableCount: number
  allClear: boolean
  lastSyncedAt: string
  sourceStatus: GasSourceStatus
}

export interface GasHomeLookupEvidenceView {
  matchedField: GasHomeLookupMatchedField
  matchedValue: string
  displayLabel: string
}

export interface GasHomeLookupMatchView {
  gasAccountRef: string
  matchedFields: GasHomeLookupMatchedField[]
  matchEvidence: GasHomeLookupEvidenceView[]
  matchLabels: string[]
  matchRank: number
  matchReason: string
}

export interface GasHomeLookupView {
  query: string | null
  supportedMatchFields: GasHomeLookupMatchedField[]
  matchedCount: number
  matches: GasHomeLookupMatchView[]
}

export interface GasHomeTaskView {
  taskRef: string
  taskType: GasHomeTaskType
  severity: GasHomeSeverity
  gasAccountRef: string | null
  ecode: string
  merchantName: string | null
  projectId: number | null
  cusAccountId: number
  network: string | null
  coinId: string | null
  address: string | null
  title: string
  reason: string
  lastSignalAt: string | null
  targetRouteRef: GasHomeTargetRouteRef
}

export interface GasHomeRealtimeStatusView {
  autoTopUpProcessingCount: number
  staleTopUpCount: number
  lastSourceCheckAt: string
}

export interface GasHomeActivityView {
  activityRef: string
  activityType: GasHomeActivityType
  gasAccountRef: string | null
  merchantName: string | null
  projectId: number | null
  businessType: string | null
  businessRef: string | null
  network: string | null
  coinId: string | null
  txId: string | null
  status: GasTopUpStatus | GasSourceStatus | null
  gasAmount: string | null
  occurredAt: string
  targetRouteRef: GasHomeTargetRouteRef
}

export interface GasHomeActivityListView {
  items: GasHomeActivityView[]
  pagination: GasOperationsPaginationView
}

export interface GasNeedsAttentionResponseView {
  records: GasHomeTaskView[]
  total: number
  size: number
  current: number
}

export interface GasAccountListView {
  records: GasAccountStatsView[]
  total: number
  size: number
  current: number
}

export interface GasOverviewResponseView {
  summary: GasHomeStatusSummaryView
  lookup: GasHomeLookupView
  needsAttention: GasHomeTaskView[]
  realtimeStatus: GasHomeRealtimeStatusView
  recentActivity: GasHomeActivityListView
  accountList: GasAccountListView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export interface GasConfigurationCapabilityView {
  canUpdateConfiguration: boolean
  canManualTopUp: false
}

export interface GasConfigurationItemView {
  gasConfigRef: string
  ecode: string
  merchantName: string | null
  address: string
  coinId: string
  network: string
  threshold: string
  amountPerTopUp: string
  autoTopUpEnabled: boolean | 'not_available'
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export interface GasConfigurationListView {
  items: GasConfigurationItemView[]
  capabilities: GasConfigurationCapabilityView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export interface GasConfigurationChangeView {
  configurationChangeId: string
  gasConfigRef: string
  state: 'applied'
  previousThreshold: string | null
  previousAmountPerTopUp: string | null
  threshold: string
  amountPerTopUp: string
  operatorId: string
  submittedAt: string
  operationTraceRef: string
}

export interface GasConfigurationUpdatedView {
  gasConfigRef: string
  threshold: string
  amountPerTopUp: string
}

export interface GasConfigurationUpdateResponseView {
  configurationChange: GasConfigurationChangeView
  updatedConfiguration: GasConfigurationUpdatedView
}

export interface GasLatestConsumptionView {
  gasCostId: number
  txId: string
  amount: string
  network: string
  coinId: string
  createTime: string
}

export interface GasLatestTopUpView {
  topUpRef: string
  topUpType: 'order' | 'record'
  status: GasTopUpStatus
  amount: string | null
  cost: string | null
  address: string
  createdAt: string
}

export interface GasAccountDetailView {
  account: GasAccountSummaryView
  latestConsumption: GasLatestConsumptionView | null
  latestTopUp: GasLatestTopUpView | null
  configurationCapabilities: GasOperationsCapabilityView
}

export interface GasConsumptionItemView {
  gasCostId: number
  ecode: string
  merchantName: string | null
  projectId: number | null
  cusAccountId: number
  network: string
  coinId: string
  txId: string
  fromAddress: string
  toAddress: string
  amount: number
  amountDisplay: string
  sourceFamily: string
  createTime: string
  txLinkAvailable: boolean
}

export interface GasConsumptionResponseView {
  items: GasConsumptionItemView[]
  pagination: GasOperationsPaginationView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}

export interface GasTopUpItemView {
  topUpRef: string
  topUpType: 'order' | 'record'
  topUpOrderId: number | null
  topUpRecordId: number | null
  ecode: string
  merchantName: string | null
  coinId: string
  network: string
  address: string
  txId: string | null
  amount: string | null
  cost: string | null
  status: GasTopUpStatus
  isStale: boolean
  createdAt: string
  updatedAt: string | null
  sourceFamily: 'fulfill_order' | 'fulfill_record'
}

export interface GasTopUpResponseView {
  items: GasTopUpItemView[]
  pagination: GasOperationsPaginationView
  filterOptions: GasOperationsFilterOptionsView
  sourceAvailability: GasOperationsSourceAvailabilityView[]
}
