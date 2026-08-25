import { computed, onMounted, reactive, ref } from 'vue'
import {
  fetchGasAccountDetail,
  fetchGasAccounts,
  fetchGasConfiguration,
  fetchGasConsumption,
  fetchGasNeedsAttention,
  fetchGasOperationsFoundation,
  fetchGasRecentActivities,
  fetchGasTopUps,
  updateGasConfiguration,
  type GasAccountDetailParams,
  type GasAccountsQuery,
  type GasConfigurationQuery,
  type GasConfigurationUpdatePayload,
  type GasConsumptionQuery,
  type GasNeedsAttentionQuery,
  type GasRecentActivitiesQuery,
  type GasTopUpQuery
} from '@/api/operationsGas'
import { useUiStore } from '@/store/modules/ui'
import type {
  GasAccountDetailView,
  GasAccountListView,
  GasAccountSummaryView,
  GasConfigurationListView,
  GasConsumptionResponseView,
  GasHomeActivityListView,
  GasNeedsAttentionResponseView,
  GasOperationsFoundationView,
  GasTopUpResponseView
} from '@/features/ops/gas/types'

const DEFAULT_PAGE_SIZE = 10

export function useGasOperations(
  initial: Partial<GasNeedsAttentionQuery & GasConsumptionQuery & GasTopUpQuery> = {}
) {
  const uiStore = useUiStore()
  const loading = ref(false)
  const naLoading = ref(false)
  const raLoading = ref(false)
  const acLoading = ref(false)
  const errorMessage = ref('')
  const detailLoading = ref(false)
  const foundation = ref<GasOperationsFoundationView | null>(null)
  const needsAttention = ref<GasNeedsAttentionResponseView | null>(null)
  const recentActivities = ref<GasHomeActivityListView | null>(null)
  const accounts = ref<GasAccountListView | null>(null)
  const configuration = ref<GasConfigurationListView | null>(null)
  const consumption = ref<GasConsumptionResponseView | null>(null)
  const topUps = ref<GasTopUpResponseView | null>(null)
  const selectedDetail = ref<GasAccountDetailView | null>(null)
  const lastConfigurationTraceRef = ref('')

  const needsAttentionFilters = reactive<GasNeedsAttentionQuery>({
    query: '',
    ecode: '',
    merchantName: '',
    projectId: undefined,
    network: '',
    coinId: '',
    healthState: '',
    sourceStatus: '',
    taskType: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortField: 'health_priority',
    sortDirection: 'desc',
    ...initial
  })

  const accountsFilters = reactive<GasAccountsQuery>({
    ecode: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ...initial
  })

  const recentActivitiesFilters = reactive<GasRecentActivitiesQuery>({
    ecode: '',
    network: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  })

  const consumptionFilters = reactive<GasConsumptionQuery>({
    cusAccountId: undefined,
    txId: '',
    startTime: '',
    endTime: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortDirection: 'desc',
    ...initial
  })

  const topUpFilters = reactive<GasTopUpQuery>({
    ecode: '',
    network: '',
    coinId: '',
    address: '',
    status: '',
    startTime: '',
    endTime: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortDirection: 'desc',
    ...initial
  })
  const configurationFilters = reactive<GasConfigurationQuery>({
    ecode: '',
    network: '',
    coinId: ''
  })

  const capabilities = computed(() => ({
    canReadGasOperations: true,
    canUpdateConfiguration: configuration.value?.capabilities?.canUpdateConfiguration ?? false,
    manualTopUpAvailable: false,
    manualTopUpBlockedReason: 'not_confirmed_in_p0_contract' as const
  }))
  const sourceAvailability = computed(() => configuration.value?.sourceAvailability ?? [])
  const needsAttentionRows = computed(() => needsAttention.value?.records ?? [])
  const overviewRows = computed(() => accounts.value?.records ?? [])
  const recentActivityRows = computed(() => recentActivities.value?.items ?? [])
  const configurationRows = computed(() => configuration.value?.items ?? [])
  const consumptionRows = computed(() => consumption.value?.items ?? [])
  const topUpRows = computed(() => topUps.value?.items ?? [])
  const overviewPagination = computed(() => ({
    page: accounts.value?.current ?? 1,
    pageSize: accounts.value?.size ?? DEFAULT_PAGE_SIZE,
    totalPages:
      accounts.value?.total && accounts.value?.size
        ? Math.ceil(accounts.value.total / accounts.value.size)
        : 0,
    totalCount: accounts.value?.total ?? 0
  }))
  const recentActivityPagination = computed(
    () => recentActivities.value?.pagination ?? { page: 1, totalPages: 0, totalCount: 0 }
  )
  const needsAttentionPagination = computed(() => ({
    page: needsAttention.value?.current ?? 1,
    pageSize: needsAttention.value?.size ?? DEFAULT_PAGE_SIZE,
    totalPages:
      needsAttention.value?.total && needsAttention.value?.size
        ? Math.ceil(needsAttention.value.total / needsAttention.value.size)
        : 0,
    totalCount: needsAttention.value?.total ?? 0
  }))
  const consumptionPagination = computed(
    () =>
      consumption.value?.pagination ?? {
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 0,
        totalCount: 0
      }
  )
  const topUpPagination = computed(
    () =>
      topUps.value?.pagination ?? {
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 0,
        totalCount: 0
      }
  )
  const filterOptions = computed(() => {
    return {
      networkOptions:
        (foundation.value?.filterOptions?.networkOptions as string[] | undefined) ??
        ([] as string[]),
      coinOptions:
        (foundation.value?.filterOptions?.coinOptions as string[] | undefined) ?? ([] as string[]),
      healthStateOptions:
        (foundation.value?.filterOptions?.healthStateOptions as string[] | undefined) ??
        ([] as string[]),
      sourceStatusOptions:
        (foundation.value?.filterOptions?.sourceStatusOptions as string[] | undefined) ??
        ([] as string[]),
      topUpStatusOptions:
        topUps.value?.filterOptions?.topUpStatusOptions ??
        (foundation.value?.filterOptions?.topUpStatusOptions as string[] | undefined) ??
        [],
      taskTypeOptions:
        (foundation.value?.filterOptions?.taskTypeOptions as string[] | undefined) ??
        ([] as string[]),
      consumptionSortOptions: [
        { code: 'desc', label: 'Newest first' },
        { code: 'asc', label: 'Oldest first' }
      ],
      topUpSortOptions: [
        { code: 'desc', label: 'Newest first' },
        { code: 'asc', label: 'Oldest first' }
      ]
    }
  })

  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      const [foundationResult, needsAttentionResult, activitiesResult, accountsResult] =
        await Promise.all([
          fetchGasOperationsFoundation().catch(() => null),
          fetchGasNeedsAttention(needsAttentionFilters),
          fetchGasRecentActivities(recentActivitiesFilters),
          fetchGasAccounts(accountsFilters)
        ])
      foundation.value = foundationResult
      needsAttention.value = needsAttentionResult
      recentActivities.value = activitiesResult
      accounts.value = accountsResult
    } catch (caught) {
      errorMessage.value = caught instanceof Error ? caught.message : 'Gas Operations unavailable.'
      uiStore.showToast('error', 'Unable to load Gas Operations', errorMessage.value)
    } finally {
      loading.value = false
    }
  }

  async function updateConsumptionFilters(next: Partial<GasConsumptionQuery>): Promise<void> {
    Object.assign(consumptionFilters, next, { page: next.page ?? 1 })
    await updateListData()
  }

  async function updateNeedsAttentionFilters(next: Partial<GasNeedsAttentionQuery>): Promise<void> {
    naLoading.value = true
    Object.assign(needsAttentionFilters, next, { page: next.page ?? 1 })
    try {
      needsAttention.value = await fetchGasNeedsAttention(needsAttentionFilters)
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load needs attention',
        caught instanceof Error ? caught.message : 'Data unavailable.'
      )
    } finally {
      naLoading.value = false
    }
  }

  async function updateAccountsFilters(next: Partial<GasAccountsQuery>): Promise<void> {
    acLoading.value = true
    Object.assign(accountsFilters, next, { page: next.page ?? 1 })
    try {
      accounts.value = await fetchGasAccounts(accountsFilters)
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load accounts',
        caught instanceof Error ? caught.message : 'Data unavailable.'
      )
    } finally {
      acLoading.value = false
    }
  }

  async function updateRecentActivitiesFilters(
    next: Partial<GasRecentActivitiesQuery>
  ): Promise<void> {
    raLoading.value = true
    Object.assign(recentActivitiesFilters, next, { page: next.page ?? 1 })
    try {
      recentActivities.value = await fetchGasRecentActivities(recentActivitiesFilters)
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load recent activities',
        caught instanceof Error ? caught.message : 'Data unavailable.'
      )
    } finally {
      raLoading.value = false
    }
  }

  async function updateTopUpFilters(next: Partial<GasTopUpQuery>): Promise<void> {
    Object.assign(topUpFilters, next, { page: next.page ?? 1 })
    await updateListData()
  }

  async function updateOverviewData(): Promise<void> {
    try {
      const [needsAttentionResult, activitiesResult, accountsResult] = await Promise.all([
        fetchGasNeedsAttention(needsAttentionFilters),
        fetchGasRecentActivities(recentActivitiesFilters),
        fetchGasAccounts(accountsFilters)
      ])
      needsAttention.value = needsAttentionResult
      recentActivities.value = activitiesResult
      accounts.value = accountsResult
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load overview data',
        caught instanceof Error ? caught.message : 'Data unavailable.'
      )
    }
  }

  async function updateListData(): Promise<void> {
    try {
      const [consumptionResult, topUpsResult] = await Promise.all([
        fetchGasConsumption(consumptionFilters),
        fetchGasTopUps(topUpFilters)
      ])
      consumption.value = consumptionResult
      topUps.value = topUpsResult
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load list data',
        caught instanceof Error ? caught.message : 'Data unavailable.'
      )
    }
  }

  async function updateConfigurationFilters(next: Partial<GasConfigurationQuery>): Promise<void> {
    Object.assign(configurationFilters, next)
    configuration.value = await fetchGasConfiguration(configurationFilters)
  }

  async function submitConfigurationUpdate(payload: GasConfigurationUpdatePayload): Promise<void> {
    const response = await updateGasConfiguration(payload)
    lastConfigurationTraceRef.value = response.configurationChange.operationTraceRef
    configuration.value = await fetchGasConfiguration(configurationFilters)
  }

  async function openDetail(row: GasAccountSummaryView): Promise<void> {
    detailLoading.value = true
    try {
      selectedDetail.value = await fetchGasAccountDetail({
        cusAccountId: row.cusAccountId
      })
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load gas account',
        caught instanceof Error ? caught.message : 'Gas account detail unavailable.'
      )
    } finally {
      detailLoading.value = false
    }
  }

  // load is called explicitly by page after coin store is ready; onMounted here is a no-op fallback
  // onMounted(() => {
  //   void load();
  // });

  return {
    loading,
    naLoading,
    raLoading,
    acLoading,
    errorMessage,
    detailLoading,
    needsAttention,
    recentActivities,
    accounts,
    configuration,
    capabilities,
    sourceAvailability,
    needsAttentionRows,
    overviewRows,
    recentActivityRows,
    configurationRows,
    consumptionRows,
    topUpRows,
    overviewPagination,
    needsAttentionPagination,
    recentActivityPagination,
    consumptionPagination,
    topUpPagination,
    filterOptions,
    needsAttentionFilters,
    accountsFilters,
    recentActivitiesFilters,
    consumptionFilters,
    topUpFilters,
    configurationFilters,
    selectedDetail,
    lastConfigurationTraceRef,
    load,
    updateNeedsAttentionFilters,
    updateAccountsFilters,
    updateRecentActivitiesFilters,
    updateConsumptionFilters,
    updateTopUpFilters,
    updateConfigurationFilters,
    submitConfigurationUpdate,
    openDetail
  }
}
