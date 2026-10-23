<!-- Daily Reconciliation Unit Detail — 财资单元当日明细（Included / Backfill） -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-4"><el-skeleton :rows="3" animated /></div>
      <div class="art-card p-5"><el-skeleton :rows="6" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="loadAll">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else-if="asset && day">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs text-tone-muted-text mb-3">
        <button class="hover:text-g-700" @click="backToList">
          {{ $t('dailyReconciliation.pageTitle') }}
        </button>
        <span class="opacity-50">/</span>
        <button class="hover:text-g-700" @click="backToAsset">
          {{ formatLongDate(day.date) }}
        </button>
        <span class="opacity-50">/</span>
        <span class="text-g-700 font-medium">{{ currentUnitRow?.unitName }}</span>
      </div>

      <!-- Asset / Merchant / Date Header -->
      <div class="art-card p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="asset-icon-large" :style="iconStyle(asset.coinId)">
            {{ coinColor(asset.coinId).symbol }}
          </span>
          <div class="flex flex-col leading-tight">
            <span class="text-xl font-semibold text-g-900">{{ asset.coinId }}</span>
            <span class="text-xs text-g-600">{{ networkLabel(asset.network) }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end gap-1.5 text-xs text-g-500">
          <div>
            {{ $t('dailyReconciliation.merchant') }}:
            <strong class="font-medium text-g-800">{{ merchantName }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <span>{{ $t('dailyReconciliation.reconciliationDate') }}:</span>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              :disabled-date="isClosedDateDisabled"
              class="!w-40"
              @change="loadAll"
            />
          </div>
        </div>
      </div>

      <!-- Unit summary -->
      <div class="art-card p-5 mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <el-select v-model="unitId" class="!w-56" @change="syncUnit">
            <el-option
              v-for="unit in asset.units"
              :key="unit.id"
              :label="unit.name"
              :value="unit.id"
            />
          </el-select>
          <span class="text-xs text-g-500">{{
            $t('dailyReconciliation.unitSummaryHint', { date: formatLongDate(day.date) })
          }}</span>
        </div>
        <ElRow :gutter="20" class="flex">
          <ElCol v-for="item in unitSummary" :key="item.key" :sm="12" :md="6" class="mb-4 sm:mb-0">
            <div class="flex flex-col">
              <span
                class="text-[10px] font-semibold uppercase tracking-wider text-tone-muted-text"
                >{{ item.label }}</span
              >
              <span class="text-display font-semibold mt-1 text-g-900 tabular-nums">{{
                item.value
              }}</span>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <el-tab-pane name="included">
          <template #label>
            <span>{{ $t('dailyReconciliation.includedTx') }}</span>
            <span class="tab-count">{{ includedRows.length }}</span>
          </template>
          <div class="art-card overflow-hidden">
            <ReconciliationTransactionTable
              :rows="includedRows"
              :decimals="asset.decimals"
              show-settled-at
              linkable
            />
          </div>
        </el-tab-pane>
        <el-tab-pane name="backfill">
          <template #label>
            <span>{{ $t('dailyReconciliation.backfillTx') }}</span>
            <span class="tab-count">{{ backfillRows.length }}</span>
          </template>
          <div class="art-card overflow-hidden">
            <ReconciliationTransactionTable
              :rows="backfillRows"
              :decimals="asset.decimals"
              show-settled-at
              linkable
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <div v-else class="art-card p-10 text-center">
      <p class="text-g-600 mb-4">{{ $t('dailyReconciliation.noDayData') }}</p>
      <ElButton @click="backToList">{{ $t('common.back') }}</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import ReconciliationTransactionTable from './components/TransactionTable.vue'
  import {
    fetchReconciliationAsset,
    fetchReconciliationOverview
  } from '@/features/audit/reconciliation/mock'
  import type { ReconciliationAssetView } from '@/features/audit/reconciliation/types'
  import {
    coinColor,
    formatBaseAmount,
    formatLongDate,
    networkLabel
  } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliationUnitDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const merchantCode = ref<string>((route.query.merchant as string) || '')
  const coinId = ref<string>((route.query.coinId as string) || '')
  const network = ref<string>((route.query.network as string) || '')
  const unitId = ref<number>(Number(route.query.unitId) || 0)
  const selectedDate = ref<string>((route.query.date as string) || '')

  const merchantName = ref('')
  const asset = ref<ReconciliationAssetView | null>(null)
  const activeTab = ref<'included' | 'backfill'>('included')
  const loading = ref(false)
  const loadError = ref('')

  const day = computed(
    () => asset.value?.days.find((item) => item.date === selectedDate.value) ?? null
  )

  const currentUnitRow = computed(
    () => day.value?.units.find((row) => row.unitId === unitId.value) ?? day.value?.units[0] ?? null
  )

  const includedRows = computed(() =>
    (day.value?.includedTx ?? []).filter((tx) => tx.treasuryUnitId === currentUnitRow.value?.unitId)
  )

  const backfillRows = computed(() =>
    (day.value?.backfillTx ?? []).filter((tx) => tx.treasuryUnitId === currentUnitRow.value?.unitId)
  )

  const unitSummary = computed(() => {
    const row = currentUnitRow.value
    const decimals = asset.value?.decimals ?? 0
    if (!row) return []
    return [
      {
        key: 'opening',
        label: t('dailyReconciliation.openingBalance'),
        value: formatBaseAmount(row.openingBalance, decimals)
      },
      {
        key: 'closing',
        label: t('dailyReconciliation.closingBalance'),
        value: formatBaseAmount(row.closingBalance, decimals)
      },
      {
        key: 'included',
        label: t('dailyReconciliation.includedTx'),
        value: String(includedRows.value.length)
      },
      {
        key: 'backfill',
        label: t('dailyReconciliation.backfillTx'),
        value: String(backfillRows.value.length)
      }
    ]
  })

  function isClosedDateDisabled(date: Date): boolean {
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
    return !(asset.value?.days ?? []).some((item) => item.date === value)
  }

  async function loadAll(): Promise<void> {
    if (!merchantCode.value || !coinId.value || !network.value) {
      router.replace({ name: 'DailyReconciliation' })
      return
    }
    loading.value = true
    loadError.value = ''
    try {
      const overview = await fetchReconciliationOverview()
      const merchant = overview.merchants.find((m) => m.code === merchantCode.value)
      merchantName.value = merchant?.merchantName ?? ''

      asset.value = await fetchReconciliationAsset(merchantCode.value, coinId.value, network.value)
      if (!asset.value) return

      if (!selectedDate.value) selectedDate.value = asset.value.lastClosedDate
      if (!unitId.value) unitId.value = asset.value.units[0]?.id ?? 0
      syncQuery()
    } catch (caught) {
      asset.value = null
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load unit reconciliation detail.'
    } finally {
      loading.value = false
    }
  }

  function syncQuery(): void {
    router.replace({
      query: {
        merchant: merchantCode.value,
        coinId: coinId.value,
        network: network.value,
        date: selectedDate.value,
        unitId: String(unitId.value)
      }
    })
  }

  function syncUnit(): void {
    syncQuery()
  }

  function backToList(): void {
    router.push({ name: 'DailyReconciliation', query: { expand: merchantCode.value } })
  }

  function backToAsset(): void {
    router.push({
      name: 'daily-reconciliation-detail',
      query: {
        merchant: merchantCode.value,
        coinId: coinId.value,
        network: network.value
      }
    })
  }

  function iconStyle(id: string): Record<string, string> {
    const c = coinColor(id)
    return { background: c.bg, color: c.color }
  }

  onMounted(loadAll)
</script>

<style scoped>
  .asset-icon-large {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 16px;
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
</style>
