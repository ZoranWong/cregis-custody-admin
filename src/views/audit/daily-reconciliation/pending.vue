<!-- Daily Reconciliation Pending — 待入账交易汇总（全部财资单元） -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs text-tone-muted-text mb-3">
        <button class="hover:text-g-700" @click="backToList">
          {{ $t('dailyReconciliation.pageTitle') }}
        </button>
        <span class="opacity-50">/</span>
        <span class="text-g-700 font-medium">{{
          $t('dailyReconciliation.pendingCrumb', { date: formatLongDate(date) })
        }}</span>
      </div>

      <!-- Page header -->
      <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 class="text-hero font-semibold text-g-900">
            {{ $t('dailyReconciliation.pendingTitle') }}
          </h1>
          <p class="text-sm text-g-700 mt-1">
            {{ $t('dailyReconciliation.pendingSubtitle') }} · {{ merchantName }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <el-select v-model="merchantCode" class="!w-48" @change="load">
            <el-option
              v-for="m in merchants"
              :key="m.code"
              :label="m.merchantName"
              :value="m.code"
            />
          </el-select>
          <span class="text-xs text-g-600">{{ formatLongDate(date) }}</span>
        </div>
      </div>

      <!-- Summary -->
      <ElRow :gutter="20" class="flex mb-5">
        <ElCol v-for="card in summaryCards" :key="card.key" :sm="8" class="mb-4 sm:mb-0">
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

      <!-- Table -->
      <div class="art-card overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--default-border)]"
        >
          <h3 class="text-base font-semibold text-g-900">
            {{ $t('dailyReconciliation.allPending') }}
          </h3>
          <span class="badge">{{ $t('dailyReconciliation.txCount', { count: rows.length }) }}</span>
        </div>
        <ReconciliationTransactionTable
          :rows="rows"
          :decimals="decimals"
          :show-balance="false"
          linkable
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import ReconciliationTransactionTable from './components/TransactionTable.vue'
  import {
    fetchReconciliationPending,
    listReconciliationMerchants,
    RECONCILIATION_SEED_DATE
  } from '@/features/audit/reconciliation/mock'
  import type { ReconciliationTxView } from '@/features/audit/reconciliation/types'
  import { formatLongDate } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliationPending' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const merchants = ref<Array<{ code: string; merchantName: string; initials: string }>>([])
  const merchantCode = ref<string>((route.query.merchant as string) || '1225')
  const merchantName = ref('')
  const date = ref<string>((route.query.date as string) || RECONCILIATION_SEED_DATE)
  const rows = ref<ReconciliationTxView[]>([])
  const loading = ref(false)
  const loadError = ref('')

  /** 汇总页混排多个资产：每行按自身 decimals 展示，此值仅作兜底 */
  const decimals = computed(() => 6)

  const summaryCards = computed(() => {
    const held = rows.value.filter((row) => row.status === 'held').length
    const forfeited = rows.value.filter((row) => row.status === 'forfeited').length
    return [
      {
        key: 'total',
        label: t('dailyReconciliation.totalPending'),
        value: String(rows.value.length)
      },
      {
        key: 'held',
        label: t('dailyReconciliation.held'),
        value: String(held),
        tone: 'text-tone-progress-text'
      },
      {
        key: 'forfeited',
        label: t('dailyReconciliation.forfeited'),
        value: String(forfeited),
        tone: 'text-tone-error-text'
      }
    ]
  })

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const result = await fetchReconciliationPending(merchantCode.value)
      merchantName.value = result.merchantName
      rows.value = result.rows
      if (result.date) date.value = result.date
    } catch (caught) {
      rows.value = []
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load pending transactions.'
    } finally {
      loading.value = false
    }
  }

  function backToList(): void {
    router.push({ name: 'DailyReconciliation', query: { expand: merchantCode.value } })
  }

  onMounted(async () => {
    merchants.value = await listReconciliationMerchants()
    await load()
  })
</script>

<style scoped>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--tone-progress-text);
    background: var(--tone-progress-bg);
    border-radius: 20px;
  }
</style>
