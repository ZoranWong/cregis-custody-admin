<!-- Cregis Fee Monitor -->
<template>
  <div class="page-content">
    <!-- ═══ Tab + Date Range ═══ -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <el-radio-group v-model="activeTab" @change="switchTab">
        <el-radio-button value="overview">{{ $t('fee.overview') }}</el-radio-button>
        <el-radio-button value="config">{{ $t('fee.configuration') }}</el-radio-button>
      </el-radio-group>
      <div v-if="activeTab === 'overview'" class="flex items-center gap-2">
        <el-select
          v-model="selectedNetwork"
          :placeholder="$t('gas.network')"
          class="!w-36"
          @change="onNetworkChange"
        >
          <el-option v-for="net in networks" :key="net" :label="net" :value="net" />
        </el-select>
        <el-date-picker
          v-model="dateRangeValue"
          type="daterange"
          range-separator="—"
          :start-placeholder="$t('fee.from')"
          :end-placeholder="$t('fee.to')"
          format="YYYY-MM-DD"
          size="default"
          style="width: 260px"
        />
        <ElButton type="primary" :disabled="!dateRangeValue" @click="applyDateRange">{{
          $t('fee.apply')
        }}</ElButton>
        <ElButton @click="resetDateRange">{{ $t('gas.reset') }}</ElButton>
      </div>
    </div>

    <template v-if="loading">
      <div class="grid grid-cols-3 gap-4 mb-5"
        ><div v-for="i in 3" :key="i" class="art-card p-5"><el-skeleton :rows="2" animated /></div
      ></div>
      <div class="art-card p-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadMainData">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else>
      <!-- ===== Overview Tab ===== -->
      <div v-if="activeTab === 'overview'">
        <!-- Summary Metrics -->
        <ElRow :gutter="20" class="flex mb-5">
          <ElCol :sm="12" :md="8" v-for="card in summaryCards" :key="card.key">
            <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-4">
              <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
              <span class="text-display font-semibold mt-1 text-g-900">{{ card.value }}</span>
            </div>
          </ElCol>
        </ElRow>

        <!-- Fee Collection Ranking -->
        <div class="art-card art-table-card overflow-hidden mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-base font-semibold text-g-900">{{ $t('fee.ranking') }}</h3>
              <el-input
                v-model="rankingSearch"
                :placeholder="$t('fee.searchMerchant')"
                clearable
                class="!w-48"
              >
                <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
              </el-input>
            </div>
          </div>
          <el-table :data="filteredRanking" stripe size="small">
            <template #empty
              ><div class="p-10 text-center text-g-500">{{
                $t('fee.noRankingData')
              }}</div></template
            >
            <el-table-column :label="$t('fee.rank')" width="70">
              <template #default="{ row }"
                ><span
                  class="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="
                    row.rank === 1
                      ? 'bg-tone-progress-bg text-tone-progress-text'
                      : 'bg-g-100 text-g-600'
                  "
                  >{{ row.rank }}</span
                ></template
              >
            </el-table-column>
            <el-table-column :label="$t('fee.merchant')" min-width="260">
              <template #default="{ row }"
                ><span
                  class="text-sm text-g-900 cursor-pointer hover:text-g-700"
                  @click="goMerchantDetail(row)"
                  >{{ row.merchantName }}</span
                ></template
              >
            </el-table-column>
            <el-table-column :label="$t('fee.feeCollected')" width="180">
              <template #default="{ row }"
                ><span class="text-sm font-medium text-g-900"
                  >${{ formatNumber(row.feeUsdt) }}</span
                ></template
              >
            </el-table-column>
            <el-table-column :label="$t('fee.txCount')" width="100">
              <template #default="{ row }">{{ formatNumber(row.txCount) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fee.actions')" width="200">
              <template #default="{ row }">
                <div class="flex gap-2">
                  <ElButton size="small" @click="goMerchantConfig(row)">{{
                    $t('fee.configure')
                  }}</ElButton>
                  <ElButton size="small" @click="goMerchantDetail(row)">{{
                    $t('fee.detail')
                  }}</ElButton>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div
            v-if="rankingPagination.totalCount > 0"
            class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
          >
            <span class="text-xs text-g-500">{{
              $t('common.recordCount', { count: rankingPagination.totalCount })
            }}</span>
            <el-pagination
              v-model:current-page="rankingPage"
              v-model:page-size="rankingPageSize"
              :total="rankingPagination.totalCount"
              :page-sizes="[10, 20, 50]"
              background
              layout="prev,pager,next,sizes"
              @current-change="(v: number) => loadRanking(v)"
              @size-change="
                (v: number) => {
                  rankingPageSize = v
                  loadRanking(1)
                }
              "
            />
          </div>
        </div>
      </div>

      <!-- ===== Configuration Tab ===== -->
      <div v-if="activeTab === 'config'">
        <div
          class="flex rounded-lg overflow-hidden border border-[var(--default-border)] mb-5 w-fit"
        >
          <el-radio-group v-model="configSubTab" @change="switchSubTab">
            <el-radio-button value="platform">{{ $t('fee.platformConfig') }}</el-radio-button>
            <el-radio-button value="merchant">{{ $t('fee.merchantConfig') }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- Platform Config -->
        <div
          v-if="configSubTab === 'platform'"
          class="art-card art-table-card overflow-hidden mb-4"
        >
          <div class="p-4 border-b border-[var(--default-border)]">
            <h3 class="text-base font-semibold text-g-900">{{ $t('fee.platformFeeFactors') }}</h3>
          </div>
          <el-table :data="platformConfig" stripe size="small" class="platform-config-table">
            <template #empty
              ><div class="p-10 text-center text-g-500">{{
                $t('fee.noPlatformConfig')
              }}</div></template
            >
            <el-table-column :label="$t('gas.network')" min-width="140">
              <template #default="{ row }"
                ><span class="text-sm font-medium text-g-900">{{ row.network }}</span></template
              >
            </el-table-column>
            <el-table-column :label="$t('fee.gasPerTx')" min-width="220">
              <template #default="{ row }">
                <template v-if="!isEditing(row.network)">
                  {{ formatGasDisplay(row.gasPerTx, row.network) }}
                  <span class="text-xs text-g-400"
                    >(ref: {{ formatGasDisplay(row.referenceGas, row.network) }})</span
                  >
                </template>
                <el-input
                  v-else
                  v-model.number="editForm.gasPerTx"
                  type="number"
                  size="small"
                  class="!w-32"
                />
              </template>
            </el-table-column>
            <el-table-column :label="$t('fee.exchangeRate')" min-width="160">
              <template #default="{ row }">
                <template v-if="!isEditing(row.network)">{{
                  formatDecimalTrimmed(row.exchangeRate, 8)
                }}</template>
                <el-input
                  v-else
                  v-model.number="editForm.exchangeRate"
                  type="number"
                  size="small"
                  class="!w-36"
                  :step="0.00000001"
                />
              </template>
            </el-table-column>
            <el-table-column :label="$t('fee.discount')" width="100">
              <template #default="{ row }">
                <template v-if="!isEditing(row.network)">{{
                  row.platformDiscount.toFixed(2)
                }}</template>
                <el-input
                  v-else
                  v-model.number="editForm.platformDiscount"
                  type="number"
                  size="small"
                  class="!w-20"
                  :step="0.01"
                  :min="0"
                  :max="1"
                />
              </template>
            </el-table-column>
            <el-table-column :label="$t('fee.finalFee')" min-width="160">
              <template #default="{ row }"
                ><span class="text-sm font-medium text-g-900"
                  >${{ formatFeeFromRaw(row.finalFeePerTx) }}</span
                ></template
              >
            </el-table-column>
            <el-table-column :label="$t('fee.actions')" width="120">
              <template #default="{ row }">
                <template v-if="!isEditing(row.network)">
                  <ElButton size="small" @click="startEditChain(row.network)">{{
                    $t('fee.set')
                  }}</ElButton>
                </template>
                <template v-else>
                  <div class="flex gap-2">
                    <ElButton
                      size="small"
                      type="primary"
                      :disabled="configSaving"
                      @click="saveChainConfig"
                      >{{ $t('fee.save') }}</ElButton
                    >
                    <ElButton size="small" @click="cancelEditChain">{{
                      $t('fee.cancel')
                    }}</ElButton>
                  </div>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Merchant Config -->
        <div v-if="configSubTab === 'merchant'">
          <div class="mb-4">
            <el-select
              v-model="selectedMerchantEcode"
              filterable
              remote
              :remote-method="onMerchantRemoteSearch"
              :loading="merchantLoading"
              :placeholder="$t('fee.searchMerchant')"
              clearable
              class="!w-72"
              @change="onMerchantSelect"
              @clear="clearMerchantConfig"
            >
              <el-option
                v-for="m in merchantResults"
                :key="m.code"
                :label="`${m.merchantName} (${m.code})`"
                :value="m.code"
              />
            </el-select>
          </div>

          <div v-if="!selectedMerchantEcode" class="art-card p-16 text-center">
            <div class="text-4xl mb-4">&#x2699;&#xFE0F;</div>
            <h3 class="text-base font-semibold text-g-800 mb-2">{{
              $t('fee.noMerchantSelected')
            }}</h3>
            <p class="text-sm text-g-500">{{ $t('fee.selectMerchantHint') }}</p>
          </div>

          <div v-else class="art-card art-table-card overflow-hidden mb-4">
            <div class="p-4 border-b border-[var(--default-border)]">
              <h3 class="text-base font-semibold text-g-900"
                >{{ $t('fee.merchantFeeFactors') }} —
                {{ selectedMerchantName || selectedMerchantEcode }}</h3
              >
            </div>
            <div
              class="px-4 py-3 bg-g-50 border-b border-[var(--default-border)] text-xs text-g-500"
            >
              {{ $t('fee.customDiscountNote') }}
            </div>
            <el-table
              ref="merchantTableRef"
              :data="merchantChainConfig"
              stripe
              size="small"
              row-key="network"
            >
              <template #empty
                ><div class="p-10 text-center text-g-500">{{
                  $t('fee.noPlatformConfig')
                }}</div></template
              >
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="p-4">
                    <div class="flex flex-wrap items-center gap-4 mb-3">
                      <span class="text-sm font-medium text-g-900">{{ row.network }}</span>
                      <span class="text-xs text-g-500">
                        {{ $t('fee.gasPerTx') }}:
                        {{ formatGasDisplay(row.gasPerTx, row.network) }} ·
                        {{ $t('fee.exchangeRate') }}:
                        {{ formatDecimalTrimmed(row.exchangeRate, 8) }} ·
                        {{ $t('fee.platformDiscount') }}: {{ row.platformDiscount.toFixed(2) }}
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 mb-3">
                      <label class="flex items-center gap-2 text-sm text-g-600">
                        {{ $t('fee.customDiscount') }} (0–1):
                        <el-input
                          v-model.number="merchantChainEditState.rate"
                          type="number"
                          size="small"
                          class="!w-20"
                          :step="0.05"
                          :min="0"
                          :max="1"
                          :disabled="!merchantChainEditState.useCustom"
                        />
                      </label>
                      <label
                        class="flex items-center gap-2 text-sm text-g-600 cursor-pointer"
                        @click="toggleCustomDiscount"
                      >
                        {{ $t('fee.applyCustom') }}
                        <span
                          class="ml-2 w-10 h-5 rounded-full transition-colors relative inline-block align-middle"
                          :class="merchantChainEditState.useCustom ? 'bg-g-900' : 'bg-g-300'"
                        >
                          <span
                            class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            :class="
                              merchantChainEditState.useCustom ? 'translate-x-5' : 'translate-x-0.5'
                            "
                          />
                        </span>
                      </label>
                    </div>
                    <div class="flex gap-2">
                      <ElButton
                        type="primary"
                        size="small"
                        :disabled="merchantConfigSaving || !merchantChainEditState.useCustom"
                        @click="saveMerchantChain"
                        >{{ $t('fee.save') }}</ElButton
                      >
                      <ElButton size="small" @click="cancelEditMerchantChain">{{
                        $t('fee.cancel')
                      }}</ElButton>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('gas.network')" min-width="120">
                <template #default="{ row }"
                  ><span class="text-sm font-medium text-g-900">{{ row.network }}</span></template
                >
              </el-table-column>
              <el-table-column :label="$t('fee.gasPerTx')" min-width="140">
                <template #default="{ row }">{{
                  formatGasDisplay(row.gasPerTx, row.network)
                }}</template>
              </el-table-column>
              <el-table-column :label="$t('fee.exchangeRate')" min-width="120">
                <template #default="{ row }">{{
                  formatDecimalTrimmed(row.exchangeRate, 8)
                }}</template>
              </el-table-column>
              <el-table-column :label="$t('fee.platformDiscount')" width="120">
                <template #default="{ row }"
                  ><span
                    :class="{
                      'line-through text-g-400': merchantChainCustomState[row.network]?.useCustom
                    }"
                    >{{ row.platformDiscount.toFixed(2) }}</span
                  ></template
                >
              </el-table-column>
              <el-table-column :label="$t('fee.customDiscount')" width="120">
                <template #default="{ row }">
                  <span
                    v-if="merchantChainCustomState[row.network]?.useCustom"
                    class="text-g-900 font-medium"
                    >{{ merchantChainCustomState[row.network]?.rate.toFixed(2) }}</span
                  >
                  <span v-else class="text-g-300">—</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('fee.finalFee')" min-width="140">
                <template #default="{ row }">
                  <span class="text-sm font-medium text-g-900"
                    >${{ formatFeeFromRaw(row.finalFeePerTx) }}</span
                  >
                  <span class="block text-xs text-g-400">{{
                    merchantChainCustomState[row.network]?.useCustom
                      ? $t('fee.custom')
                      : $t('fee.platform')
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('fee.actions')" width="80">
                <template #default="{ row }">
                  <ElButton size="small" @click="startEditMerchantChain(row)">{{
                    editingMerchantChain === row.network ? $t('fee.cancel') : $t('fee.set')
                  }}</ElButton>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useCoinStore } from '@/store/modules/coins'
  import { storeToRefs } from 'pinia'
  import { formatCoinBalance, formatDateRangeValue } from '@/utils/format'
  import { ElDatePicker, ElMessage } from 'element-plus'
  import 'element-plus/es/components/date-picker/style/css'
  import {
    fetchFeeOverview,
    fetchFeeRanking,
    fetchPlatformGasConfigList,
    updatePlatformGasConfig,
    addPlatformGasConfig,
    fetchMerchantGasConfigList,
    updateMerchantGasConfig,
    addMerchantGasConfig,
    type FeeRankingQuery
  } from '@/api/operationsFee'
  import { fetchMerchantList, type MerchantListItemView } from '@/api/merchantSearch'
  import type {
    FeeRankingItemView,
    PlatformGasConfigView,
    MerchantGasConfigView
  } from '@/features/ops/fee/types'

  defineOptions({ name: 'FeeMonitor' })
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const coinStore = useCoinStore()
  const { list: coinList } = storeToRefs(coinStore)

  // State
  const validTabs = ['overview', 'config'] as const
  const validSubTabs = ['platform', 'merchant'] as const
  const activeTab = ref<'overview' | 'config'>(
    validTabs.includes(route.query.tab as any)
      ? (route.query.tab as 'overview' | 'config')
      : 'overview'
  )
  const configSubTab = ref<'platform' | 'merchant'>(
    validSubTabs.includes(route.query.sub as any)
      ? (route.query.sub as 'platform' | 'merchant')
      : 'platform'
  )
  const loading = ref(false)
  const loadError = ref('')
  const selectedNetwork = ref('')
  const dateRange = reactive({ from: '', to: '' })
  const dateRangeValue = ref<[Date, Date] | null>(null)

  // Overview
  const overview = ref<{
    feeCollectedUsdt: number
    txCount: number
    avgFeePerTxUsdt: number
  } | null>(null)
  const rankingItems = ref<FeeRankingItemView[]>([])
  const rankingPagination = ref({ page: 1, pageSize: 10, totalPages: 0, totalCount: 0 })
  const rankingSearch = ref('')
  const rankingPage = ref(1)
  const rankingPageSize = ref(10)

  // Platform config
  const platformConfig = ref<PlatformGasConfigView[]>([])
  const editingNetwork = ref('')
  const editForm = ref({ gasPerTx: 0, exchangeRate: 0, platformDiscount: 0 })
  const configSaving = ref(false)

  // Merchant config
  const merchantTableRef = ref()
  const selectedMerchantEcode = ref('')
  const selectedMerchantName = ref('')
  const merchantConfig = ref<MerchantGasConfigView[]>([])
  const merchantConfigSaving = ref(false)
  const editingMerchantChain = ref('')
  const merchantChainCustomState = ref<Record<string, { useCustom: boolean; rate: number }>>({})
  const merchantChainEditState = ref({
    chain: null as PlatformGasConfigView | null,
    useCustom: false,
    rate: 0.85
  })

  // Merchant remote search (el-select remote)
  const merchantResults = ref<MerchantListItemView[]>([])
  const merchantLoading = ref(false)
  let merchantDebounce: ReturnType<typeof setTimeout> | null = null

  async function searchMerchants(query: string): Promise<void> {
    merchantLoading.value = true
    try {
      const result = await fetchMerchantList({
        merchantName: query || undefined,
        pageIndex: 1,
        pageSize: 20
      })
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

  async function onMerchantSelect(ecode: string): Promise<void> {
    if (!ecode) return
    const m = merchantResults.value.find((r) => r.code === ecode)
    selectedMerchantName.value = m?.merchantName || ecode
    editingMerchantChain.value = ''
    await loadMerchantConfig()
  }

  function clearMerchantConfig(): void {
    selectedMerchantEcode.value = ''
    selectedMerchantName.value = ''
    merchantConfig.value = []
  }

  const networks = computed(() => {
    const seen = new Set<string>()
    ;(coinList.value ?? []).forEach((c) => {
      if (c.network) seen.add(c.network)
    })
    return Array.from(seen).sort()
  })

  const summaryCards = computed(() => [
    {
      key: 'feeCollected',
      labelKey: 'fee.feeCollected',
      value: '$' + formatNumber(overview.value?.feeCollectedUsdt ?? 0)
    },
    {
      key: 'txCount',
      labelKey: 'fee.totalTxCount',
      value: formatNumber(overview.value?.txCount ?? 0)
    },
    {
      key: 'avgFee',
      labelKey: 'fee.avgFeePerTx',
      value: '$' + formatDecimal(overview.value?.avgFeePerTxUsdt ?? 0)
    }
  ])

  const filteredRanking = computed(() => {
    if (!rankingSearch.value) return rankingItems.value
    const q = rankingSearch.value.toLowerCase()
    return rankingItems.value.filter((r) => r.merchantName.toLowerCase().includes(q))
  })

  const merchantChainConfig = computed(() =>
    platformConfig.value.map((p) => {
      const mc = merchantConfig.value.find((m) => m.network === p.network)
      return mc ? { ...p, ...mc } : { ...p }
    })
  )

  // Helpers
  function formatNumber(n: number): string {
    return Number(n).toLocaleString('en-US')
  }
  function formatDecimal(n: number): string {
    return Number(n).toFixed(2)
  }
  function formatFeeFromRaw(raw: number): string {
    const usdt = raw / 1_000_000
    return usdt.toFixed(6).replace(/(\.\d*[1-9])0+$|\.0+$/, '$1')
  }
  function formatGasDisplay(raw: number, network: string): string {
    const mainCoin = coinStore.getMainCoin(network)
    if (!mainCoin) return String(raw)
    return formatCoinBalance(String(raw), mainCoin.decimals) + ' ' + mainCoin.unit
  }
  function formatDecimalTrimmed(val: number, decimals: number): string {
    return val.toFixed(decimals).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')
  }
  function getGasDecimalsDivisor(network: string): number {
    const mainCoin = coinStore.getMainCoin(network)
    return Math.pow(10, mainCoin?.decimals ?? 0)
  }
  const USDT_DECIMALS = 1e6

  // Data loading
  async function loadMainData(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const [ov, rankResult, pc] = await Promise.all([
        fetchFeeOverview({
          startDate: dateRange.from,
          endDate: dateRange.to,
          network: selectedNetwork.value || undefined
        }),
        loadRankingData(rankingPage.value, rankingPageSize.value),
        fetchPlatformGasConfigList()
      ])
      overview.value = ov
      platformConfig.value = pc
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Failed to load Fee Monitor data.'
    } finally {
      loading.value = false
    }
  }

  async function loadRankingData(pageNum: number, pageSize: number): Promise<void> {
    const q: FeeRankingQuery = { pageNum, pageSize }
    if (dateRange.from) q.startDate = dateRange.from
    if (dateRange.to) q.endDate = dateRange.to
    if (selectedNetwork.value) q.network = selectedNetwork.value
    const result = await fetchFeeRanking(q)
    rankingItems.value = result.records
    rankingPagination.value = {
      page: result.current,
      pageSize: result.size,
      totalPages: result.pages,
      totalCount: result.total
    }
  }

  async function loadRanking(p: number): Promise<void> {
    rankingPage.value = p
    await loadRankingData(p, rankingPageSize.value)
  }

  function applyDateRange(): void {
    if (dateRangeValue.value) {
      const { from, to } = formatDateRangeValue(dateRangeValue.value)
      dateRange.from = from
      dateRange.to = to
    }
    syncQuery()
    loadMainData()
  }
  function resetDateRange(): void {
    dateRangeValue.value = null
    dateRange.from = ''
    dateRange.to = ''
    syncQuery()
    loadMainData()
  }
  function onNetworkChange(): void {
    syncQuery()
    loadMainData()
  }
  function syncQuery(): void {
    const query: Record<string, string> = {}
    if (activeTab.value !== 'overview') query.tab = activeTab.value
    if (activeTab.value === 'config' && configSubTab.value !== 'platform')
      query.sub = configSubTab.value
    if (selectedNetwork.value) query.network = selectedNetwork.value
    if (dateRange.from) query.from = dateRange.from
    if (dateRange.to) query.to = dateRange.to
    router.replace({ query }).catch(() => {})
  }
  function switchTab(tab: 'overview' | 'config'): void {
    activeTab.value = tab
    if (tab === 'overview') configSubTab.value = 'platform'
    syncQuery()
    if (tab === 'overview') loadMainData()
  }
  function switchSubTab(sub: 'platform' | 'merchant'): void {
    configSubTab.value = sub
    syncQuery()
  }

  // Platform config editing
  function isEditing(network: string): boolean {
    return editingNetwork.value === network
  }
  function startEditChain(network: string): void {
    const row = platformConfig.value.find((r) => r.network === network)
    if (row) {
      editForm.value = {
        gasPerTx: row.gasPerTx,
        exchangeRate: row.exchangeRate,
        platformDiscount: row.platformDiscount
      }
      editingNetwork.value = network
    }
  }
  function cancelEditChain(): void {
    editingNetwork.value = ''
  }
  async function saveChainConfig(): Promise<void> {
    const row = platformConfig.value.find((r) => r.network === editingNetwork.value)
    if (!row) return
    configSaving.value = true
    try {
      const payload: PlatformGasConfigView = {
        ...row,
        gasPerTx: editForm.value.gasPerTx,
        exchangeRate: editForm.value.exchangeRate,
        platformDiscount: editForm.value.platformDiscount,
        finalFeePerTx:
          (editForm.value.gasPerTx / getGasDecimalsDivisor(row.network)) *
          editForm.value.exchangeRate *
          editForm.value.platformDiscount *
          USDT_DECIMALS
      }
      if (row.id) await updatePlatformGasConfig(payload)
      else await addPlatformGasConfig(payload)
      platformConfig.value = await fetchPlatformGasConfigList()
      editingNetwork.value = ''
    } finally {
      configSaving.value = false
    }
  }

  // Merchant config
  async function loadMerchantConfig(): Promise<void> {
    if (!selectedMerchantEcode.value) return
    merchantConfig.value = await fetchMerchantGasConfigList({ ecode: selectedMerchantEcode.value })
    initMerchantChainState()
  }
  function initMerchantChainState(): void {
    const state: Record<string, { useCustom: boolean; rate: number }> = {}
    platformConfig.value.forEach((p) => {
      const existing = merchantConfig.value.find((c) => c.network === p.network)
      state[p.network] = existing
        ? { useCustom: true, rate: existing.discount }
        : { useCustom: false, rate: p.platformDiscount }
    })
    merchantChainCustomState.value = state
  }
  function startEditMerchantChain(row: PlatformGasConfigView): void {
    const state = merchantChainCustomState.value[row.network] || {
      useCustom: false,
      rate: row.platformDiscount
    }
    if (editingMerchantChain.value === row.network) {
      merchantTableRef.value?.toggleRowExpansion(row, false)
      editingMerchantChain.value = ''
      return
    }
    // 收起之前展开的行
    const prev = merchantChainConfig.value.find((c) => c.network === editingMerchantChain.value)
    if (prev) merchantTableRef.value?.toggleRowExpansion(prev, false)
    editingMerchantChain.value = row.network
    merchantChainEditState.value = { chain: row, useCustom: state.useCustom, rate: state.rate }
    merchantTableRef.value?.toggleRowExpansion(row, true)
  }
  function cancelEditMerchantChain(): void {
    const row = merchantChainConfig.value.find((c) => c.network === editingMerchantChain.value)
    if (row) merchantTableRef.value?.toggleRowExpansion(row, false)
    editingMerchantChain.value = ''
  }
  function toggleCustomDiscount(): void {
    merchantChainEditState.value.useCustom = !merchantChainEditState.value.useCustom
  }
  async function saveMerchantChain(): Promise<void> {
    const chain = merchantChainEditState.value.chain
    if (!chain) return
    const editState = merchantChainEditState.value
    merchantConfigSaving.value = true
    try {
      const existing = merchantConfig.value.find((c) => c.network === chain.network)
      const payload: MerchantGasConfigView = {
        ecode: selectedMerchantEcode.value,
        network: chain.network,
        gasPerTx: chain.gasPerTx,
        referenceGas: chain.referenceGas,
        exchangeRate: chain.exchangeRate,
        discount: editState.useCustom ? editState.rate : chain.platformDiscount,
        finalFeePerTx: editState.useCustom
          ? (chain.gasPerTx / getGasDecimalsDivisor(chain.network)) *
            chain.exchangeRate *
            editState.rate *
            USDT_DECIMALS
          : chain.finalFeePerTx
      }
      if (existing?.id) await updateMerchantGasConfig({ ...payload, id: existing.id })
      else await addMerchantGasConfig(payload)
      merchantChainCustomState.value[chain.network] = {
        useCustom: editState.useCustom,
        rate: editState.rate
      }
      ElMessage.success(t('fee.saveSuccess'))
      // 收起展开行
      merchantTableRef.value?.toggleRowExpansion(chain, false)
      editingMerchantChain.value = ''
      await loadMerchantConfig()
    } finally {
      merchantConfigSaving.value = false
    }
  }

  // Navigation
  function goMerchantDetail(row: FeeRankingItemView): void {
    const query: Record<string, string> = { merchantName: row.merchantName }
    if (selectedNetwork.value) query.network = selectedNetwork.value
    if (dateRange.from) query.from = dateRange.from
    if (dateRange.to) query.to = dateRange.to
    router.push({ name: 'merchant-fee-monitor', params: { merchantEcode: row.ecode }, query })
  }
  async function goMerchantConfig(row: FeeRankingItemView): Promise<void> {
    switchTab('config')
    switchSubTab('merchant')
    selectedMerchantEcode.value = row.ecode
    selectedMerchantName.value = row.merchantName
    // 预加载该商户到下拉选项
    merchantResults.value = [{ id: 0, code: row.ecode, merchantName: row.merchantName }]
    await loadMerchantConfig()
  }

  // Init — aligned with v1: default 30-day date range, URL query sync
  function defaultDateRange(): [Date, Date] {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return [start, end]
  }

  function parseDateRangeFromQuery(): [Date, Date] {
    const from = route.query.from as string | undefined
    const to = route.query.to as string | undefined
    if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const f = new Date(from + 'T00:00:00')
      const t = new Date(to + 'T00:00:00')
      if (!isNaN(f.getTime()) && !isNaN(t.getTime())) return [f, t]
    }
    return defaultDateRange()
  }

  watch(
    () => route.fullPath,
    () => {
      if (!route.query.from && !route.query.to) initFromQuery()
    }
  )

  async function initFromQuery(): Promise<void> {
    await coinStore.ensureLoaded()
    const qNetwork = route.query.network as string | undefined
    if (qNetwork && (networks.value ?? []).includes(qNetwork)) selectedNetwork.value = qNetwork
    else if ((networks.value ?? []).length > 0 && !selectedNetwork.value)
      selectedNetwork.value = networks.value[0]
    dateRangeValue.value = parseDateRangeFromQuery()
    // syncQuery before applyDateRange so URL gets network + date params
    if (!route.query.network || !route.query.from) syncQuery()
    applyDateRange()
  }

  onMounted(async () => {
    await coinStore.ensureLoaded()
    const qNetwork = route.query.network as string | undefined
    if (qNetwork && (networks.value ?? []).includes(qNetwork)) selectedNetwork.value = qNetwork
    else if ((networks.value ?? []).length > 0 && !selectedNetwork.value)
      selectedNetwork.value = networks.value[0]
    dateRangeValue.value = parseDateRangeFromQuery()
    if (!route.query.network || !route.query.from) syncQuery()
    applyDateRange()
  })
</script>
