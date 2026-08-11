<!-- Cregis Merchant Fee Detail -->
<template>
  <div class="page-content">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <ElButton @click="back">
        <svg viewBox="0 0 24 24" width="14" height="14"><polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        {{ $t('gas.backToOverview') }}
      </ElButton>
      <h1 class="text-xl font-semibold text-g-900">{{ merchantName }}</h1>
    </div>

    <template v-if="loading">
      <div class="grid grid-cols-3 gap-4 mb-5"><div v-for="i in 3" :key="i" class="art-card p-5"><el-skeleton :rows="2" animated /></div></div>
      <div class="art-card p-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-[var(--el-color-danger)] mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadData">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else>
      <!-- Mode Toggle + Date Range -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <el-radio-group v-model="viewMode" @change="(v: string) => v === 'topups' ? switchToTopups() : (viewMode = 'fees', router.replace({ query: { ...route.query } }).catch(() => {}))">
          <el-radio-button value="fees">{{ $t('fee.fees') }}</el-radio-button>
          <el-radio-button value="topups">{{ $t('fee.topUps') }}</el-radio-button>
        </el-radio-group>
        <div class="flex items-center gap-2">
          <el-select v-if="viewMode === 'fees'" v-model="selectedNetwork" class="!w-36" @change="onNetworkChange">
            <el-option v-for="net in networks" :key="net" :label="net" :value="net" />
          </el-select>
          <el-date-picker v-model="dateRangeValue" type="daterange" range-separator="—" :start-placeholder="$t('fee.from')" :end-placeholder="$t('fee.to')" format="YYYY-MM-DD" size="default" style="width: 260px" />
          <ElButton type="primary" @click="applyDateRange">{{ $t('fee.apply') }}</ElButton>
          <ElButton @click="resetDateRange">{{ $t('gas.reset') }}</ElButton>
        </div>
      </div>

      <!-- ===== Fees Mode ===== -->
      <div v-if="viewMode === 'fees'">
        <ElRow :gutter="20" class="flex mb-5">
          <ElCol :sm="12" :md="8" v-for="card in summaryCards" :key="card.key">
            <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-5 max-sm:mb-4">
              <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
              <span class="text-[22px] font-medium mt-1 text-g-900">{{ card.value }}</span>
            </div>
          </ElCol>
        </ElRow>

        <!-- Fees & Tx Count Table -->
        <div class="art-card art-table-card overflow-hidden mb-5">
          <div class="p-4 border-b border-[var(--default-border)]"><h3 class="text-base font-semibold text-g-900">{{ $t('fee.feeDaily') }}</h3></div>
          <el-table :data="dailyItems" stripe size="small">
            <template #empty><div class="p-10 text-center text-g-500">{{ $t('fee.noMerchantFeeData') }}</div></template>
            <el-table-column prop="statDate" :label="$t('fee.date')" width="140" />
            <el-table-column :label="$t('fee.feeCollectedShort')" width="200">
              <template #default="{ row }"><span class="text-sm font-medium text-g-900">${{ formatNumber(row.feeCollectedUsdt) }}</span></template>
            </el-table-column>
            <el-table-column :label="$t('fee.txCount')" width="120">
              <template #default="{ row }">{{ formatNumber(row.txCount) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fee.avgFeePerTx')" width="160">
              <template #default="{ row }">${{ formatDecimal(row.avgFeePerTxUsdt) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="dailyPagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
            <span class="text-xs text-g-500">{{ dailyPagination.totalCount }} records</span>
            <el-pagination v-model:current-page="dailyPage" v-model:page-size="dailyPageSize" :total="dailyPagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>goDailyPage(v)" @size-change="(v:number)=>{dailyPageSize=v;goDailyPage(1)}" />
          </div>
        </div>

        <!-- Native Coin Consumption -->
        <div class="art-card art-table-card overflow-hidden mb-5">
          <div class="p-4 border-b border-[var(--default-border)]"><h3 class="text-base font-semibold text-g-900">{{ $t('fee.nativeCoin') }}</h3></div>
          <el-table :data="nativeCoins" stripe size="small">
            <template #empty><div class="p-10 text-center text-g-500">{{ $t('fee.noConsumptionData') }}</div></template>
            <el-table-column :label="$t('gas.network')" width="160">
              <template #default="{ row }"><span class="text-sm font-medium text-g-900">{{ row.network }}</span></template>
            </el-table-column>
            <el-table-column :label="$t('fee.nativeCoin')" width="120">
              <template #default="{ row }">{{ row.nativeCoin }}</template>
            </el-table-column>
            <el-table-column :label="$t('fee.totalConsumed')" width="200">
              <template #default="{ row }">
                <div>{{ formatNativeAmount(row.totalConsumed, row.network, row.nativeCoin) }}</div>
                <div class="text-xs text-g-500">({{ formatCoinBalance(row.totalConsumed, getMainCoinDecimals(row.network)) }} {{ row.nativeCoin }})</div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fee.txCount')" width="100">
              <template #default="{ row }">{{ formatNumber(row.txCount) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fee.avgPerTx')" width="200">
              <template #default="{ row }">
                <div>{{ formatNativeAmount(row.avgPerTx, row.network, row.nativeCoin) }}</div>
                <div class="text-xs text-g-500">({{ formatCoinBalance(row.avgPerTx, getMainCoinDecimals(row.network)) }} {{ row.nativeCoin }})</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- ===== Top-ups Mode ===== -->
      <div v-if="viewMode === 'topups'">
        <ElRow :gutter="20" class="flex mb-5">
          <ElCol :sm="12" :md="8" v-for="card in topUpSummaryCards" :key="card.key">
            <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-5 max-sm:mb-4">
              <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
              <span class="text-[22px] font-medium mt-1 text-g-900">{{ card.value }}</span>
            </div>
          </ElCol>
        </ElRow>

        <div class="art-card art-table-card overflow-hidden mb-5">
          <div class="p-4 border-b border-[var(--default-border)]"><h3 class="text-base font-semibold text-g-900">{{ $t('fee.topUpRecords') }}</h3></div>
          <el-table :data="topupItems" stripe size="small">
            <template #empty><div class="p-10 text-center text-g-500">{{ $t('fee.noTopUpRecords') }}</div></template>
            <el-table-column :label="$t('gas.time')" width="160">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fee.chainNetwork')" width="140">
              <template #default="{ row }"><span class="text-sm font-medium text-g-900">{{ row.network }}</span></template>
            </el-table-column>
            <el-table-column :label="$t('fee.txHash')" width="180">
              <template #default="{ row }"><span class="font-mono text-xs">{{ compactTx(row.txId) }}</span></template>
            </el-table-column>
            <el-table-column :label="$t('fee.topUpAmountUSDT')" width="180">
              <template #default="{ row }"><span class="text-sm font-medium text-g-900">{{ formatUsdtAmount(String(row.amount)) }}</span></template>
            </el-table-column>
            <el-table-column :label="$t('fee.creditBalanceAfter')" width="180">
              <template #default="{ row }">—</template>
            </el-table-column>
            <el-table-column :label="$t('gas.status')" width="100">
              <template #default="{ row }">—</template>
            </el-table-column>
          </el-table>
          <div v-if="topupPagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
            <span class="text-xs text-g-500">{{ topupPagination.totalCount }} records</span>
            <el-pagination v-model:current-page="topupPage" v-model:page-size="topupPageSize" :total="topupPagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>goTopupPage(v)" @size-change="(v:number)=>{topupPageSize=v;goTopupPage(1)}" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoinStore } from '@/store/modules/coins'
import { storeToRefs } from 'pinia'
import { formatCoinBalance, formatTime, compactHex, formatDateRangeValue } from '@/utils/format'
import { getBaseUnitName } from '@/config/coinUnits'
import { formatGasFee } from '@/utils/format'
import { ElDatePicker } from 'element-plus'
import 'element-plus/es/components/date-picker/style/css'
import {
  fetchFeeOverview, fetchMerchantFeeDaily, fetchNativeCoinConsumption,
  fetchTopUpOverview, fetchUSDTRecord,
  type FeeMerchantDailyQuery, type FeeNativeCoinQuery
} from '@/api/operationsFee'
import type {
  FeeOverviewView, FeeMerchantDailyItemView, FeeMerchantDailyResponseView,
  NativeCoinConsumptionView, TopUpOverviewView, MerchantBillingRecordView, MerchantBillingRecordResponseView
} from '@/features/ops/fee/types'

defineOptions({ name: 'MerchantFeeMonitor' })
const route = useRoute()
const router = useRouter()
const coinStore = useCoinStore()
const { list: coinList } = storeToRefs(coinStore)

onMounted(async () => { await coinStore.ensureLoaded() })

const merchantEcode = computed(() => (route.params.merchantEcode as string) || '')
const merchantName = computed(() => (route.query.merchantName as string) || 'Merchant Detail')

const loading = ref(false)
const loadError = ref('')
const viewMode = ref<'fees' | 'topups'>((route.query.tab as string) === 'topups' ? 'topups' : 'fees')
const selectedNetwork = ref('')
const dateRange = reactive({ from: '', to: '' })
const dateRangeValue = ref<[Date, Date] | null>(null)
const appliedDateRange = reactive({ from: '', to: '' })

// Fees
const overview = ref<FeeOverviewView | null>(null)
const daily = ref<FeeMerchantDailyResponseView | null>(null)
const nativeCoins = ref<NativeCoinConsumptionView[]>([])
const dailyPage = ref(1)
const dailyPageSize = ref(10)

// Top-ups
const topupLoading = ref(false)
const topupOverview = ref<TopUpOverviewView | null>(null)
const topupData = ref<MerchantBillingRecordResponseView | null>(null)
const topupPage = ref(1)
const topupPageSize = ref(10)

const networks = computed(() => {
  const seen = new Set<string>();
  (coinList.value ?? []).forEach(c => { if (c.network) seen.add(c.network) })
  return Array.from(seen).sort()
})

const summaryCards = computed(() => [
  { key: 'feeCollected', labelKey: 'fee.feeCollectedShort', value: '$' + formatNumber(overview.value?.feeCollectedUsdt ?? 0) },
  { key: 'txCount', labelKey: 'fee.totalTxCount', value: formatNumber(overview.value?.txCount ?? 0) },
  { key: 'avgFee', labelKey: 'fee.avgFeePerTx', value: '$' + formatDecimal(overview.value?.avgFeePerTxUsdt ?? 0) }
])

const topUpSummaryCards = computed(() => [
  { key: 'balance', labelKey: 'fee.creditBalance', value: formatUsdtAmount(topupOverview.value?.balance ?? null) },
  { key: 'topUpBalance', labelKey: 'fee.topUpAmount', value: formatUsdtAmount(topupOverview.value?.topUpBalance ?? null) },
  { key: 'records', labelKey: 'fee.topUpRecordCount', value: formatNumber(topupOverview.value?.topUpRecords ?? 0) }
])

const dailyItems = computed<FeeMerchantDailyItemView[]>(() => daily.value?.records ?? [])
const dailyPagination = computed(() => ({
  page: daily.value?.current ?? 1, pageSize: daily.value?.size ?? 10,
  totalPages: daily.value?.pages ?? 0, totalCount: daily.value?.total ?? 0
}))

const topupItems = computed<MerchantBillingRecordView[]>(() => topupData.value?.records ?? [])
const topupPagination = computed(() => ({
  page: topupData.value?.current ?? 1, totalPages: topupData.value?.pages ?? 0,
  totalCount: topupData.value?.total ?? 0, size: topupData.value?.size ?? 10
}))

function getMainCoinDecimals(network: string): number { return coinStore.getMainCoinDecimals(network) }

function formatNumber(n: number): string { return Number(n).toLocaleString('en-US') }
function formatDecimal(n: number): string { return Number(n).toFixed(2) }
function formatUsdtAmount(raw: string | null): string {
  if (!raw) return '$0'
  const num = Number(raw)
  if (!num) return '$0'
  return '$' + (num / 1_000_000).toFixed(2).replace(/\.00$/, '')
}
function formatNativeAmount(raw: string, network: string, nativeCoin: string): string {
  return formatGasFee(raw, getBaseUnitName(nativeCoin))
}
function compactTx(txId: string): string { return compactHex(txId, 6, 4) }

function syncQuery(): void {
  const query: Record<string, any> = { ...route.query }
  if (selectedNetwork.value) query.network = selectedNetwork.value; else delete query.network
  if (appliedDateRange.from) query.from = appliedDateRange.from; else delete query.from
  if (appliedDateRange.to) query.to = appliedDateRange.to; else delete query.to
  router.replace({ query }).catch(() => {})
}

async function loadData(): Promise<void> {
  const ecode = merchantEcode.value; if (!ecode) return
  loading.value = true; loadError.value = ''
  try {
    const overviewQ: any = { ecode }; if (appliedDateRange.from) overviewQ.startDate = appliedDateRange.from; if (appliedDateRange.to) overviewQ.endDate = appliedDateRange.to; if (selectedNetwork.value) overviewQ.network = selectedNetwork.value
    const dailyQ: FeeMerchantDailyQuery = { ecode, pageNum: dailyPage.value, pageSize: dailyPageSize.value }; if (appliedDateRange.from) dailyQ.startDate = appliedDateRange.from; if (appliedDateRange.to) dailyQ.endDate = appliedDateRange.to; if (selectedNetwork.value) dailyQ.network = selectedNetwork.value
    const coinQ: FeeNativeCoinQuery = { ecode }; if (appliedDateRange.from) coinQ.startDate = appliedDateRange.from; if (appliedDateRange.to) coinQ.endDate = appliedDateRange.to; if (selectedNetwork.value) coinQ.network = selectedNetwork.value
    const [ov, d, nc] = await Promise.all([fetchFeeOverview(overviewQ), fetchMerchantFeeDaily(dailyQ), fetchNativeCoinConsumption(coinQ)])
    overview.value = ov; daily.value = d; nativeCoins.value = nc
  } catch (e) { loadError.value = e instanceof Error ? e.message : 'Failed to load merchant data.' }
  finally { loading.value = false }
}

function applyDateRange(): void {
  if (dateRangeValue.value) { const { from, to } = formatDateRangeValue(dateRangeValue.value); dateRange.from = from; dateRange.to = to }
  appliedDateRange.from = dateRange.from; appliedDateRange.to = dateRange.to
  syncQuery(); loadData()
}
function resetDateRange(): void { dateRangeValue.value = null; dateRange.from = ''; dateRange.to = ''; appliedDateRange.from = ''; appliedDateRange.to = ''; syncQuery(); loadData() }
function onNetworkChange(): void { syncQuery(); loadData() }
function goDailyPage(p: number): void { dailyPage.value = p; loadData() }

async function loadTopups(p?: number): Promise<void> {
  topupLoading.value = true
  try {
    const base = { ecode: merchantEcode.value, startDate: appliedDateRange.from || dateRange.from, endDate: appliedDateRange.to || dateRange.to }
    const [ov, records] = await Promise.all([fetchTopUpOverview(base), fetchUSDTRecord({ ...base, pageNum: p ?? topupPage.value, pageSize: topupPageSize.value })])
    topupOverview.value = ov; topupData.value = records
  } finally { topupLoading.value = false }
}
function switchToTopups(): void { viewMode.value = 'topups'; router.replace({ query: { ...route.query, tab: 'topups' } }).catch(() => {}); loadTopups() }
function goTopupPage(p: number): void { topupPage.value = p; loadTopups(p) }

function back(): void {
  const query: Record<string, string> = {}
  if (selectedNetwork.value) query.network = selectedNetwork.value
  if (appliedDateRange.from) query.from = appliedDateRange.from
  if (appliedDateRange.to) query.to = appliedDateRange.to
  router.push({ name: 'FeeMonitor', query })
}

function parseDateRangeFromQuery(): [Date, Date] | null {
  const from = route.query.from as string | undefined; const to = route.query.to as string | undefined
  if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) { const f = new Date(from + 'T00:00:00'); const t = new Date(to + 'T00:00:00'); if (!isNaN(f.getTime()) && !isNaN(t.getTime())) return [f, t] }
  return null
}

onMounted(async () => {
  const qNetwork = route.query.network as string | undefined
  if (qNetwork && (networks.value ?? []).includes(qNetwork)) selectedNetwork.value = qNetwork
  else if ((networks.value ?? []).length > 0) selectedNetwork.value = networks.value[0]
  const parsed = parseDateRangeFromQuery()
  if (parsed) { dateRangeValue.value = parsed; dateRange.from = formatDateRangeValue(parsed).from; dateRange.to = formatDateRangeValue(parsed).to; appliedDateRange.from = dateRange.from; appliedDateRange.to = dateRange.to; syncQuery() }
  loadData()
})

watch(viewMode, (mode) => { if (mode === 'topups') loadTopups() })
</script>