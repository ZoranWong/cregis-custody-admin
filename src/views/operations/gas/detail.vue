<!-- Cregis Gas Account Detail -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-5"><el-skeleton :rows="3" animated /></div>
      <div class="art-card p-5 mb-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-[var(--el-color-danger)] mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadDetail">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else-if="detail">
      <!-- Header Card -->
      <div class="art-card p-5 mb-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-xl font-semibold text-g-900">{{ detail.account.merchantName || detail.account.ecode || '-' }}</h1>
            <p class="text-sm text-g-500 mt-1">{{ detail.account.network }} · {{ detail.account.coinId }}</p>
          </div>
          <div class="flex gap-2">
            <el-tag :type="healthTagType as any" size="default">{{ healthLabel }}</el-tag>
            <ElButton @click="backToList">{{ $t('gas.backToOverview') }}</ElButton>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.balance') }}</div>
            <div class="text-sm font-medium text-g-900">{{ balanceDisplay(detail.account.balance, detail.account.coinId, detail.account.network) }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.threshold') }}</div>
            <div class="text-sm font-medium text-g-900">{{ thresholdDisplay(detail.account.threshold, detail.account.coinId, detail.account.network) }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.amountPerTopUp') }}</div>
            <div class="text-sm font-medium text-g-900">{{ amountPerTopUpDisplay(detail.account.amountPerTopUp, detail.account.coinId, detail.account.network) }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.autoTopUp') }}</div>
            <div class="text-sm font-medium text-g-900">{{ autoTopUpLabel }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.usdtBalance') }}</div>
            <div class="text-sm font-medium text-g-900">{{ usdtBalanceDisplay(detail.account.usdtBalance, detail.account.network) }}</div>
          </div>
          <div v-if="detail.account.address">
            <div class="text-xs text-g-500 mb-0.5">{{ $t('gas.address') }}</div>
            <div class="text-sm font-medium text-g-900 font-mono">{{ compactAddress(detail.account.address) }}</div>
          </div>
        </div>
      </div>

      <!-- Sub Tab Switcher -->
      <div class="flex flex-wrap items-center gap-3 mb-5">
        <el-radio-group v-model="activeDetailTab" @change="switchDetailTab">
          <el-radio-button v-for="tab in detailTabs" :key="tab.key" :value="tab.key">{{ $t(tab.labelKey) }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Consumption Ledger -->
      <div v-if="activeDetailTab === 'ledger'" class="art-card art-table-card overflow-hidden mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-g-500">{{ $t('gas.timeRange') }}</span>
            <div class="flex gap-2">
              <button v-for="r in timeRanges" :key="r.key"
                class="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
                :class="ledgerTimeRange === r.key ? 'bg-g-900 text-white border-g-900' : 'bg-white text-g-600 border-[var(--default-border)] hover:bg-g-50'"
                @click="applyLedgerTimeRange(r.key)">{{ r.label }}</button>
            </div>
            <el-input v-model="ledgerTxIdFilter" :placeholder="$t('gas.searchTxId')" clearable class="!w-48" @clear="applyLedgerFilters" @keyup.enter="applyLedgerFilters">
              <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
            </el-input>
            <ElButton @click="applyLedgerFilters">{{ $t('gas.search') }}</ElButton>
            <ElButton @click="resetLedgerFilters">{{ $t('gas.reset') }}</ElButton>
          </div>
        </div>
        <template v-if="ledgerLoading">
          <el-skeleton :rows="8" animated class="p-5" />
        </template>
        <el-table v-else :data="consumptionRows" stripe size="small">
          <template #empty><div class="p-10 text-center text-g-500">{{ $t('gas.noRecords') }}</div></template>
          <el-table-column :label="$t('gas.time')" width="160">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column :label="$t('gas.txId')" width="180">
            <template #default="{ row }"><span class="font-mono text-xs">{{ compactTx(row.txId) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('gas.feeAmount')" width="180">
            <template #default="{ row }">
              <div>{{ feeDisplay(row.amount, row.coinId, row.network) }}</div>
              <div class="text-xs text-g-500">({{ feeReadable(row.amount, row.coinId, row.network) }} {{ row.coinId }})</div>
            </template>
          </el-table-column>
          <el-table-column prop="network" :label="$t('gas.network')" width="120" />
          <el-table-column :label="$t('gas.from')" min-width="160">
            <template #default="{ row }"><span class="font-mono text-xs">{{ compactAddress(row.fromAddress) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('gas.to')" min-width="160">
            <template #default="{ row }"><span class="font-mono text-xs">{{ compactAddress(row.toAddress) }}</span></template>
          </el-table-column>
        </el-table>
        <div v-if="ledgerPagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
          <span class="text-xs text-g-500">{{ ledgerPagination.totalCount }} records</span>
          <el-pagination v-model:current-page="ledgerPage" v-model:page-size="ledgerPageSize" :total="ledgerPagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>goLedgerPage(v)" @size-change="(v:number)=>{ledgerPageSize=v;goLedgerPage(1)}" />
        </div>
      </div>

      <!-- Top-up Records -->
      <div v-if="activeDetailTab === 'topup'" class="art-card art-table-card overflow-hidden mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex gap-1 mr-4">
              <button v-for="s in topUpStatuses" :key="s.value"
                class="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
                :class="topUpStatusFilter === s.value ? s.activeClass : 'bg-white text-g-600 border-[var(--default-border)] hover:bg-g-50'"
                @click="topUpStatusFilter = s.value; goTopUpPage(1)">{{ $t(s.labelKey) }}</button>
            </div>
            <span class="text-xs text-g-500">{{ $t('gas.timeRange') }}</span>
            <div class="flex gap-2">
              <button v-for="r in timeRanges" :key="r.key"
                class="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
                :class="topUpTimeRange === r.key ? 'bg-g-900 text-white border-g-900' : 'bg-white text-g-600 border-[var(--default-border)] hover:bg-g-50'"
                @click="applyTopUpTimeRange(r.key)">{{ r.label }}</button>
            </div>
            <el-input v-model="topUpTxIdFilter" :placeholder="$t('gas.searchTxId')" clearable class="!w-48" @clear="goTopUpPage(1)" @keyup.enter="goTopUpPage(1)">
              <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
            </el-input>
          </div>
        </div>
        <template v-if="topUpLoading">
          <el-skeleton :rows="8" animated class="p-5" />
        </template>
        <el-table v-else :data="topUpRows" stripe size="small">
          <template #empty><div class="p-10 text-center text-g-500">{{ $t('gas.noRecords') }}</div></template>
          <el-table-column :label="$t('gas.time')" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column :label="$t('gas.orderId')" width="150">
            <template #default="{ row }"><span class="font-mono text-xs">{{ row.topUpRef }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('gas.status')" width="130">
            <template #default="{ row }"><el-tag :type="topUpStatusTagType(row.status, row.isStale) as any" size="small">{{ gasTopUpStatusLabel(row.status, row.isStale) }}</el-tag></template>
          </el-table-column>
          <el-table-column :label="$t('gas.requestAmount')" width="180">
            <template #default="{ row }">
              <div v-if="row.amount">{{ feeDisplay(Number(row.amount), row.coinId, row.network) }}</div>
              <div v-if="row.amount" class="text-xs text-g-500">({{ feeReadable(Number(row.amount), row.coinId, row.network) }} {{ row.coinId }})</div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('gas.actualAmount')" width="180">
            <template #default="{ row }">
              <div v-if="row.cost">{{ feeDisplay(Number(row.cost), row.coinId, row.network) }}</div>
              <div v-if="row.cost" class="text-xs text-g-500">({{ feeReadable(Number(row.cost), row.coinId, row.network) }} {{ row.coinId }})</div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('gas.txId')" width="180">
            <template #default="{ row }"><span v-if="row.txId" class="font-mono text-xs">{{ compactTx(row.txId) }}</span><span v-else>-</span></template>
          </el-table-column>
          <el-table-column :label="$t('gas.stale')" width="80">
            <template #default="{ row }"><span v-if="row.isStale" class="text-[var(--el-color-warning)] font-medium">{{ $t('gas.timeout') }}</span><span v-else>-</span></template>
          </el-table-column>
        </el-table>
        <div v-if="topUpPagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
          <span class="text-xs text-g-500">{{ topUpPagination.totalCount }} records</span>
          <el-pagination v-model:current-page="topUpPage" v-model:page-size="topUpPageSize" :total="topUpPagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>goTopUpPage(v)" @size-change="(v:number)=>{topUpPageSize=v;goTopUpPage(1)}" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="art-card p-10 text-center text-g-500">{{ $t('gas.accountNotFound') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchGasAccountDetail, fetchGasConsumption, fetchGasTopUps, type GasConsumptionQuery, type GasTopUpQuery } from '@/api/operationsGas'
import { useCoinStore } from '@/store/modules/coins'
import { formatCoinBalance, formatTime, compactHex, formatGasFee } from '@/utils/format'
import { getBaseUnitName } from '@/config/coinUnits'
import { gasTopUpStatusLabel } from '@/features/ops/gas/status'
import type { GasAccountDetailView, GasConsumptionItemView, GasConsumptionResponseView, GasTopUpItemView, GasTopUpResponseView, GasOperationsPaginationView } from '@/features/ops/gas/types'

defineOptions({ name: 'GasAccountDetail' })
const route = useRoute()
const router = useRouter()
const coinStore = useCoinStore()

onMounted(async () => { await coinStore.ensureLoaded() })

function getDecimals(coinId: string, network: string): number { return coinStore.getDecimals(coinId, network) }
function getUnit(coinId: string, network: string): string { return coinStore.getUnit(coinId, network) || '' }

const cusAccountId = computed(() => Number(route.params.cusAccountId) || 0)

// Detail
const loading = ref(true)
const loadError = ref('')
const detail = ref<GasAccountDetailView | null>(null)

// Ledger
const validDetailTabs = ['ledger', 'topup'] as const
const activeDetailTab = ref<'ledger' | 'topup'>(validDetailTabs.includes(route.query.tab as any) ? (route.query.tab as 'ledger' | 'topup') : 'ledger')
const ledgerLoading = ref(false)
const ledgerTxIdFilter = ref('')
const ledgerTimeRange = ref<string>('')
const ledgerPage = ref(1)
const ledgerPageSize = ref(10)
const ledgerData = ref<GasConsumptionResponseView | null>(null)

// Top-up
const topUpLoading = ref(false)
const topUpTxIdFilter = ref('')
const topUpTimeRange = ref<string>('')
const topUpStatusFilter = ref('')
const topUpPage = ref(1)
const topUpPageSize = ref(10)
const topUpData = ref<GasTopUpResponseView | null>(null)

const detailTabs = [
  { key: 'ledger', labelKey: 'gas.consumptionLedger' },
  { key: 'topup', labelKey: 'gas.topUpRecords' }
]
const timeRanges = [
  { key: '1h', label: '1h' },
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' }
]
const topUpStatuses = [
  { value: '', labelKey: 'gas.all', activeClass: 'bg-g-700 text-white border-g-700' },
  { value: 'failed', labelKey: 'gas.statusFailed', activeClass: 'bg-[var(--el-color-danger)] text-white border-[var(--el-color-danger)]' },
  { value: 'stale', labelKey: 'gas.statusStale', activeClass: 'bg-[var(--el-color-warning)] text-white border-[var(--el-color-warning)]' },
  { value: 'processing', labelKey: 'gas.statusProcessing', activeClass: 'bg-[var(--el-color-primary)] text-white border-[var(--el-color-primary)]' },
  { value: 'succeeded', labelKey: 'gas.statusSucceeded', activeClass: 'bg-[var(--el-color-success)] text-white border-[var(--el-color-success)]' }
]

// Computed
const consumptionRows = computed<GasConsumptionItemView[]>(() => ledgerData.value?.items ?? [])
const ledgerPagination = computed<GasOperationsPaginationView>(() => ledgerData.value?.pagination ?? { page: 1, pageSize: 10, totalPages: 0, totalCount: 0 })
const topUpRows = computed<GasTopUpItemView[]>(() => {
  let items = topUpData.value?.items ?? []
  if (topUpStatusFilter.value === 'stale') items = items.filter(r => r.isStale)
  else if (topUpStatusFilter.value) items = items.filter(r => r.status === topUpStatusFilter.value)
  if (topUpTxIdFilter.value) { const q = topUpTxIdFilter.value.toLowerCase(); items = items.filter(r => r.txId?.toLowerCase().includes(q)) }
  return items
})
const topUpPagination = computed<GasOperationsPaginationView>(() => topUpData.value?.pagination ?? { page: 1, pageSize: 10, totalPages: 0, totalCount: 0 })

const healthLabel = computed(() => detail.value?.account.health?.healthState?.replace(/_/g, ' ') ?? '-')
const healthTagType = computed(() => {
  const s = detail.value?.account.health?.healthState
  if (s === 'healthy') return 'success'
  if (s === 'low_balance' || s === 'top_up_pending_or_stale' || s === 'unknown') return 'warning'
  if (s === 'top_up_failed' || s === 'missing_account') return 'danger'
  return 'info'
})
const autoTopUpLabel = computed(() => {
  const v = detail.value?.account.autoTopUpEnabled
  if (v === true) return 'Enabled'
  if (v === false) return 'Disabled'
  return 'Unavailable'
})

// Display helpers
function balanceDisplay(b: string | null, coinId: string, network: string): string {
  if (!b) return '-'
  const d = getDecimals(coinId, network)
  if (!d) return b
  return formatCoinBalance(b, d) + ' ' + getUnit(coinId, network).toUpperCase()
}
function thresholdDisplay(t: string | null, coinId: string, network: string): string {
  if (!t) return '-'
  const d = getDecimals(coinId, network)
  if (!d) return t
  return formatCoinBalance(t, d) + ' ' + getUnit(coinId, network).toUpperCase()
}
function amountPerTopUpDisplay(a: string | null, coinId: string, network: string): string {
  if (!a) return '-'
  const d = getDecimals(coinId, network)
  if (!d) return a
  return formatCoinBalance(a, d) + ' ' + getUnit(coinId, network).toUpperCase()
}
function usdtBalanceDisplay(raw: string | null, network: string): string {
  if (!raw) return '-'
  const d = getDecimals('USDT', network) || 6
  return formatCoinBalance(raw, d) + ' USDT'
}
function feeDisplay(amount: number, coinId: string, network: string): string {
  return formatGasFee(amount, getBaseUnitName(coinId))
}
function feeReadable(amount: number, coinId: string, network: string): string {
  const decimals = getDecimals(coinId, network)
  if (!decimals) return String(amount)
  const num = Number(amount) / Math.pow(10, decimals)
  return num.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '')
}

// Actions
async function loadDetail(): Promise<void> {
  loading.value = true; loadError.value = ''
  try { detail.value = await fetchGasAccountDetail({ cusAccountId: cusAccountId.value }) as GasAccountDetailView }
  catch (e) { loadError.value = e instanceof Error ? e.message : 'Failed to load account detail.' }
  finally { loading.value = false }
}
async function loadLedger(overrides: Partial<GasConsumptionQuery> = {}): Promise<void> {
  ledgerLoading.value = true
  try {
    ledgerData.value = await fetchGasConsumption({
      cusAccountId: cusAccountId.value, page: ledgerPage.value, pageSize: ledgerPageSize.value,
      sortDirection: 'desc', ...overrides
    }) as GasConsumptionResponseView
  } catch { /* toast handled by composable */ }
  finally { ledgerLoading.value = false }
}
async function loadTopUps(overrides: Partial<GasTopUpQuery> = {}): Promise<void> {
  topUpLoading.value = true
  try {
    topUpData.value = await fetchGasTopUps({
      ecode: detail.value?.account.ecode, network: detail.value?.account.network,
      coinId: detail.value?.account.coinId, address: detail.value?.account.address ?? undefined,
      page: topUpPage.value, pageSize: topUpPageSize.value, sortDirection: 'desc',
      ...overrides
    }) as GasTopUpResponseView
  } catch { /* toast handled by composable */ }
  finally { topUpLoading.value = false }
}

function timeRangeDates(range: string): { startTime: string; endTime: string } {
  const now = new Date()
  const hours = range === '1h' ? 1 : range === '24h' ? 24 : range === '7d' ? 168 : 720
  const start = new Date(now.getTime() - hours * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return { startTime: fmt(start), endTime: fmt(now) }
}

function switchDetailTab(key: 'ledger' | 'topup'): void {
  activeDetailTab.value = key
  router.replace({ query: { ...route.query, tab: key } }).catch(() => {})
  if (key === 'ledger') loadLedger()
  else loadTopUps()
}
function applyLedgerTimeRange(r: string): void { ledgerTimeRange.value = r; const {startTime,endTime}=timeRangeDates(r); loadLedger({startTime,endTime,page:1}) }
function applyLedgerFilters(): void {
  const overrides: Partial<GasConsumptionQuery> = { page: 1 }
  if (ledgerTimeRange.value) { const {startTime,endTime}=timeRangeDates(ledgerTimeRange.value); overrides.startTime=startTime; overrides.endTime=endTime }
  if (ledgerTxIdFilter.value) overrides.txId = ledgerTxIdFilter.value
  loadLedger(overrides)
}
function resetLedgerFilters(): void { ledgerTimeRange.value=''; ledgerTxIdFilter.value=''; loadLedger() }
function goLedgerPage(p: number): void { ledgerPage.value=p; applyLedgerFilters() }

function applyTopUpTimeRange(r: string): void { topUpTimeRange.value = r; const {startTime,endTime}=timeRangeDates(r); loadTopUps({startTime,endTime,page:1}) }
function goTopUpPage(p: number): void {
  topUpPage.value = p
  const overrides: Partial<GasTopUpQuery> = { page: p }
  if (topUpTimeRange.value) { const {startTime,endTime}=timeRangeDates(topUpTimeRange.value); overrides.startTime=startTime; overrides.endTime=endTime }
  if (topUpStatusFilter.value && topUpStatusFilter.value !== 'stale') overrides.status = topUpStatusFilter.value
  loadTopUps(overrides)
}

function topUpStatusTagType(status: string, isStale: boolean): string {
  if (isStale || status === 'failed') return 'danger'
  if (status === 'submitted' || status === 'processing') return 'warning'
  if (status === 'succeeded' || status === 'fulfilled_recorded') return 'success'
  return 'info'
}

function compactAddress(addr: string | null): string { return compactHex(addr, 6, 4) }
function compactTx(tx: string): string { return compactHex(tx, 8, 6) }
function backToList(): void { router.push({ name: 'GasOperations' }) }

onMounted(async () => {
  await loadDetail()
  if (detail.value) loadLedger()
})
</script>