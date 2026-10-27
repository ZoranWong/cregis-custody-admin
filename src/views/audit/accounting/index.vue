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

      <ElButton type="primary" :disabled="!canApply" @click="applyFilters">
        {{ $t('accounting.apply') }}
      </ElButton>
    </div>

    <!-- 未就绪：Overview 需要资产；Transactions 还需要财资单元 -->
    <div
      v-if="!applied.assetKey || (activeTab === 'transactions' && !applied.treasuryUnitId)"
      class="art-card flex flex-col items-center justify-center py-20 text-center"
    >
      <ArtSvgIcon icon="ri:calculator-line" class="text-5xl text-g-300 mb-4" />
      <div class="text-base font-semibold text-g-700 mb-2">
        {{
          applied.assetKey ? $t('accounting.selectUnitFirst') : $t('accounting.selectAssetFirst')
        }}
      </div>
      <div class="text-sm text-g-500">
        {{ applied.assetKey ? $t('accounting.selectUnitHint') : $t('accounting.selectAssetHint') }}
      </div>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="art-card p-5">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Load error -->
      <div v-else-if="loadError" class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadActiveTab">{{ $t('console.refresh') }}</ElButton>
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
                  <span class="legend-dot bg-[var(--tone-info-mark)]" />
                  {{ $t('accounting.availableBalance') }}
                </span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                  <span class="legend-dot bg-[var(--tone-progress-mark)]" />
                  {{ $t('accounting.frozenBalance') }}
                </span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-g-500">
                  <span class="legend-dot bg-[var(--tone-purple-mark)]" />
                  {{ $t('accounting.holdBalance') }}
                </span>
              </div>
            </div>
            <div class="p-4">
              <div v-if="statsError" class="flex items-center gap-3 py-6 text-tone-error-text">
                <ArtSvgIcon icon="ri:error-warning-line" class="text-icon-lg" />
                <span class="text-sm">{{ statsError }}</span>
                <ElButton size="small" @click="loadTrend">{{ $t('console.refresh') }}</ElButton>
              </div>
              <ArtBarChart
                v-else
                :data="balanceTrendData"
                :xAxisData="trendLabels"
                :stack="true"
                height="260px"
                :show-data-zoom="trendLabels.length > 20"
                :tooltip-formatter="balanceTooltipFormatter"
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
                bar-width="26%"
                bar-category-gap="40%"
                height="240px"
                :is-empty="trendLabels.length === 0"
              />
            </div>
          </div>
        </div>

        <!-- ===== Transactions Tab ===== -->
        <div v-else>
          <div class="art-card art-table-card overflow-hidden">
            <div class="p-4 border-b border-[var(--default-border)]">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="text-base font-semibold text-g-900">
                  {{ $t('accounting.transactions') }}
                </h3>
                <span class="text-xs font-normal text-g-500">
                  {{ txAccountNote || $t('accounting.txHint') }}
                </span>
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
                    }}{{ formatBaseAmount(row.amount, rowDecimals(row)) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.preBalance')" width="150" align="right">
                <template #default="{ row }">
                  <span class="text-xs tabular-nums text-g-500">{{
                    formatBaseAmount(row.preBalance, rowDecimals(row))
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('accounting.postBalance')" width="150" align="right">
                <template #default="{ row }">
                  <span class="text-xs font-semibold tabular-nums text-g-900">{{
                    formatBaseAmount(row.postBalance, rowDecimals(row))
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
                v-if="txRequestSource === 'account'"
                :label="$t('accounting.fee')"
                width="120"
                align="right"
              >
                <template #default="{ row }">
                  <span class="text-xs tabular-nums text-g-600">{{
                    row.fee ? formatBaseAmount(row.fee, rowDecimals(row)) : '—'
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
                <div v-if="txError" class="py-10 text-center">
                  <p class="text-tone-error-text mb-3">{{ txError }}</p>
                  <ElButton size="small" @click="reloadTransactions">{{
                    $t('console.refresh')
                  }}</ElButton>
                </div>
                <div v-else class="p-10 text-center text-g-500">
                  {{ $t('accounting.noTransactions') }}
                </div>
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
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import BigNumber from 'bignumber.js'
  import { compactHex, formatTime } from '@/utils/format'
  import { getCssVar } from '@/utils/ui'
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

  // 默认选中「本月」，与看板默认展示的最近一个月对齐
  const defaultRange = (() => {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
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
  /** 趋势接口错误（与整页错误分开，避免一个接口失败导致整页空白） */
  const statsError = ref('')
  /** 流水接口错误（账户级接口在 SIT 目前固定 500，需要单独提示而不是静默空表） */
  const txError = ref('')

  // ─── Dashboard data ───
  const stats = ref<AccountStatView[]>([])
  /** 趋势/汇总换算用的精度（通常等于 decimals，兜底时按接口返回币种反查） */
  const trendDecimals = ref(0)
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
    const dec = trendDecimals.value || decimals.value
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

  /**
   * 余额趋势柱状图：每根柱子对应当日余额值。
   * 按「相对上一根的涨跌」着色（涨绿 / 跌红），与图例 Increase / Decrease 一致。
   */
  /** 读取 CSS 变量为真实色值 —— Canvas 的 addColorStop 不认 var() */
  function cssColor(name: string, fallback: string): string {
    return getCssVar(name).trim() || fallback
  }

  /**
   * 余额趋势：堆叠柱展示 可用 / 冻结 / 隔离 三类金额（三者之和 = 总余额）。
   * 逐日原始值由 stats 提供，这里按当前币种精度换算成主币种数值。
   */
  const balanceTrendData = computed(() => {
    const points = stats.value
    if (!points.length) return []
    const dec = trendDecimals.value || decimals.value
    const unit = new BigNumber(10).pow(dec)
    const toNum = (v: string | number | undefined) => new BigNumber(v || 0).div(unit).toNumber()
    return [
      {
        name: t('accounting.availableBalance'),
        data: points.map((p) => toNum(p.availableBalance)),
        color: cssColor('--tone-info-mark', '#3c96ff'),
        stack: 'balance'
      },
      {
        name: t('accounting.frozenBalance'),
        data: points.map((p) => toNum(p.freezeBalance)),
        color: cssColor('--tone-progress-mark', '#bc8733'),
        stack: 'balance'
      },
      {
        name: t('accounting.holdBalance'),
        data: points.map((p) => toNum(p.holdBalance)),
        color: cssColor('--tone-purple-mark', '#a855f7'),
        stack: 'balance'
      }
    ]
  })

  /** tooltip formatter：三项明细 + 总金额 */
  const balanceTooltipFormatter = (params: Array<{ dataIndex: number }>): string => {
    const idx = params[0]?.dataIndex ?? 0
    const point = stats.value[idx]
    if (!point) return ''
    const dec = trendDecimals.value || decimals.value
    const unit = new BigNumber(10).pow(dec)
    const fmt = (v: string | number | undefined) => new BigNumber(v || 0).div(unit).toFormat()
    const rows: Array<[string, string]> = [
      [t('accounting.availableBalance'), fmt(point.availableBalance)],
      [t('accounting.frozenBalance'), fmt(point.freezeBalance)],
      [t('accounting.holdBalance'), fmt(point.holdBalance)]
    ]
    const body = rows
      .map(
        ([label, value]) =>
          `<div style="display:flex;justify-content:space-between;gap:16px"><span>${label}</span><b>${value}</b></div>`
      )
      .join('')
    return `<div style="font-weight:600;margin-bottom:4px">${point.statDate}</div>${body}
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(128,128,128,.35)">
        <span>${t('accounting.totalBalance')}</span><b>${fmt(point.totalBalance)}</b>
      </div>`
  }

  /**
   * 每日资金流：正负柱状图。
   * 入金取正值、出金取负值，各自独立 stack，零轴自然居中；
   * 两个 stack 组之间留一点间距，避免两类柱子贴在一起。
   */
  const fundFlowData = computed(() => [
    {
      name: t('accounting.inflow'),
      data: trend.value.map((p) => p.inflow),
      color: cssColor('--tone-done-mark', '#00a578'),
      stack: 'in'
    },
    {
      name: t('accounting.outflow'),
      data: trend.value.map((p) => -p.outflow),
      color: cssColor('--tone-error-mark', '#ff4c4c'),
      stack: 'out'
    }
  ])

  // ─── Transactions ───
  /**
   * 接口选择完全由筛选条件决定：
   *   未选 Account → 单元级流水 POST /list/unit
   *   选了 Account → 账户级流水 POST /list/account（带 cusAccountId）
   * 页面上不再提供手动切换。
   */
  const txSource = computed<'unit' | 'account'>(() => (applied.accountType ? 'account' : 'unit'))
  /** 本次请求实际落到的接口（账户解析失败时会回退到单元级） */
  const txRequestSource = ref<'unit' | 'account'>('unit')
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

  /**
   * 单行金额的精度：优先用该行自己的 coinId + network 查系统币种，
   * 查不到再退回当前所选资产 —— 避免 appliedAsset 缺失时按 0 精度展示成天数字。
   */
  function rowDecimals(row: { coinId?: string; network?: string }): number {
    const byRow = coinStore.getDecimalsByCoinId(row.coinId, row.network)
    if (byRow) return byRow
    if (decimals.value) return decimals.value
    return coinStore.getDecimalsByCoinId(appliedAsset.value?.coinId, appliedAsset.value?.network)
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
    txError.value = ''
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
      txAccountNote.value = ''
      // 选了 Account 筛选但账户列表还没取到：退回单元级接口，避免直接打出空表
      const useAccountApi = txSource.value === 'account' && accountIds.length > 0
      if (txSource.value === 'account' && accountIds.length === 0) {
        txAccountNote.value = t('accounting.accountFallback')
      } else if (useAccountApi && accountIds.length > 1) {
        txAccountNote.value = t('accounting.multiAccountHint', { count: accountIds.length })
      }
      txRequestSource.value = useAccountApi ? 'account' : 'unit'
      if (useAccountApi) {
        // 资金流水接口一次只能查一个 cusAccountId；多账户时取第一个，并在表头提示
        const res = await fetchFundRecords({ ...base, cusAccountId: accountIds[0] })
        txRows.value = res.records
        txTotal.value = res.total
      } else {
        const res = await fetchAccountingRecords(base)
        txRows.value = res.records
        txTotal.value = res.total
      }
    } catch (caught) {
      txRows.value = []
      txTotal.value = 0
      txError.value = caught instanceof Error ? caught.message : 'Unable to load transactions.'
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
    statsError.value = ''
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
        // 后端忽略 start/end，只按 number 返回「最近 N 个点」，这里按所选周期换算条数
        number: trendPointCount(from, to)
      })
      const list = coinId
        ? (res[coinId] ?? res[coinId.toUpperCase()] ?? [])
        : (Object.values(res)[0] ?? [])
      // 接口按日期倒序返回（新 → 旧），图表与期初余额计算都要求正序
      list.sort((a, b) => String(a.statDate).localeCompare(String(b.statDate)))
      stats.value = list
      // 精度兜底：所选资产解析不到时，用接口返回的 coinId + network 反查系统币种
      if (!decimals.value && list.length) {
        trendDecimals.value = coinStore.getDecimalsByCoinId(list[0]!.coinId, network)
      } else {
        trendDecimals.value = decimals.value
      }
      trend.value = list.map((stat) => {
        const inflow = new BigNumber(stat.totalIncome || 0)
        const outflow = new BigNumber(stat.totalOutcome || 0)
        return {
          statDate: stat.statDate,
          balance: new BigNumber(stat.totalBalance || 0)
            .div(new BigNumber(10).pow(trendDecimals.value))
            .toNumber(),
          inflow: inflow.div(new BigNumber(10).pow(trendDecimals.value)).toNumber(),
          outflow: outflow.div(new BigNumber(10).pow(trendDecimals.value)).toNumber(),
          label: trendLabel(stat.statDate)
        }
      })
    } catch (caught) {
      stats.value = []
      trend.value = []
      statsError.value = caught instanceof Error ? caught.message : 'Unable to load balance trend.'
    }
  }

  /** 所选周期需要多少个聚合点（后端按 number 取最近 N 个，start/end 不生效） */
  function trendPointCount(from: string, to: string): number {
    const start = new Date(`${from}T00:00:00`).getTime()
    const end = new Date(`${to}T00:00:00`).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 30
    const days = Math.floor((end - start) / 86_400_000) + 1
    const unitDays = DATE_TYPE_MAP[granularity.value] === 1 ? 1 : 7
    return Math.max(1, Math.ceil(days / unitDays))
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

  /** 当前 Tab 需要的数据：Overview 只要统计，Transactions 只要流水（按需请求） */
  async function loadActiveTab(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      if (activeTab.value === 'overview') {
        await Promise.all([loadTrend(), loadAccounts()])
      } else if (applied.treasuryUnitId) {
        await loadTransactions()
      }
    } catch (caught) {
      loadError.value = caught instanceof Error ? caught.message : 'Unable to load accounting data.'
    } finally {
      loading.value = false
    }
  }

  /** Apply 可用条件：必须选资产；Transactions Tab 还必须选财资单元 */
  const canApply = computed(
    () => !!filters.assetKey && (activeTab.value === 'overview' || !!filters.treasuryUnitId)
  )

  async function applyFilters(): Promise<void> {
    if (!canApply.value) return
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
    txRows.value = []
    txTotal.value = 0
    await loadActiveTab()
  }

  watch(activeTab, (tab) => {
    if (!applied.assetKey) return
    if (tab === 'transactions' && !applied.treasuryUnitId) return
    // 切 Tab 时只补拉当前 Tab 需要的接口
    if (tab === 'overview') void loadTrend()
    else void loadTransactions()
  })

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
