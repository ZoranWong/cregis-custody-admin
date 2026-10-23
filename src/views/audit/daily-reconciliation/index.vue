<!-- Daily Reconciliation — 商户级对账总览（可展开查看资产） -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 class="text-hero font-semibold text-g-900">
          {{ $t('dailyReconciliation.pageTitle') }}
        </h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('dailyReconciliation.pageSubtitle') }}</p>
      </div>
    </div>

    <!-- 后端接口未就绪提示：避免把示例数据误当成真实对账结果 -->
    <div
      class="mb-4 px-4 py-2.5 rounded-lg text-xs leading-relaxed bg-tone-progress-bg text-tone-progress-text border border-[var(--tone-progress-border)]"
    >
      {{ $t('dailyReconciliation.apiPending') }}
    </div>

    <!-- Merchant Search -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-input
        v-model="keyword"
        :placeholder="$t('dailyReconciliation.searchMerchants')"
        clearable
        class="!w-72"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
      <ElButton @click="toggleAll">
        {{
          allExpanded ? $t('dailyReconciliation.collapseAll') : $t('dailyReconciliation.expandAll')
        }}
      </ElButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="art-card p-5"><el-skeleton :rows="8" animated /></div>

    <!-- Load error -->
    <div v-else-if="loadError" class="art-card p-10 text-center">
      <p class="text-tone-error-text mb-4">{{ loadError }}</p>
      <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Merchant list -->
    <div v-else class="art-card overflow-hidden">
      <div class="merchant-head">
        <span class="col-merchant">{{ $t('dailyReconciliation.merchant') }}</span>
        <span class="col-stat">{{ $t('dailyReconciliation.assetCount') }}</span>
        <span class="col-stat">{{ $t('dailyReconciliation.blocked') }}</span>
        <span class="col-stat">{{ $t('dailyReconciliation.maxUnreconciledDays') }}</span>
        <span class="col-stat">{{ $t('dailyReconciliation.totalUnreconciledDays') }}</span>
        <span class="col-chevron"></span>
      </div>

      <div v-for="merchant in filteredMerchants" :key="merchant.code" class="merchant-block">
        <!-- Merchant row -->
        <div class="merchant-row" @click="toggle(merchant.code)">
          <div class="col-merchant flex items-center gap-3">
            <span class="merchant-icon" :style="avatarStyle(merchant.code)">
              {{ merchant.initials }}
            </span>
            <span class="text-sm font-semibold text-g-900">{{ merchant.merchantName }}</span>
          </div>
          <div class="col-stat">
            <span class="stat-label">{{ $t('dailyReconciliation.assetCount') }}</span>
            <span class="stat-value">{{ merchant.assetCount }}</span>
          </div>
          <div class="col-stat">
            <span class="stat-label">{{ $t('dailyReconciliation.blocked') }}</span>
            <span
              class="stat-value"
              :class="merchant.blockedAssets > 0 ? 'text-tone-error-text' : ''"
            >
              {{ merchant.blockedAssets }}
            </span>
          </div>
          <div class="col-stat">
            <span class="stat-label">{{ $t('dailyReconciliation.maxUnreconciledDays') }}</span>
            <span class="stat-value" :class="stalenessClass(merchant.maxUnreconciledDays)">
              {{ merchant.maxUnreconciledDays }}
            </span>
          </div>
          <div class="col-stat">
            <span class="stat-label">{{ $t('dailyReconciliation.totalUnreconciledDays') }}</span>
            <span
              class="stat-value"
              :class="merchant.totalUnreconciledDays > 0 ? 'text-tone-error-text' : ''"
            >
              {{ merchant.totalUnreconciledDays }}
            </span>
          </div>
          <div class="col-chevron">
            <ArtSvgIcon
              icon="ri:arrow-right-s-line"
              class="text-lg text-g-400 transition-transform"
              :class="expanded.has(merchant.code) ? 'rotate-90' : ''"
            />
          </div>
        </div>

        <!-- Asset rows -->
        <div v-if="expanded.has(merchant.code)" class="asset-panel">
          <div class="asset-subheader">
            <span>{{ $t('dailyReconciliation.asset') }}</span>
            <span class="text-right">{{ $t('dailyReconciliation.treasuryUnits') }}</span>
            <span class="text-right">{{ $t('dailyReconciliation.lastClosedBalance') }}</span>
            <span>{{ $t('dailyReconciliation.lastClosedDate') }}</span>
            <span>{{ $t('dailyReconciliation.unreconciledDays') }}</span>
            <span></span>
          </div>
          <div
            v-for="row in merchant.assets"
            :key="`${row.coinId}-${row.network}`"
            class="asset-row"
            @click.stop="openDetail(merchant, row)"
          >
            <div class="flex items-center gap-2.5">
              <span class="asset-icon" :style="iconStyle(row.coinId)">
                {{ coinColor(row.coinId).symbol }}
              </span>
              <div class="flex flex-col leading-tight">
                <span class="text-sm font-semibold text-g-900">{{ row.coinId }}</span>
                <span class="text-xs text-g-500">{{ networkLabel(row.network) }}</span>
              </div>
            </div>
            <span class="text-right text-sm tabular-nums text-g-700">{{
              row.treasuryUnitCount
            }}</span>
            <span class="text-right text-sm font-semibold tabular-nums text-g-900">{{
              formatBaseAmount(row.lastClosedBalance, row.decimals)
            }}</span>
            <span class="text-sm text-g-700">{{ formatShortDate(row.lastClosedDate) }}</span>
            <span class="text-xs font-semibold" :class="stalenessClass(row.unreconciledDays)">{{
              row.unreconciledDays
            }}</span>
            <ArtSvgIcon icon="ri:arrow-right-s-line" class="text-lg text-g-400" />
          </div>
        </div>
      </div>

      <div v-if="filteredMerchants.length === 0" class="p-10 text-center text-g-500">
        {{ $t('dailyReconciliation.noMerchants') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchReconciliationOverview } from '@/features/audit/reconciliation/mock'
  import type {
    ReconciliationAssetRowView,
    ReconciliationMerchantRowView
  } from '@/features/audit/reconciliation/types'
  import {
    coinColor,
    formatBaseAmount,
    formatShortDate,
    networkLabel
  } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliation' })

  const router = useRouter()

  const merchants = ref<ReconciliationMerchantRowView[]>([])
  const expanded = ref(new Set<string>())
  const keyword = ref('')
  const loading = ref(false)
  const loadError = ref('')

  const filteredMerchants = computed(() => {
    const q = keyword.value.trim().toLowerCase()
    if (!q) return merchants.value
    return merchants.value.filter((m) => m.merchantName.toLowerCase().includes(q))
  })

  const allExpanded = computed(
    () => merchants.value.length > 0 && merchants.value.every((m) => expanded.value.has(m.code))
  )

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const overview = await fetchReconciliationOverview()
      merchants.value = overview.merchants
      // 默认展开「存在未对账资产」的商户，便于直接看到需要关注的资产
      expanded.value = new Set(
        overview.merchants.filter((m) => m.blockedAssets > 0).map((m) => m.code)
      )
    } catch (caught) {
      merchants.value = []
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load reconciliation overview.'
    } finally {
      loading.value = false
    }
  }

  function toggle(code: string): void {
    const next = new Set(expanded.value)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    expanded.value = next
  }

  function toggleAll(): void {
    expanded.value = allExpanded.value ? new Set() : new Set(merchants.value.map((m) => m.code))
  }

  function openDetail(
    merchant: ReconciliationMerchantRowView,
    row: ReconciliationAssetRowView
  ): void {
    router.push({
      name: 'daily-reconciliation-detail',
      query: {
        merchant: merchant.code,
        coinId: row.coinId,
        network: row.network
      }
    })
  }

  /** 0 天新鲜、1-2 天偏旧、3 天以上严重滞后（与原型三档配色一致） */
  function stalenessClass(days: number): string {
    if (days === 0) return 'text-tone-done-text'
    if (days <= 2) return 'text-tone-progress-text'
    return 'text-tone-error-text'
  }

  function iconStyle(coinId: string): Record<string, string> {
    const c = coinColor(coinId)
    return { background: c.bg, color: c.color }
  }

  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #3b82f6, #2563eb)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #f59e0b, #d97706)'
  ]

  function avatarStyle(code: string): Record<string, string> {
    const index = Math.abs(Number(code) || 0) % AVATAR_GRADIENTS.length
    return { background: AVATAR_GRADIENTS[index]! }
  }

  onMounted(load)
</script>

<style scoped>
  .merchant-head,
  .merchant-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.6fr) repeat(4, minmax(120px, 1fr)) 40px;
    gap: 12px;
    align-items: center;
    padding: 12px 20px;
  }

  .merchant-head {
    font-size: 11px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--tone-neutral-bg);
    border-bottom: 1px solid var(--default-border);
  }

  .merchant-head .col-stat {
    text-align: right;
  }

  .merchant-block + .merchant-block {
    border-top: 1px solid var(--default-border);
  }

  .merchant-row {
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .merchant-row:hover {
    background: var(--tone-neutral-bg);
  }

  .col-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: right;
  }

  .stat-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--g-900, var(--theme-text));
  }

  .col-chevron {
    display: flex;
    justify-content: flex-end;
    color: var(--tone-muted-text);
  }

  .merchant-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border-radius: 8px;
  }

  .asset-panel {
    padding: 0 20px 8px 52px;
    background: var(--tone-neutral-bg);
  }

  .asset-subheader,
  .asset-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.6fr) repeat(4, minmax(120px, 1fr)) 40px;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
  }

  .asset-subheader {
    font-size: 10px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .asset-row {
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .asset-row:hover {
    background: var(--theme-bg, #fff);
  }

  .asset-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 50%;
  }

  .rotate-90 {
    transform: rotate(90deg);
  }
</style>
