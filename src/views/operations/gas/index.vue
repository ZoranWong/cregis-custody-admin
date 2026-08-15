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
    <div v-if="activeTab === 'overview'" class="art-card art-table-card mb-5 overflow-hidden">
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
        <div class="p-10 text-center text-[var(--el-color-danger)]">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="needsAttentionRows" stripe size="small">
        <el-table-column :label="$t('gas.level')" width="80">
          <template #default="{ row }"
            ><el-tag :type="severityTagType(row.severity)" size="small">{{
              severityLabel(row.severity)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column :label="$t('gas.merchant')" min-width="160">
          <template #default="{ row }">
            <div class="text-sm text-g-900">{{ row.merchantName || '-' }}</div>
            <div class="text-xs text-g-500">Project {{ row.projectId ?? 'unavailable' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('gas.issue')" min-width="200" />
        <el-table-column prop="network" :label="$t('gas.network')" width="120" />
        <el-table-column :label="$t('gas.lastSignal')" width="140">
          <template #default="{ row }">{{ relativeTime(row.lastSignalAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('merchantList.action')" width="80">
          <template #default="{ row }"
            ><ElButton size="small" @click="openDetail(row)">{{
              $t('merchantList.open')
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
    <div v-if="activeTab === 'overview'" class="art-card art-table-card mb-5 overflow-hidden">
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
        <div class="p-10 text-center text-[var(--el-color-danger)]">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="filteredActivities" stripe size="small">
        <el-table-column :label="$t('gas.time')" width="140">
          <template #default="{ row }">{{ relativeTime(row.occurredAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('gas.merchant')" min-width="160">
          <template #default="{ row }">
            <div class="text-sm text-g-900">{{ row.merchantName || '-' }}</div>
            <div class="text-xs text-g-500">Project {{ row.projectId ?? 'unavailable' }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.activity')" min-width="200">
          <template #default="{ row }">{{ activityTypeLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="network" :label="$t('gas.network')" width="120" />
        <el-table-column :label="$t('gas.amount')" width="140">
          <template #default="{ row }">{{ activityAmountDisplay(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('gas.result')" width="100">
          <template #default="{ row }"
            ><el-tag :type="activityStatusBadgeType(row)" size="small">{{
              activityStatusLabel(row)
            }}</el-tag></template
          >
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
    <div v-if="activeTab === 'accounts'" class="art-card art-table-card mb-5 overflow-hidden">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="text-base font-semibold text-g-900 mr-4">{{ $t('gas.accounts') }}</h3>
          <el-input
            v-model="acFilterForm.merchantName"
            :placeholder="$t('gas.searchMerchant')"
            clearable
            class="!w-48"
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
        <div class="p-10 text-center text-[var(--el-color-danger)]">{{ errorMessage }}</div>
      </template>
      <el-table v-else :data="overviewRows" stripe size="small">
        <el-table-column :label="$t('gas.merchant')" min-width="180">
          <template #default="{ row }">
            <div class="text-sm text-g-900">{{ row.merchantName || row.ecode || '-' }}</div>
            <div class="text-xs text-g-500" v-if="row.address">{{
              compactAddress(row.address)
            }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="network" :label="$t('gas.network')" width="120" />
        <el-table-column :label="$t('gas.balance')" width="160">
          <template #default="{ row }">{{
            balanceDisplay(row.balance, row.coinId, row.network)
          }}</template>
        </el-table-column>
        <el-table-column :label="$t('gas.threshold')" width="160">
          <template #default="{ row }">{{
            thresholdDisplay(row.threshold, row.coinId, row.network)
          }}</template>
        </el-table-column>
        <el-table-column :label="$t('gas.balanceStatus')" width="100">
          <template #default="{ row }">
            <div v-if="hasValidThreshold(row)" class="flex items-center gap-1">
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
                  stroke="var(--ink-100)"
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
              <span class="text-xs font-medium" :style="{ color: balanceStatusColor(row) }"
                >{{ balanceStatusRatio(row) }}x</span
              >
            </div>
            <div
              v-else-if="isZeroBalance(row)"
              class="flex items-center gap-1 text-[var(--el-color-danger)]"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <span class="text-xs font-medium">{{ $t('gas.insufficientBalance') }}</span>
            </div>
            <span v-else class="text-g-400">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('gas.stats')" width="160">
          <template #default="{ row }">
            <div class="text-xs text-g-500">
              <div>{{ row.totalTransfers ?? 0 }} transfers</div>
              <div>{{ row.totalRefills ?? 0 }} refills</div>
              <div>{{ (row.transfersPerRefillAvg ?? 0).toFixed(1) }}/day avg transfers</div>
              <div>{{ (row.refillsPerDayAvg ?? 0).toFixed(1) }}/day avg refills</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('merchantList.action')" width="80">
          <template #default="{ row }"
            ><ElButton size="small" @click="openDetail(row)">{{
              $t('merchantList.open')
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
  import { computed, reactive, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGasOperations } from '@/features/ops/gas/useGasOperations'
  import { useCoinStore } from '@/store/modules/coins'
  import { formatCoinBalance } from '@/utils/format'
  import type { GasHomeActivityView } from '@/features/ops/gas/types'

  defineOptions({ name: 'GasOperations' })
  const route = useRoute()
  const router = useRouter()
  const coinStore = useCoinStore()
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

  onMounted(async () => {
    await coinStore.ensureLoaded()
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
    if (!balance) return 'Unavailable'
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
  function relativeTime(iso: string | null): string {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      const now = Date.now()
      const diff = Math.floor((now - d.getTime()) / 60000)
      if (diff < 1) return 'just now'
      if (diff < 60) return `${diff} min ago`
      const hours = Math.floor(diff / 60)
      if (hours < 24) return `${hours}h ago`
      return `${Math.floor(hours / 24)}d ago`
    } catch {
      return iso
    }
  }
  function label(v: string | null | undefined): string {
    if (!v) return '-'
    return v.replace(/_/g, ' ')
  }

  const validTabs = ['overview', 'accounts'] as const
  const activeTab = ref(
    validTabs.includes(route.query.tab as any) ? (route.query.tab as string) : 'overview'
  )
  const tabs = [
    { key: 'overview', labelKey: 'gas.overview' },
    { key: 'accounts', labelKey: 'gas.accounts' }
  ]

  function switchTab(tab: string): void {
    if (activeTab.value === tab) return
    activeTab.value = tab
    router.replace({ query: { ...route.query, tab } }).catch(() => {})
    if (tab === 'accounts' && overviewRows.value.length === 0) {
      updateAccountsFilters({ page: 1 })
    }
  }
  const naFilters = reactive({ page: 1, pageSize: 10 })
  const raFilters = reactive({ page: 1, pageSize: 10 })
  const acFilters = reactive({ page: 1, pageSize: 10 })
  const naFilterForm = reactive({ merchantName: '', taskType: '', network: '' })
  const raFilterForm = reactive({ merchantName: '', event: '', network: '' })
  const acFilterForm = reactive({ merchantName: '' })

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
    updateNeedsAttentionFilters({ ...naFilterForm, page: 1 } as any)
  }
  function onRaFilterChange() {
    updateRecentActivitiesFilters({ network: raFilterForm.network || undefined, page: 1 })
  }
  function onAcFilterChange() {
    updateAccountsFilters({ ...acFilterForm, page: 1 } as any)
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
  function severityTagType(s: string) {
    if (s === 'action_needed') return 'danger' as const
    if (s === 'degraded' || s === 'unknown') return 'warning' as const
    return 'info' as const
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
  function activityStatusBadgeType(row: GasHomeActivityView) {
    const s = row.status
    if (s === 'succeeded' || s === 'fulfilled_recorded' || s === 'ok') return 'success' as const
    if (s === 'failed') return 'danger' as const
    if (s === 'submitted' || s === 'processing') return 'warning' as const
    return 'info' as const
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
    if (ratio < 1) return 'var(--el-color-danger)'
    if (ratio < 2) return 'var(--el-color-warning)'
    return 'var(--el-color-success)'
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
