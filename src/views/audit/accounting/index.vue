<!-- Accounting — 财资单元账务（余额趋势 / 资金流水 / 交易明细） -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ $t('accounting.pageTitle') }}</h1>
      </div>
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="overview">
          <ArtSvgIcon icon="ri:dashboard-3-line" class="mr-1" />
          {{ $t('accounting.tabOverview') }}
        </el-radio-button>
        <el-radio-button value="transactions">
          <ArtSvgIcon icon="ri:file-list-3-line" class="mr-1" />
          {{ $t('accounting.tabTransactions') }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-group">
        <label>{{ $t('accounting.merchant') }}</label>
        <el-select
          v-model="filters.merchantCode"
          :placeholder="$t('accounting.selectMerchant')"
          filterable
          remote
          :remote-method="onMerchantRemoteSearch"
          :loading="merchantLoading"
          class="!w-52"
          @change="onMerchantChange"
        >
          <el-option
            v-for="m in merchantResults"
            :key="m.code"
            :label="m.merchantName"
            :value="m.code"
          />
        </el-select>
      </div>

      <div class="filter-group">
        <label>{{ $t('accounting.treasuryUnit') }}</label>
        <el-select
          v-model="filters.treasuryUnitId"
          :placeholder="$t('accounting.allUnits')"
          :disabled="filters.merchantCode === ''"
          class="!w-48"
        >
          <el-option :label="$t('accounting.allUnits')" :value="0" />
          <el-option v-for="unit in units" :key="unit.id" :label="unit.name" :value="unit.id" />
        </el-select>
      </div>

      <div class="filter-group">
        <label>{{ $t('accounting.account') }}</label>
        <el-select
          v-model="filters.accountType"
          :placeholder="$t('accounting.allAccounts')"
          class="!w-36"
        >
          <el-option :label="$t('accounting.allAccounts')" value="" />
          <el-option
            v-for="type in ACCOUNT_TYPES"
            :key="type"
            :label="$t(`accounting.accountType.${type}`)"
            :value="type"
          />
        </el-select>
      </div>

      <div class="filter-group">
        <label>{{ $t('accounting.asset') }}</label>
        <el-select
          v-model="filters.assetKey"
          :placeholder="$t('accounting.selectAsset')"
          filterable
          class="!w-56"
        >
          <el-option :label="$t('accounting.allAssets')" value="" />
          <el-option
            v-for="asset in assetOptions"
            :key="asset.key"
            :label="`${asset.coinId} · ${networkLabel(asset.network)}`"
            :value="asset.key"
          />
        </el-select>
      </div>

      <div class="filter-group">
        <label>{{ $t('accounting.period') }}</label>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="—"
          :start-placeholder="$t('accounting.from')"
          :end-placeholder="$t('accounting.to')"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          class="!w-64"
        />
      </div>

      <ElButton type="primary" :disabled="!filters.assetKey" @click="applyFilters">
        {{ $t('accounting.apply') }}
      </ElButton>
    </div>

    <!-- 未选择资产：先选择再应用（对齐原型 void 状态） -->
    <div
      v-if="!applied.assetKey"
      class="art-card flex flex-col items-center justify-center py-20 text-center"
    >
      <ArtSvgIcon icon="ri:calculator-line" class="text-5xl text-g-300 mb-4" />
      <div class="text-base font-semibold text-g-700 mb-2">
        {{ $t('accounting.selectAssetFirst') }}
      </div>
      <div class="text-sm text-g-500">{{ $t('accounting.selectAssetHint') }}</div>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="art-card p-5">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Load error -->
      <div v-else-if="loadError" class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadAll">{{ $t('console.refresh') }}</ElButton>
      </div>

      <template v-else>
        <!-- ===== Overview Tab ===== -->
        <div v-if="activeTab === 'overview'">
          <!-- Flow Indicators -->
          <ElRow :gutter="20" class="flex mb-5">
            <ElCol
              v-for="card in summaryCards"
              :key="card.key"
              :sm="12"
              :md="6"
              class="mb-4 sm:mb-0"
            >
              <div class="art-card relative flex flex-col justify-center h-24 px-5">
                <span class="text-g-700 text-sm">{{ card.label }}</span>
                <span
                  class="text-display font-semibold mt-1 tabular-nums"
                  :class="card.tone ?? 'text-g-900'"
                  >{{ card.value }}</span
                >
              </div>
            </ElCol>
          </ElRow>

          <!-- Balance Trend -->
          <div class="art-card mb-4 overflow-hidden">
            <div
              class="flex items-center justify-between gap-3 p-4 border-b border-[var(--default-border)]"
            >
              <div class="flex items-center gap-2">
                <h3 class="text-base font-semibold text-g-900">{{
                  $t('accounting.balanceTrend')
                }}</h3>
                <span class="text-xs text-g-500">{{ applied.assetLabel }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                  <span class="legend-dot bg-[var(--tone-done-mark)]" />
                  {{ $t('accounting.increase') }}
                </span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                  <span class="legend-dot bg-[var(--tone-error-mark)]" />
                  {{ $t('accounting.decrease') }}
                </span>
                <el-select v-model="granularity" class="!w-28" @change="loadTrend">
                  <el-option
                    v-for="g in GRANULARITIES"
                    :key="g"
                    :label="$t(`accounting.granularity.${g}`)"
                    :value="g"
                  />
                </el-select>
              </div>
            </div>
            <div class="p-4">
              <ArtBarChart
                :data="balanceTrendData"
                :xAxisData="trendLabels"
                height="260px"
                :show-data-zoom="trendLabels.length > 20"
                :is-empty="trendLabels.length === 0"
              />
            </div>
          </div>

          <!-- Fund Flow -->
          <div class="art-card mb-4 overflow-hidden">
            <div class="p-4 border-b border-[var(--default-border)]">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-base font-semibold text-g-900">
                  {{ $t('accounting.dailyFundFlow') }}
                </h3>
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                    <span class="legend-dot bg-[var(--tone-done-mark)]" />
                    {{ $t('accounting.inflow') }}
                  </span>
                  <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                    <span class="legend-dot bg-[var(--tone-error-mark)]" />
                    {{ $t('accounting.outflow') }}
                  </span>
                </div>
              </div>
            </div>
            <div class="p-4">
              <ArtBarChart
                :data="fundFlowData"
                :xAxisData="trendLabels"
                :stack="true"
                height="240px"
                :colors="['#10b981', '#ef4444']"
                :is-empty="trendLabels.length === 0"
              />
            </div>
          </div>
        </div>

        <!-- ===== Transactions Tab ===== -->
        <div v-else>
          <div class="art-card art-table-card overflow-hidden">
            <div class="p-4 border-b border-[var(--default-border)]">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h3 class="text-base font-semibold text-g-900">
                  {{ $t('accounting.transactions') }}
                  <span class="ml-2 text-xs font-normal text-g-500">
                    {{ txAccountNote || $t('accounting.txHint') }}
                  </span>
                </h3>
                <el-radio-group v-model="txSource" size="small" @change="reloadTransactions">
                  <el-radio-button value="unit">{{ $t('accounting.sourceUnit') }}</el-radio-button>
                  <el-radio-button value="account">
                    {{ $t('accounting.sourceAccount') }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <el-table :data="txRows" size="small" v-loading="txLoading">
              <el-table-column type="index" width="48" :index="txIndex" />
              <el-table-column :label="$t('accounting.activity')" width="140">
                <template #default="{ row }">
                  <span class="text-sm font-semibold text-g-900">{{ txActivity(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.amount')" width="160" align="right">
                <template #default="{ row }">
                  <span
                    class="text-sm font-semibold tabular-nums"
                    :class="row.direction === 'IN' ? 'text-tone-done-text' : 'text-tone-error-text'"
                  >
                    {{ row.direction === 'IN' ? '+' : '-'
                    }}{{ formatBaseAmount(row.amount, decimals) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.preBalance')" width="150" align="right">
                <template #default="{ row }">
                  <span class="text-xs tabular-nums text-g-500">{{
                    formatBaseAmount(row.preBalance, decimals)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.postBalance')" width="150" align="right">
                <template #default="{ row }">
                  <span class="text-xs font-semibold tabular-nums text-g-900">{{
                    formatBaseAmount(row.postBalance, decimals)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.txid')" width="150">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-g-600">{{ compactHex(row.txId, 8, 6) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.from')" min-width="150">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-g-600">{{
                    compactHex(row.fromAddress, 6, 4)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.to')" min-width="150">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-g-600">{{
                    compactHex(row.toAddress, 6, 4)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column
                v-if="txSource === 'account'"
                :label="$t('accounting.fee')"
                width="120"
                align="right"
              >
                <template #default="{ row }">
                  <span class="text-xs tabular-nums text-g-600">{{
                    row.fee ? formatBaseAmount(row.fee, decimals) : '—'
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.orderId')" width="180">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-g-600">{{ row.orderId || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.createdAt')" width="150">
                <template #default="{ row }">
                  <span class="text-xs text-g-500">{{ formatTime(row.createTime) }}</span>
                </template>
              </el-table-column>
              <template #empty>
                <div class="p-10 text-center text-g-500">{{ $t('accounting.noTransactions') }}</div>
              </template>
            </el-table>

            <div
              class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
            >
              <span class="text-xs text-g-500">{{
                $t('common.recordCount', { count: txTotal })
              }}</span>
              <el-pagination
                v-model:current-page="txPage"
                v-model:page-size="txPageSize"
                :total="txTotal"
                :page-sizes="[10, 20, 50]"
                background
                layout="prev,pager,next,sizes"
                @current-change="loadTransactions"
                @size-change="onTxSizeChange"
              />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import BigNumber from 'bignumber.js'
  import { compactHex, formatTime } from '@/utils/format'
  import {
    fetchAccountingRecords,
    fetchDailyBalances,
    fetchFundRecords,
    fetchTreasuryUnits,
    fetchUnitAccounts
  } from '@/api/auditAccounting'
  import { fetchMerchantList, type MerchantListItemView } from '@/api/merchantSearch'
  import { useCoinStore } from '@/store/modules/coins'
  import type {
    AccountingRecordView,
    AccountStatView,
    AccountTypeFilter,
    CustodyAccountView,
    FundRecordView,
    TreasuryUnitView,
    TrendGranularity
  } from '@/features/audit/accounting/types'
  import { activityLabel, formatBaseAmount, networkLabel } from '@/views/audit/_shared/format'

  defineOptions({ name: 'AuditAccounting' })

  const { t } = useI18n()
  const coinStore = useCoinStore()

  const GRANULARITIES: TrendGranularity[] = ['daily', 'weekly', 'monthly']
  const ACCOUNT_TYPES: Exclude<AccountTypeFilter, ''>[] = ['PRIMARY', 'PAYOUT', 'PAYIN']
  const DATE_TYPE_MAP: Record<TrendGranularity, 1 | 2 | 3> = {
    daily: 1,
    weekly: 2,
    monthly: 3
  }

  // ─── Filters ───
  const activeTab = ref<'overview' | 'transactions'>('overview')
  const merchantResults = ref<MerchantListItemView[]>([])
  const merchantLoading = ref(false)
  let merchantDebounce: ReturnType<typeof setTimeout> | null = null

  const defaultRange = (() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return [fmt(start), fmt(end)] as [string, string]
  })()

  const filters = reactive({
    merchantCode: '',
    treasuryUnitId: 0,
    accountType: '' as AccountTypeFilter,
    assetKey: ''
  })
  const dateRange = ref<[string, string] | null>([...defaultRange])
  const granularity = ref<TrendGranularity>('daily')

  /** 已应用的条件：筛选变化但未点 Apply 时，看板保持上一次结果（对齐原型） */
  const applied = reactive({
    merchantCode: '',
    treasuryUnitId: 0,
    accountType: '' as AccountTypeFilter,
    assetKey: '',
    assetLabel: '',
    from: defaultRange[0],
    to: defaultRange[1]
  })

  const units = ref<TreasuryUnitView[]>([])
  const accounts = ref<CustodyAccountView[]>([])

  const assetOptions = computed(() => {
    const seen = new Map<string, { key: string; coinId: string; network: string }>()
    units.value.forEach((unit) => {
      ;(unit.coinIds ?? []).forEach((coin) => {
        const key = `${coin.coinId}-${coin.network}`
        if (!seen.has(key)) seen.set(key, { key, coinId: coin.coinId, network: coin.network })
      })
    })
    return Array.from(seen.values()).sort((a, b) => a.coinId.localeCompare(b.coinId))
  })

  const appliedAsset = computed(
    () => assetOptions.value.find((a) => a.key === applied.assetKey) ?? null
  )
  const decimals = computed(() =>
    coinStore.getDecimalsByCoinId(appliedAsset.value?.coinId, appliedAsset.value?.network)
  )

  const loading = ref(false)
  const loadError = ref('')

  // ─── Dashboard data ───
  const stats = ref<AccountStatView[]>([])
  const trend = ref<
    Array<{ statDate: string; label: string; balance: number; inflow: number; outflow: number }>
  >([])

  const summaryCards = computed(() => {
    if (!stats.value.length) {
      return [
        { key: 'opening', label: t('accounting.openingBalance'), value: '—' },
        { key: 'inflow', label: t('accounting.totalInflow'), value: '—' },
        { key: 'outflow', label: t('accounting.totalOutflow'), value: '—' },
        { key: 'net', label: t('accounting.netFlow'), value: '—' }
      ]
    }
    const dec = decimals.value
    // Opening = 区间起点的上一期余额（首个统计点余额 - 首期净流入）；
    // 只有一期数据时退化为「首期余额 - 首期净流量」。
    const first = stats.value[0]!
    const firstNet = new BigNumber(first.totalIncome || 0).minus(first.totalOutcome || 0)
    const opening = new BigNumber(first.totalBalance || 0).minus(firstNet)
    const inflow = stats.value.reduce((sum, s) => sum.plus(s.totalIncome || 0), new BigNumber(0))
    const outflow = stats.value.reduce((sum, s) => sum.plus(s.totalOutcome || 0), new BigNumber(0))
    const net = inflow.minus(outflow)
    return [
      { key: 'opening', label: t('accounting.openingBalance'), value: fmtBase(opening, dec) },
      {
        key: 'inflow',
        label: t('accounting.totalInflow'),
        value: `+${fmtBase(inflow, dec)}`,
        tone: 'text-tone-done-text'
      },
      {
        key: 'outflow',
        label: t('accounting.totalOutflow'),
        value: `-${fmtBase(outflow, dec)}`,
        tone: 'text-tone-error-text'
      },
      {
        key: 'net',
        label: t('accounting.netFlow'),
        value: `${net.isGreaterThanOrEqualTo(0) ? '+' : '-'}${fmtBase(net.abs(), dec)}`,
        tone: net.isGreaterThanOrEqualTo(0) ? 'text-tone-done-text' : 'text-tone-error-text'
      }
    ]
  })

  const trendLabels = computed(() => trend.value.map((point) => point.label))

  /** 余额趋势柱状图：每根柱子对应当日余额值（ArtBarChart 接受 flat number[]） */
  const balanceTrendData = computed(() => trend.value.map((p) => p.balance))

  const fundFlowData = computed(() => [
    { name: t('accounting.inflow'), data: trend.value.map((p) => p.inflow) },
    { name: t('accounting.outflow'), data: trend.value.map((p) => p.outflow) }
  ])

  // ─── Transactions ───
  const txSource = ref<'unit' | 'account'>('unit')
  const txRows = ref<Array<AccountingRecordView | FundRecordView>>([])
  const txTotal = ref(0)
  const txPage = ref(1)
  const txPageSize = ref(20)
  const txLoading = ref(false)
  /** 选中的账户数 > 1 时的提示（接口每次只能按单个账户查询） */
  const txAccountNote = ref('')

  const txIndex = computed(() => (txPage.value - 1) * txPageSize.value + 1)

  function onTxSizeChange(): void {
    txPage.value = 1
    void loadTransactions()
  }

  function reloadTransactions(): void {
    txPage.value = 1
    void loadTransactions()
  }

  function txActivity(row: AccountingRecordView | FundRecordView): string {
    if ('activity' in row && row.activity) return activityLabel(row.activity)
    if ('txType' in row && row.txType) return activityLabel(row.txType)
    return activityLabel(row.direction === 'IN' ? 'TRANSFER_IN' : 'TRANSFER_OUT')
  }

  function fmtBase(value: BigNumber, dec: number): string {
    return value.div(new BigNumber(10).pow(dec)).toFormat()
  }

  function currentAssetParam(): { coinId?: string; network?: string } {
    if (!appliedAsset.value) return {}
    return { coinId: appliedAsset.value.coinId, network: appliedAsset.value.network }
  }

  /**
   * Account 筛选：先从 listAccountsByUnitId 取账户，按 type 过滤，
   * 再落到具体 cusAccountId；未选具体账户时仍按资产维度查询。
   */
  function resolveAccountIds(): number[] {
    const coinId = appliedAsset.value?.coinId
    return accounts.value
      .filter((account) => !applied.accountType || account.type === applied.accountType)
      .filter((account) => !coinId || account.coinId === coinId)
      .map((account) => account.id)
  }

  async function loadTransactions(): Promise<void> {
    if (!applied.assetKey) return
    txLoading.value = true
    try {
      const { coinId } = currentAssetParam()
      const base = {
        pageNumber: txPage.value,
        pageSize: txPageSize.value,
        ecode: applied.merchantCode || undefined,
        treasuryUnitId: applied.treasuryUnitId || undefined,
        coinId,
        startDate: applied.from,
        endDate: applied.to
      }
      const accountIds = resolveAccountIds()
      txAccountNote.value =
        txSource.value === 'account' && accountIds.length > 1
          ? t('accounting.multiAccountHint', { count: accountIds.length })
          : ''
      if (txSource.value === 'account' && accountIds.length > 0) {
        // 资金流水接口一次只能查一个 cusAccountId；多账户时取第一个，并在表头提示
        const res = await fetchFundRecords({ ...base, cusAccountId: accountIds[0] })
        txRows.value = res.records
        txTotal.value = res.total
      } else if (txSource.value === 'account') {
        const res = await fetchFundRecords(base)
        txRows.value = res.records
        txTotal.value = res.total
      } else {
        const res = await fetchAccountingRecords(base)
        txRows.value = res.records
        txTotal.value = res.total
      }
    } catch {
      txRows.value = []
      txTotal.value = 0
    } finally {
      txLoading.value = false
    }
  }

  // ─── Loaders ───
  async function searchMerchants(query: string): Promise<void> {
    merchantLoading.value = true
    try {
      const result = await fetchMerchantList({ merchantName: query || undefined, pageSize: 20 })
      merchantResults.value = result.records ?? []
    } catch {
      merchantResults.value = []
    } finally {
      merchantLoading.value = false
    }
  }

  function onMerchantRemoteSearch(query: string): void {
    if (merchantDebounce) clearTimeout(merchantDebounce)
    merchantDebounce = setTimeout(() => searchMerchants(query), 200)
  }

  async function onMerchantChange(): Promise<void> {
    filters.treasuryUnitId = 0
    filters.assetKey = ''
    units.value = []
    accounts.value = []
    if (!filters.merchantCode) return
    try {
      const res = await fetchTreasuryUnits(filters.merchantCode)
      units.value = res.records
      // 只有一个单元时直接带上，减少一次点击
      if (units.value.length === 1) filters.treasuryUnitId = units.value[0]!.id
      const firstAsset = assetOptions.value[0]
      if (firstAsset) filters.assetKey = firstAsset.key
    } catch {
      units.value = []
    }
  }

  async function loadAccounts(): Promise<void> {
    if (!applied.treasuryUnitId) {
      accounts.value = []
      return
    }
    try {
      const res = await fetchUnitAccounts(applied.treasuryUnitId)
      accounts.value = res.records
    } catch {
      accounts.value = []
    }
  }

  function dateBound(clipToToday: boolean): { from: string; to: string } {
    const [from, to] = dateRange.value ?? defaultRange
    if (!clipToToday) return { from, to }
    // 余额趋势只统计已结束的日期：结束日不晚于昨天
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const cap = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`
    return { from, to: to > cap ? cap : to }
  }

  async function loadTrend(): Promise<void> {
    if (!appliedAsset.value) return
    const { coinId, network } = currentAssetParam()
    const { from, to } = dateBound(true)
    try {
      const res = await fetchDailyBalances({
        ecode: applied.merchantCode || undefined,
        treasuryUnitId: applied.treasuryUnitId || undefined,
        coinIds: coinId ? [coinId] : undefined,
        network,
        startDate: from,
        endDate: to,
        dateType: DATE_TYPE_MAP[granularity.value],
        number: 90
      })
      const list = coinId
        ? (res[coinId] ?? res[coinId.toUpperCase()] ?? [])
        : (Object.values(res)[0] ?? [])
      stats.value = list
      trend.value = list.map((stat) => {
        const inflow = new BigNumber(stat.totalIncome || 0)
        const outflow = new BigNumber(stat.totalOutcome || 0)
        return {
          statDate: stat.statDate,
          balance: new BigNumber(stat.totalBalance || 0)
            .div(new BigNumber(10).pow(decimals.value))
            .toNumber(),
          inflow: inflow.div(new BigNumber(10).pow(decimals.value)).toNumber(),
          outflow: outflow.div(new BigNumber(10).pow(decimals.value)).toNumber(),
          label: trendLabel(stat.statDate)
        }
      })
    } catch {
      stats.value = []
      trend.value = []
    }
  }

  function trendLabel(statDate: string): string {
    const d = new Date(`${statDate.slice(0, 10)}T00:00:00`)
    if (Number.isNaN(d.getTime())) return statDate
    if (granularity.value === 'monthly') {
      return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    }
    if (granularity.value === 'weekly') return `W${Math.ceil(d.getDate() / 7)}`
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  async function loadAll(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      await Promise.all([loadTrend(), loadAccounts()])
      await loadTransactions()
    } catch (caught) {
      loadError.value = caught instanceof Error ? caught.message : 'Unable to load accounting data.'
    } finally {
      loading.value = false
    }
  }

  async function applyFilters(): Promise<void> {
    if (!filters.assetKey) return
    const asset = assetOptions.value.find((a) => a.key === filters.assetKey)
    applied.merchantCode = filters.merchantCode
    applied.treasuryUnitId = filters.treasuryUnitId
    applied.accountType = filters.accountType
    applied.assetKey = filters.assetKey
    applied.assetLabel = asset ? `${asset.coinId} · ${networkLabel(asset.network)}` : ''
    const [from, to] = dateRange.value ?? defaultRange
    applied.from = from
    applied.to = to
    txPage.value = 1
    await loadAll()
  }

  onMounted(async () => {
    await Promise.all([coinStore.ensureLoaded(), searchMerchants('')])
  })
</script>

<style scoped>
  .filter-card {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    padding: 16px 20px;
    margin-bottom: 16px;
    background: var(--tone-neutral-bg);
    border: 1px solid var(--default-border);
    border-radius: 12px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .filter-group > label {
    font-size: 10px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
</style>
