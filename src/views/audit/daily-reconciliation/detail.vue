<!-- Daily Reconciliation Detail — 资产详情（已对账 / 未对账 / 待入账交易） -->
<template>
  <div class="page-content">
    <!-- Loading -->
    <template v-if="loading">
      <div class="art-card p-5 mb-4"><el-skeleton :rows="3" animated /></div>
      <div class="art-card p-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <!-- Load error -->
    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadAll">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else-if="asset">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs text-tone-muted-text mb-3">
        <button class="hover:text-g-700" @click="backToList">
          {{ $t('dailyReconciliation.pageTitle') }}
        </button>
        <span class="opacity-50">/</span>
        <span class="text-g-700 font-medium">{{ merchantName }} · {{ asset.coinId }}</span>
      </div>

      <!-- 后端接口未就绪提示 -->
      <div
        class="mb-4 px-4 py-2.5 rounded-lg text-xs leading-relaxed bg-tone-progress-bg text-tone-progress-text border border-[var(--tone-progress-border)]"
      >
        {{ $t('dailyReconciliation.apiPending') }}
      </div>

      <!-- Asset / Merchant Header -->
      <div class="art-card p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <span class="asset-icon-large" :style="iconStyle(asset.coinId)">
            {{ coinColor(asset.coinId).symbol }}
          </span>
          <div class="flex flex-col">
            <el-select
              :model-value="assetKey"
              :placeholder="$t('dailyReconciliation.selectAsset')"
              class="!w-56 asset-switcher"
              @change="switchAsset"
            >
              <el-option
                v-for="row in assetOptions"
                :key="`${row.coinId}-${row.network}`"
                :label="`${row.coinId} · ${networkLabel(row.network)}`"
                :value="`${row.coinId}-${row.network}`"
              />
            </el-select>
            <span class="text-xs text-g-500 mt-1">{{ networkLabel(asset.network) }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end gap-1.5 text-xs text-g-500">
          <div class="flex items-center gap-2">
            <span>{{ $t('dailyReconciliation.merchant') }}:</span>
            <el-select
              v-model="merchantCode"
              :placeholder="$t('dailyReconciliation.selectMerchant')"
              filterable
              class="!w-48"
              @change="switchMerchant"
            >
              <el-option
                v-for="m in merchants"
                :key="m.code"
                :label="m.merchantName"
                :value="m.code"
              />
            </el-select>
          </div>
          <div>
            {{ $t('dailyReconciliation.recentClosed') }}:
            <strong class="font-medium text-g-800">{{
              $t('dailyReconciliation.recentClosedAt', {
                date: formatLongDate(asset.lastClosedDate)
              })
            }}</strong>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <!-- ─── Reconciled ─── -->
        <el-tab-pane :label="$t('dailyReconciliation.tabReconciled')" name="reconciled">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span class="text-sm text-g-600">
              {{ $t('dailyReconciliation.daySummary', { date: formatLongDate(selectedDate) }) }}
            </span>
            <div class="flex items-center gap-2">
              <label class="text-xs text-g-600">{{
                $t('dailyReconciliation.reconciliationDate')
              }}</label>
              <el-date-picker
                v-model="selectedDate"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled-date="isClosedDateDisabled"
                class="!w-40"
              />
            </div>
          </div>

          <template v-if="currentDay">
            <!-- Summary -->
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
                  <span class="text-display font-semibold mt-1 text-g-900 tabular-nums">{{
                    card.value
                  }}</span>
                </div>
              </ElCol>
            </ElRow>

            <!-- Unit summary -->
            <div class="art-card art-table-card overflow-hidden">
              <el-table
                :data="currentDay.units"
                size="small"
                :row-style="{ cursor: 'pointer' }"
                @row-click="openUnit"
              >
                <el-table-column :label="$t('dailyReconciliation.treasuryUnit')" min-width="200">
                  <template #default="{ row }">
                    <span class="text-sm font-semibold text-g-900">{{ row.unitName }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  :label="$t('dailyReconciliation.openingBalance')"
                  min-width="160"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="text-sm tabular-nums text-g-700">{{
                      formatBaseAmount(row.openingBalance, asset.decimals)
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  :label="$t('dailyReconciliation.closingBalance')"
                  min-width="160"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="text-sm font-semibold tabular-nums text-g-900">{{
                      formatBaseAmount(row.closingBalance, asset.decimals)
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  :label="$t('dailyReconciliation.includedTx')"
                  width="130"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="text-sm tabular-nums text-g-700">{{ row.includedCount }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  :label="$t('dailyReconciliation.backfillTx')"
                  width="130"
                  align="right"
                >
                  <template #default="{ row }">
                    <span
                      class="text-sm tabular-nums"
                      :class="row.backfillCount > 0 ? 'text-tone-progress-text' : 'text-g-700'"
                      >{{ row.backfillCount }}</span
                    >
                  </template>
                </el-table-column>
                <el-table-column width="48">
                  <template #default>
                    <ArtSvgIcon icon="ri:arrow-right-s-line" class="text-lg text-g-400" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>

          <div v-else class="art-card p-10 text-center text-g-500">
            {{ $t('dailyReconciliation.noDayData') }}
          </div>
        </el-tab-pane>

        <!-- ─── Unreconciled ─── -->
        <el-tab-pane name="unreconciled">
          <template #label>
            <span>{{ $t('dailyReconciliation.tabUnreconciledDays') }}</span>
            <span v-if="asset.unreconciled.length" class="tab-count">{{
              asset.unreconciled.length
            }}</span>
          </template>

          <div class="art-card art-table-card overflow-hidden">
            <el-table :data="asset.unreconciled" size="small">
              <el-table-column :label="$t('dailyReconciliation.date')" width="150">
                <template #default="{ row }">
                  <span class="text-sm font-semibold text-g-900">{{
                    formatLongDate(row.date)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('dailyReconciliation.statusLabel')" width="190">
                <template #default="{ row }">
                  <ArtStatusTag
                    :status="row.reason === 'blockchain_mismatch' ? 'danger' : 'warning'"
                    :text="$t(`dailyReconciliation.reason.${row.reason}`)"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="$t('dailyReconciliation.reasonDetail')" min-width="260">
                <template #default="{ row }">
                  <span class="text-sm text-g-700">{{ row.detail }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('dailyReconciliation.affectedUnits')"
                width="130"
                align="right"
              >
                <template #default="{ row }">
                  <span class="text-sm tabular-nums text-g-700">{{ row.affectedUnits }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('dailyReconciliation.lastUpdated')" width="160">
                <template #default="{ row }">
                  <span class="text-xs text-g-500">{{ formatTime(row.statDate) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('dailyReconciliation.expectedNextUpdate')" width="170">
                <template #default="{ row }">
                  <span
                    class="text-xs"
                    :class="row.expectedNextUpdate ? 'text-g-500' : 'text-g-400'"
                  >
                    {{ row.expectedNextUpdate ? formatTime(row.expectedNextUpdate) : '—' }}
                  </span>
                </template>
              </el-table-column>
              <template #empty>
                <div class="p-10 text-center text-g-500">
                  {{ $t('dailyReconciliation.noUnreconciled') }}
                </div>
              </template>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- ─── Pending TX ─── -->
        <el-tab-pane name="pendingTx">
          <template #label>
            <span>{{ $t('dailyReconciliation.tabPendingTx') }}</span>
            <span v-if="asset.pendingTx.length" class="tab-count">{{
              asset.pendingTx.length
            }}</span>
          </template>

          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-g-600">{{ $t('dailyReconciliation.treasuryUnit') }}</label>
              <el-select v-model="pendingUnitId" class="!w-48">
                <el-option :label="$t('dailyReconciliation.allUnits')" :value="0" />
                <el-option
                  v-for="unit in asset.units"
                  :key="unit.id"
                  :label="unit.name"
                  :value="unit.id"
                />
              </el-select>
            </div>
            <ElButton @click="openAllPending">
              {{ $t('dailyReconciliation.viewAllPending') }}
            </ElButton>
          </div>

          <div class="art-card overflow-hidden">
            <ReconciliationTransactionTable
              :rows="pendingRows"
              :decimals="asset.decimals"
              :show-balance="false"
              linkable
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- Asset not found -->
    <div v-else class="art-card p-10 text-center">
      <p class="text-g-600 mb-4">{{ $t('dailyReconciliation.assetNotFound') }}</p>
      <ElButton @click="backToList">{{ $t('common.back') }}</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { formatTime } from '@/utils/format'
  import ReconciliationTransactionTable from './components/TransactionTable.vue'
  import {
    fetchReconciliationAsset,
    fetchReconciliationOverview,
    listReconciliationMerchants
  } from '@/features/audit/reconciliation/mock'
  import type {
    ReconciliationAssetRowView,
    ReconciliationAssetView,
    ReconciliationTxView,
    ReconciliationUnitDayView
  } from '@/features/audit/reconciliation/types'
  import {
    coinColor,
    formatBaseAmount,
    formatLongDate,
    networkLabel
  } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliationDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const merchants = ref<Array<{ code: string; merchantName: string; initials: string }>>([])
  const merchantCode = ref<string>((route.query.merchant as string) || '')
  const coinId = ref<string>((route.query.coinId as string) || '')
  const network = ref<string>((route.query.network as string) || '')
  const merchantName = ref('')
  const assetOptions = ref<ReconciliationAssetRowView[]>([])
  const asset = ref<ReconciliationAssetView | null>(null)
  const loading = ref(false)
  const loadError = ref('')

  const activeTab = ref<'reconciled' | 'unreconciled' | 'pendingTx'>('reconciled')
  const selectedDate = ref('')
  const pendingUnitId = ref(0)

  const assetKey = computed(() =>
    asset.value ? `${asset.value.coinId}-${asset.value.network}` : ''
  )

  const currentDay = computed(
    () => asset.value?.days.find((day) => day.date === selectedDate.value) ?? null
  )

  const summaryCards = computed(() => {
    const day = currentDay.value
    const decimals = asset.value?.decimals ?? 0
    if (!day) return []
    return [
      {
        key: 'opening',
        label: t('dailyReconciliation.openingBalance'),
        value: formatBaseAmount(day.openingBalance, decimals)
      },
      {
        key: 'closing',
        label: t('dailyReconciliation.closingBalance'),
        value: formatBaseAmount(day.closingBalance, decimals)
      },
      {
        key: 'included',
        label: t('dailyReconciliation.includedTx'),
        value: String(day.includedTx.length)
      },
      {
        key: 'backfill',
        label: t('dailyReconciliation.backfillTx'),
        value: String(day.backfillTx.length)
      }
    ]
  })

  const pendingRows = computed<ReconciliationTxView[]>(() => {
    const rows = asset.value?.pendingTx ?? []
    if (!pendingUnitId.value) return rows
    return rows.filter((row) => row.treasuryUnitId === pendingUnitId.value)
  })

  function isClosedDateDisabled(date: Date): boolean {
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
    return !(asset.value?.days ?? []).some((day) => day.date === value)
  }

  async function loadAll(): Promise<void> {
    if (!merchantCode.value) {
      // 缺商户时回列表页选择，避免空白详情
      router.replace({ name: 'DailyReconciliation' })
      return
    }
    loading.value = true
    loadError.value = ''
    try {
      const overview = await fetchReconciliationOverview()
      const merchant = overview.merchants.find((m) => m.code === merchantCode.value)
      if (!merchant) {
        asset.value = null
        return
      }
      merchantName.value = merchant.merchantName
      assetOptions.value = merchant.assets

      // 未指定资产时默认第一个
      if (!coinId.value || !network.value) {
        const fallback = merchant.assets[0]
        if (!fallback) {
          asset.value = null
          return
        }
        coinId.value = fallback.coinId
        network.value = fallback.network
      }

      asset.value = await fetchReconciliationAsset(merchantCode.value, coinId.value, network.value)
      if (asset.value) {
        // 默认选中最近关闭日
        selectedDate.value = asset.value.lastClosedDate
        pendingUnitId.value = 0
      }
    } catch (caught) {
      asset.value = null
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load reconciliation detail.'
    } finally {
      loading.value = false
    }
  }

  function syncQuery(): void {
    router.replace({
      query: {
        merchant: merchantCode.value,
        coinId: coinId.value,
        network: network.value
      }
    })
  }

  async function switchAsset(value: string): Promise<void> {
    const row = assetOptions.value.find((item) => `${item.coinId}-${item.network}` === value)
    if (!row) return
    coinId.value = row.coinId
    network.value = row.network
    syncQuery()
    await loadAll()
  }

  async function switchMerchant(): Promise<void> {
    // 换商户后资产集合可能不同，清空资产让其回落到第一个
    coinId.value = ''
    network.value = ''
    syncQuery()
    await loadAll()
  }

  function openUnit(row: ReconciliationUnitDayView): void {
    router.push({
      name: 'daily-reconciliation-unit-detail',
      query: {
        merchant: merchantCode.value,
        coinId: coinId.value,
        network: network.value,
        date: selectedDate.value,
        unitId: String(row.unitId)
      }
    })
  }

  function openAllPending(): void {
    router.push({
      name: 'daily-reconciliation-pending',
      query: { merchant: merchantCode.value, date: selectedDate.value }
    })
  }

  function backToList(): void {
    router.push({ name: 'DailyReconciliation', query: { expand: merchantCode.value } })
  }

  function iconStyle(id: string): Record<string, string> {
    const c = coinColor(id)
    return { background: c.bg, color: c.color }
  }

  onMounted(async () => {
    merchants.value = await listReconciliationMerchants()
    await loadAll()
  })
</script>

<style scoped>
  .asset-icon-large {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    font-size: 18px;
    font-weight: 700;
    border-radius: 50%;
  }

  .tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    margin-left: 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--tone-info-text);
    background: var(--tone-info-bg);
    border-radius: 9px;
  }

  .asset-switcher :deep(.el-select__wrapper) {
    box-shadow: none;
  }
</style>
