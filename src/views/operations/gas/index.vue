<!-- Cregis Gas Operations -->
<template>
  <div class="page-content">
    <!-- ═══ Tab 切换 ═══ -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <el-radio-group v-model="activeTab" @change="switchTab">
        <el-radio-button v-for="tab in tabs" :key="tab.key" :value="tab.key">{{
          $t(tab.labelKey)
        }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ═══ Needs Attention ═══ -->
    <div v-if="activeTab === 'overview'" class="art-card art-table-card mb-4 overflow-hidden">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="text-base font-semibold text-g-900 mr-4">{{ $t('gas.needsAttention') }}</h3>
          <el-input
            v-model="naFilterForm.merchantName"
            :placeholder="$t('gas.searchMerchant')"
            clearable
            class="!w-48"
            @clear="onNaFilterChange"
            @keyup.enter="onNaFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <el-select
            v-model="naFilterForm.taskType"
            :placeholder="$t('gas.event')"
            clearable
            class="!w-36"
            @change="onNaFilterChange"
          >
            <el-option v-for="o in taskTypeOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-select
            v-model="naFilterForm.network"
            :placeholder="$t('gas.network')"
            clearable
            class="!w-36"
            @change="onNaFilterChange"
          >
            <el-option v-for="o in networkOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
      </div>
      <template v-if="naLoading || (loading && needsAttentionRows.length === 0)">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center text-tone-error-text">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="needsAttentionRows" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column :label="$t('gas.level')" width="100">
          <template #default="{ row }"
            ><ArtStatusTag
              :status="severityTagType(row.severity)"
              :text="severityLabel(row.severity)"
          /></template>
        </el-table-column>
        <el-table-column :label="$t('gas.merchant')" min-width="160">
          <template #default="{ row }">
            <div class="text-sm font-medium text-g-800">{{ row.merchantName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('gas.issue')" min-width="200" />
        <el-table-column prop="network" :label="$t('gas.network')" width="120" />
        <el-table-column :label="$t('gas.currentBalance')" width="150">
          <template #default="{ row }">
            <span v-if="row.currentBalance" class="text-sm tabular-nums text-g-800">{{
              balanceDisplay(row.currentBalance, row.coinId, row.network)
            }}</span>
            <span v-else class="text-xs text-tone-muted-text">{{ $t('gas.unavailable') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.lastSignal')" width="130">
          <template #default="{ row }"
            ><span class="text-xs text-tone-muted-text">{{
              formatRelativeTime(row.lastSignalAt)
            }}</span></template
          >
        </el-table-column>
        <el-table-column :label="''" width="110" align="right">
          <template #default="{ row }"
            ><ElButton size="small" @click="openDetail(row)">{{
              $t('fee.detail')
            }}</ElButton></template
          >
        </el-table-column>
      </el-table>
      <div
        v-if="needsAttentionPagination"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >{{ needsAttentionPagination.totalCount }} {{ $t('merchantList.records') }}</span
        >
        <el-pagination
          v-model:current-page="naFilters.page"
          v-model:page-size="naFilters.pageSize"
          :total="needsAttentionPagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updateNeedsAttentionFilters({ page: v })"
          @size-change="(v: number) => updateNeedsAttentionFilters({ pageSize: v, page: 1 })"
        />
      </div>
    </div>

    <!-- ═══ Recent Activities ═══ -->
    <div v-if="activeTab === 'overview'" class="art-card art-table-card mb-4 overflow-hidden">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="text-base font-semibold text-g-900 mr-4">{{ $t('gas.recentActivities') }}</h3>
          <el-input
            v-model="raFilterForm.merchantName"
            :placeholder="$t('gas.searchMerchant')"
            clearable
            class="!w-48"
            @clear="onRaFilterChange"
            @keyup.enter="onRaFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <el-select
            v-model="raFilterForm.event"
            :placeholder="$t('gas.event')"
            clearable
            class="!w-36"
            @change="onRaFilterChange"
          >
            <el-option value="submitted" :label="$t('gas.activitySubmitted')" />
            <el-option value="processing" :label="$t('gas.activityProcessing')" />
            <el-option value="succeeded" :label="$t('gas.activitySucceeded')" />
            <el-option value="failed" :label="$t('gas.activityFailed')" />
          </el-select>
          <el-select
            v-model="raFilterForm.network"
            :placeholder="$t('gas.network')"
            clearable
            class="!w-36"
            @change="onRaFilterChange"
          >
            <el-option v-for="o in networkOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
      </div>
      <template v-if="raLoading || (loading && recentActivityRows.length === 0)">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center text-tone-error-text">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="filteredActivities" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column :label="$t('gas.time')" width="130">
          <template #default="{ row }"
            ><span class="text-xs text-tone-muted-text">{{
              formatRelativeTime(row.occurredAt)
            }}</span></template
          >
        </el-table-column>
        <el-table-column :label="$t('gas.merchant')" min-width="160">
          <template #default="{ row }">
            <div class="text-sm font-medium text-g-800">{{ row.merchantName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.activity')" min-width="200">
          <template #default="{ row }">{{ activityTypeLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="network" :label="$t('gas.network')" width="120" />
        <el-table-column :label="$t('gas.amount')" width="150">
          <template #default="{ row }">
            <span v-if="row.gasAmount" class="text-sm font-medium tabular-nums text-g-800">{{
              activityAmountDisplay(row)
            }}</span>
            <span v-else class="text-xs text-tone-muted-text">No change</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.result')" width="110">
          <template #default="{ row }"
            ><ArtStatusTag :status="activityStatusBadgeType(row)" :text="activityStatusLabel(row)"
          /></template>
        </el-table-column>
      </el-table>
      <div
        v-if="recentActivityPagination"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >{{ recentActivityPagination.totalCount }} {{ $t('merchantList.records') }}</span
        >
        <el-pagination
          v-model:current-page="raFilters.page"
          v-model:page-size="raFilters.pageSize"
          :total="recentActivityPagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updateRecentActivitiesFilters({ page: v })"
          @size-change="(v: number) => updateRecentActivitiesFilters({ pageSize: v, page: 1 })"
        />
      </div>
    </div>

    <!-- ═══ Account Lookup ═══ -->
    <div v-if="activeTab === 'accounts'" class="art-card art-table-card mb-4 overflow-hidden">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="text-base font-semibold text-g-900 mr-4">{{ $t('gas.accounts') }}</h3>
          <el-input
            v-model="acFilterForm.merchantName"
            :placeholder="$t('gas.searchAccount')"
            clearable
            class="!w-72"
            @clear="onAcFilterChange"
            @keyup.enter="onAcFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>
      <template v-if="acLoading || (loading && overviewRows.length === 0)">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center text-tone-error-text">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="overviewRows" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column :label="$t('gas.merchant')" min-width="200">
          <template #default="{ row }">
            <div class="text-sm font-medium text-g-800">{{
              row.merchantName || row.ecode || '-'
            }}</div>
            <div class="text-xs text-tone-muted-text font-mono" v-if="row.address">{{
              compactAddress(row.address)
            }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="network" :label="$t('gas.network')" width="140" />
        <el-table-column :label="$t('gas.currentBalance')" width="160">
          <template #default="{ row }">
            <span v-if="row.balance" class="text-sm tabular-nums text-g-800">{{
              balanceDisplay(row.balance, row.coinId, row.network)
            }}</span>
            <span v-else class="text-xs text-tone-muted-text">{{ $t('gas.unavailable') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.threshold')" width="150">
          <template #default="{ row }">
            <span v-if="row.threshold" class="text-sm tabular-nums text-g-700">{{
              thresholdDisplay(row.threshold, row.coinId, row.network)
            }}</span>
            <span v-else class="text-xs text-tone-muted-text">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.balanceStatus')" width="120">
          <template #default="{ row }">
            <div v-if="hasValidThreshold(row)" class="flex items-center gap-1.5">
              <svg
                viewBox="0 0 36 36"
                width="28"
                height="28"
                class="flex-shrink-0"
                style="transform: rotate(-90deg)"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="var(--default-border)"
                  stroke-width="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke="balanceStatusColor(row)"
                  :stroke-dasharray="balanceStatusDash(row)"
                  stroke-dashoffset="22"
                />
              </svg>
              <span
                class="text-xs font-medium tabular-nums"
                :style="{ color: balanceStatusColor(row) }"
                >{{ balanceStatusRatio(row) }}x</span
              >
            </div>
            <span
              v-else-if="isZeroBalance(row)"
              class="inline-flex items-center gap-1 text-xs font-medium text-tone-error-text"
            >
              <ArtSvgIcon icon="ri:error-warning-line" class="text-icon-xs" />
              {{ $t('gas.insufficientBalance') }}
            </span>
            <span v-else class="text-xs text-tone-muted-text">—</span>
          </template>
        </el-table-column>
        <el-table-column width="170" align="right">
          <template #header>
            <span class="inline-flex items-center gap-1">
              {{ $t('gas.transfersPerRefill') }}
              <el-tooltip :content="$t('gas.infoTransfersPerRefill')" placement="top">
                <ArtSvgIcon icon="ri:information-line" class="text-icon-xs text-tone-muted-text" />
              </el-tooltip>
            </span>
          </template>
          <template #default="{ row }">
            <span class="text-sm tabular-nums text-g-800">{{
              (row.transfersPerRefillAvg ?? 0).toFixed(1)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160" align="right">
          <template #header>
            <span class="inline-flex items-center gap-1">
              {{ $t('gas.refillsPerDay') }}
              <el-tooltip :content="$t('gas.infoRefillsPerDay')" placement="top">
                <ArtSvgIcon icon="ri:information-line" class="text-icon-xs text-tone-muted-text" />
              </el-tooltip>
            </span>
          </template>
          <template #default="{ row }">
            <span class="text-sm tabular-nums text-g-800">{{
              (row.refillsPerDayAvg ?? 0).toFixed(1)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="''" width="110" align="right">
          <template #default="{ row }"
            ><ElButton size="small" @click="openDetail(row)">{{
              $t('fee.detail')
            }}</ElButton></template
          >
        </el-table-column>
      </el-table>
      <div
        v-if="overviewPagination"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >{{ overviewPagination.totalCount }} {{ $t('merchantList.records') }}</span
        >
        <el-pagination
          v-model:current-page="acFilters.page"
          v-model:page-size="acFilters.pageSize"
          :total="overviewPagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updateAccountsFilters({ page: v })"
          @size-change="(v: number) => updateAccountsFilters({ pageSize: v, page: 1 })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGasOperations } from '@/features/ops/gas/useGasOperations'
  import { useCoinStore } from '@/store/modules/coins'
  import { useGasOperationsStore, type GasTab } from '@/store/modules/gasOperations'
  import { formatCoinBalance, formatRelativeTime } from '@/utils/format'
  import type { GasHomeActivityView } from '@/features/ops/gas/types'

  defineOptions({ name: 'GasOperations' })
  const route = useRoute()
  const router = useRouter()
  const coinStore = useCoinStore()
  const gasStore = useGasOperationsStore()
  const {
    loading,
    naLoading,
    raLoading,
    acLoading,
    errorMessage,
    overviewRows,
    needsAttentionRows,
    recentActivityRows,
    overviewPagination,
    needsAttentionPagination,
    recentActivityPagination,
    filterOptions,
    load,
    updateNeedsAttentionFilters,
    updateAccountsFilters,
    updateRecentActivitiesFilters
  } = useGasOperations()
  /**
   * 初始化期间不重复请求：composable 默认 state 是空的，直接 load() 会用空条件
   * 覆盖掉全局状态里的分页/筛选，回退后条件与列表对不上。
   */
  let initializing = true

  onMounted(async () => {
    await coinStore.ensureLoaded()
    // 用全局状态里的条件初始化查询对象，保证回退后筛选显示与实际查询一致
    initializing = false
    await updateNeedsAttentionFilters({
      merchantName: naFilters.merchantName,
      taskType: naFilters.taskType,
      network: naFilters.network,
      page: naFilters.page,
      pageSize: naFilters.pageSize
    } as any)
    await updateAccountsFilters({
      merchantName: acFilters.merchantName,
      page: acFilters.page,
      pageSize: acFilters.pageSize
    } as any)
    await updateRecentActivitiesFilters({
      network: raFilters.network,
      page: raFilters.page,
      pageSize: raFilters.pageSize
    })
    load()
  })

  // --- coin helpers (aligned with v1) ---
  function getDecimals(coinId: string, network: string): number {
    return coinStore.getDecimals(coinId, network)
  }
  function getUnit(coinId: string, network: string): string {
    return coinStore.getUnit(coinId, network) || ''
  }

  function balanceDisplay(balance: string | null, coinId?: string, network?: string): string {
    if (!balance) return '-'
    const d = getDecimals(coinId || '', network || '')
    if (!d) return balance
    return formatCoinBalance(balance, d) + ' ' + getUnit(coinId || '', network || '').toUpperCase()
  }
  function thresholdDisplay(threshold: string | null, coinId?: string, network?: string): string {
    if (!threshold) return '—'
    const d = getDecimals(coinId || '', network || '')
    if (!d) return threshold
    return (
      formatCoinBalance(threshold, d) + ' ' + getUnit(coinId || '', network || '').toUpperCase()
    )
  }
  function activityAmountDisplay(row: GasHomeActivityView): string {
    if (!row.gasAmount) return 'No change'
    const d = getDecimals(row.coinId || '', row.network || '')
    if (!d) return row.gasAmount
    const formatted = formatCoinBalance(row.gasAmount, d)
    const unit = getUnit(row.coinId || '', row.network || '')
    const sign =
      row.activityType === 'succeeded' && row.businessType === 'gas_consumption' ? '-' : '+'
    return `${sign}${formatted} ${unit.toUpperCase()}`
  }
  function label(v: string | null | undefined): string {
    if (!v) return '-'
    return v.replace(/_/g, ' ')
  }

  const validTabs: GasTab[] = ['overview', 'accounts']
  /**
   * 当前 tab：URL（?tab=）优先 —— 详情页 router.back() 回来时按 URL 定位；
   * 无参数时沿用全局状态（例如直接从菜单进入不会重置上次的 tab）。
   */
  const activeTab = computed<GasTab>({
    get: () => {
      const tab = route.query.tab as GasTab | undefined
      return tab && validTabs.includes(tab) ? tab : gasStore.activeTab
    },
    set: (tab) => {
      gasStore.activeTab = tab
      router.replace({ query: { ...route.query, tab } }).catch(() => {})
    }
  })
  const tabs = [
    { key: 'overview', labelKey: 'gas.overview' },
    { key: 'accounts', labelKey: 'gas.accounts' }
  ]

  /** 搜索条件与分页统一放在全局状态：详情返回后条件仍在 */
  const naFilters = gasStore.needsAttention
  const raFilters = gasStore.recentActivities
  const acFilters = gasStore.accounts
  const naFilterForm = naFilters
  const raFilterForm = raFilters
  const acFilterForm = acFilters

  function switchTab(tab: string | number | boolean | undefined): void {
    const next = tab as GasTab
    if (activeTab.value === next) return
    activeTab.value = next
    if (next === 'accounts' && overviewRows.value.length === 0) {
      updateAccountsFilters({ page: 1 })
    }
  }

  const taskTypeOptions = computed(
    () =>
      (filterOptions.value?.taskTypeOptions as string[] | undefined) || [
        'top_up_failed',
        'low_balance',
        'source_unavailable',
        'missing_account',
        'stale_top_up'
      ]
  )
  const networkOptions = computed(
    () => (filterOptions.value?.networkOptions as string[] | undefined) || []
  )

  // client-side activity filter by event (activityType)
  const filteredActivities = computed(() => {
    return (recentActivityRows.value as GasHomeActivityView[]).filter((act) => {
      if (raFilterForm.event && act.activityType !== raFilterForm.event) return false
      if (raFilterForm.network && act.network !== raFilterForm.network) return false
      return true
    })
  })

  function onNaFilterChange() {
    if (initializing) return
    naFilters.page = 1
    updateNeedsAttentionFilters({
      merchantName: naFilters.merchantName,
      taskType: naFilters.taskType,
      network: naFilters.network,
      page: 1,
      pageSize: naFilters.pageSize
    } as any)
  }
  function onRaFilterChange() {
    if (initializing) return
    raFilters.page = 1
    updateRecentActivitiesFilters({
      network: raFilters.network || undefined,
      page: 1,
      pageSize: raFilters.pageSize
    })
  }
  function onAcFilterChange() {
    if (initializing) return
    acFilters.page = 1
    updateAccountsFilters({
      merchantName: acFilters.merchantName,
      page: 1,
      pageSize: acFilters.pageSize
    } as any)
  }
  function openDetail(row: any) {
    router.push(`/operations/gas/${row.cusAccountId || row.id}`)
  }

  // --- Severity ---
  function severityLabel(s: string): string {
    if (s === 'action_needed') return 'Critical'
    if (s === 'degraded' || s === 'unknown') return 'Warning'
    return 'Warning'
  }
  function severityTagType(s: string): 'danger' | 'warning' | 'info' {
    if (s === 'action_needed') return 'danger'
    if (s === 'degraded' || s === 'unknown') return 'warning'
    return 'info'
  }

  // --- Activity ---
  function activityTypeLabel(act: GasHomeActivityView): string {
    switch (act.activityType) {
      case 'submitted':
        return 'Auto supplement submitted'
      case 'processing':
        return 'Processing'
      case 'succeeded':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return act.businessType || act.activityType?.replace(/_/g, ' ') || '-'
    }
  }
  function activityStatusLabel(row: GasHomeActivityView): string {
    const s = row.status
    if (s === 'succeeded' || s === 'fulfilled_recorded') return 'Success'
    if (s === 'failed') return 'Failed'
    if (s === 'submitted' || s === 'processing') return 'Processing'
    if (s === 'ok') return 'Normal'
    return s?.replace(/_/g, ' ') || 'Signal only'
  }
  function activityStatusBadgeType(
    row: GasHomeActivityView
  ): 'success' | 'danger' | 'warning' | 'info' {
    const s = row.status
    if (s === 'succeeded' || s === 'fulfilled_recorded' || s === 'ok') return 'success'
    if (s === 'failed') return 'danger'
    if (s === 'submitted' || s === 'processing') return 'warning'
    return 'info'
  }

  // --- Balance Status (donut) ---
  function hasValidThreshold(row: { balance?: string | null; threshold?: string | null }): boolean {
    return !!(
      row.balance &&
      row.threshold &&
      parseFloat(row.balance) > 0 &&
      parseFloat(row.threshold) > 0
    )
  }
  function isZeroBalance(row: { balance?: string | null }): boolean {
    return !!row.balance && parseFloat(row.balance) === 0
  }
  function balanceStatusRatio(row: { balance: string; threshold: string }): number {
    const b = parseFloat(row.balance)
    const t = parseFloat(row.threshold)
    if (t === 0) return 999
    return Math.round((b / t) * 10) / 10
  }
  function balanceStatusColor(row: { balance: string; threshold: string }): string {
    const ratio = balanceStatusRatio(row)
    if (ratio < 1) return 'var(--tone-error-text)'
    if (ratio < 2) return 'var(--tone-progress-text)'
    return 'var(--tone-done-text)'
  }
  function balanceStatusDash(row: { balance: string; threshold: string }): string {
    const ratio = balanceStatusRatio(row)
    const pct = Math.min((ratio / 2) * 88, 88)
    return `${pct} ${88 - pct}`
  }

  function compactAddress(address: string): string {
    if (address.length <= 13) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
</script>
