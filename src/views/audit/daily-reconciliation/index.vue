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

    <!-- 后端接口未就绪提示 -->
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
    <div v-if="loading" class="art-card art-table-card overflow-hidden p-5">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Load error -->
    <div v-else-if="loadError" class="art-card p-10 text-center">
      <p class="text-tone-error-text mb-4">{{ loadError }}</p>
      <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- 主列表：商户行（el-table 无表头） + 子列表：资产行（el-table 有表头） -->
    <div v-else class="art-card art-table-card overflow-hidden">
      <!-- 商户主列表 -->
      <el-table
        :data="filteredMerchants"
        size="small"
        :show-header="false"
        style="width: 100%"
        @row-click="toggle"
      >
        <el-table-column min-width="220">
          <template #default="{ row }">
            <div class="merchant-cell">
              <span class="merchant-icon" :style="avatarStyle(row.code)">{{ row.initials }}</span>
              <span class="merchant-name">{{ row.merchantName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column min-width="120" align="right">
          <template #default="{ row }">
            <span class="stat-value">{{ row.assetCount }}</span>
          </template>
        </el-table-column>
        <el-table-column min-width="100" align="right">
          <template #default="{ row }">
            <span class="stat-value" :class="{ exceptions: row.blockedAssets > 0 }">
              {{ row.blockedAssets }}
            </span>
          </template>
        </el-table-column>
        <el-table-column min-width="160" align="right">
          <template #default="{ row }">
            <span
              class="stat-value"
              :class="
                row.maxUnreconciledDays === 0
                  ? 'staleness-cell fresh'
                  : row.maxUnreconciledDays <= 2
                    ? 'staleness-cell stale'
                    : 'staleness-cell very-stale'
              "
              >{{ row.maxUnreconciledDays }}</span
            >
          </template>
        </el-table-column>
        <el-table-column min-width="160" align="right">
          <template #default="{ row }">
            <span class="stat-value" :class="{ exceptions: row.totalUnreconciledDays > 0 }">{{
              row.totalUnreconciledDays
            }}</span>
          </template>
        </el-table-column>
        <el-table-column width="48" align="center">
          <template #header>
            <span></span>
          </template>
          <template #default="{ row }">
            <svg
              class="expand-icon expand-icon-click"
              :class="{ expanded: expanded.has(row.code) }"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style="color: var(--ink-400)"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </template>
        </el-table-column>
      </el-table>

      <!-- 展开后的资产子列表（el-table，系统样式） -->
      <template v-for="merchant in filteredMerchants" :key="`${merchant.code}-sub`">
        <div v-if="expanded.has(merchant.code)" class="asset-sub-table">
          <div class="asset-sub-spacer"></div>
          <el-table
            :data="merchant.assets"
            size="small"
            :show-header="true"
            style="width: 100%"
            @row-click="
              (row) =>
                router.push({
                  name: 'daily-reconciliation-detail',
                  query: {
                    merchant: merchant.code,
                    coinId: row.coinId,
                    network: row.network
                  }
                })
            "
          >
            <el-table-column :label="$t('dailyReconciliation.asset')" min-width="220">
              <template #default="{ row }">
                <div class="asset-cell">
                  <span class="asset-icon" :style="iconStyle(row.coinId)">
                    {{ coinColor(row.coinId).symbol }}
                  </span>
                  <div class="asset-info">
                    <span class="asset-name">{{ row.coinId }}</span>
                    <span class="asset-network">{{ networkLabel(row.network) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('dailyReconciliation.treasuryUnits')"
              width="110"
              align="right"
            >
              <template #default="{ row }">
                <span class="text-sm tabular-nums text-g-700">{{ row.treasuryUnitCount }}</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('dailyReconciliation.lastClosedBalance')"
              min-width="200"
              align="right"
            >
              <template #default="{ row }">
                <span class="text-sm font-semibold tabular-nums text-g-900">{{
                  formatBaseAmountDisplay(row.lastClosedBalance, row.decimals)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('dailyReconciliation.lastClosedDate')"
              width="140"
              align="right"
            >
              <template #default="{ row }">
                <span class="text-sm text-g-700">{{ formatShortDate(row.lastClosedDate) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('dailyReconciliation.unreconciledDays')"
              width="130"
              align="right"
            >
              <template #default="{ row }">
                <span
                  class="text-xs font-semibold tabular-nums"
                  :class="
                    row.unreconciledDays === 0
                      ? 'text-tone-done-text'
                      : row.unreconciledDays <= 2
                        ? 'text-tone-progress-text'
                        : 'text-tone-error-text'
                  "
                  >{{ row.unreconciledDays }}</span
                >
              </template>
            </el-table-column>
            <el-table-column width="48" align="center">
              <template #default>
                <ArtSvgIcon icon="ri:arrow-right-s-line" class="text-lg text-g-400" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchReconciliationOverview } from '@/features/audit/reconciliation/mock'
  import type { ReconciliationMerchantRowView } from '@/features/audit/reconciliation/types'
  import {
    coinColor,
    formatBaseAmountDisplay,
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
      // 默认展开「存在未对账资产」的商户
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
  /* ========== 主列表 el-table 样式 ========== */
  :deep(.el-table__body tr) {
    cursor: pointer;
    transition: background 0.15s;
  }

  :deep(.el-table__body tr:hover) {
    background: var(--tone-neutral-bg) !important;
  }

  .merchant-cell {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .merchant-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    border-radius: 8px;
  }

  .merchant-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--theme-text, var(--g-900));
  }

  /* 资产子表容器 */
  .asset-sub-spacer {
    height: 4px;
  }

  .asset-sub-table {
    background: var(--tone-neutral-bg);
    border-top: 1px solid var(--default-border);
  }

  .asset-sub-table :deep(.el-table) {
    background: var(--tone-neutral-bg);
    border: none;
  }

  .stat-value {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--theme-text, var(--g-900));
  }

  .stat-value.exceptions {
    color: var(--tone-progress-text);
  }

  .expand-icon {
    transition: transform 0.15s;
  }

  .expand-icon-click {
    padding: 4px;
    cursor: pointer;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .asset-sub-table :deep(.el-table__body tr) {
    cursor: pointer;
    transition: background 0.15s;
  }

  .asset-sub-table :deep(.el-table__body tr:hover) {
    background: var(--tone-neutral-bg) !important;
  }

  /* 资产单元格样式 */
  .asset-cell {
    display: flex;
    gap: 10px;
    align-items: center;
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

  .asset-info {
    display: flex;
    flex-direction: column;
  }

  .asset-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--theme-text, var(--g-900));
  }

  .asset-network {
    font-size: 11px;
    color: var(--tone-muted-text);
  }

  .staleness-cell {
    font-size: 12px;
    font-weight: 600;
  }

  .staleness-cell.fresh {
    color: var(--tone-done-text);
  }

  .staleness-cell.stale {
    color: var(--tone-progress-text);
  }

  .staleness-cell.very-stale {
    color: var(--tone-error-text);
  }
</style>
