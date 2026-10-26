<!-- Daily Reconciliation — 商户级对账总览（ElTable） -->
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

    <!-- 商户总表：展开行展示资产明细 -->
    <div v-else class="art-card art-table-card overflow-hidden">
      <el-table
        ref="tableRef"
        :data="filteredMerchants"
        row-key="code"
        row-class-name="merchant-row"
        @row-click="toggleMerchant"
        @expand-change="handleExpandChange"
      >
        <template #empty>
          <div class="p-10 text-center text-g-500">
            {{ merchants.length ? $t('dailyReconciliation.noMerchants') : $t('common.noData') }}
          </div>
        </template>

        <!-- 普通列 -->
        <el-table-column :label="$t('dailyReconciliation.merchantName')" min-width="240">
          <template #default="{ row }">
            <div class="merchant-cell">
              <div class="merchant-icon" :style="avatarStyle(row.code)">
                {{ row.initials }}
              </div>
              <div class="merchant-name">{{ row.merchantName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.assetCount')" width="150">
          <template #default="{ row }">
            <span class="stat-value">{{ row.assetCount }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.blocked')" width="140">
          <template #default="{ row }">
            <span class="stat-value" :class="{ exceptions: row.blockedAssets > 0 }">
              {{ row.blockedAssets }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.maxUnreconciledDays')" width="220">
          <template #default="{ row }">
            <span class="stat-value" :class="stalenessClass(row.maxUnreconciledDays)">
              {{ row.maxUnreconciledDays }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.totalUnreconciledDays')" width="220">
          <template #default="{ row }">
            <span class="stat-value" :class="{ exceptions: row.totalUnreconciledDays > 0 }">
              {{ row.totalUnreconciledDays }}
            </span>
          </template>
        </el-table-column>

        <!-- 展开列放在最后：箭头在行尾，展开内容仍按整行渲染 -->
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="asset-panel">
              <table class="asset-table">
                <colgroup>
                  <col />
                  <col class="num-col" />
                  <col class="num-col" />
                  <col class="date-col" />
                  <col class="days-col" />
                  <col class="chevron-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th>{{ $t('dailyReconciliation.asset') }}</th>
                    <th>{{ $t('dailyReconciliation.treasuryUnits') }}</th>
                    <th>{{ $t('dailyReconciliation.lastClosedBalance') }}</th>
                    <th>{{ $t('dailyReconciliation.lastClosedDate') }}</th>
                    <th>{{ $t('dailyReconciliation.unreconciledDays') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="asset in row.assets"
                    :key="`${asset.coinId}-${asset.network}`"
                    class="asset-row"
                    @click="openAsset(row, asset)"
                  >
                    <td>
                      <div class="asset-cell">
                        <div class="asset-icon" :style="iconStyle(asset.coinId)">
                          {{ coinColor(asset.coinId).symbol }}
                        </div>
                        <div class="asset-info">
                          <span class="asset-name">{{ asset.coinId }}</span>
                          <span class="asset-network">{{ networkLabel(asset.network) }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ asset.treasuryUnitCount }}</td>
                    <td class="balance-cell">
                      {{ formatBaseAmountDisplay(asset.lastClosedBalance, asset.decimals) }}
                    </td>
                    <td>{{ formatShortDate(asset.lastClosedDate) }}</td>
                    <td>
                      <span class="staleness-cell" :class="stalenessClass(asset.unreconciledDays)">
                        {{ asset.unreconciledDays }}
                      </span>
                    </td>
                    <td class="chevron-col">
                      <svg
                        class="chevron-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import type { TableInstance } from 'element-plus'
  import { fetchReconciliationOverview } from '@/features/audit/reconciliation/mock'
  import type {
    ReconciliationAssetRowView,
    ReconciliationMerchantRowView
  } from '@/features/audit/reconciliation/types'
  import {
    coinColor,
    formatBaseAmountDisplay,
    formatShortDate,
    networkLabel
  } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliation' })

  const router = useRouter()

  const merchants = ref<ReconciliationMerchantRowView[]>([])
  /** 与表格展开状态保持同步，仅用于驱动「全部展开 / 收起」按钮文案 */
  const expanded = ref(new Set<string>())
  const tableRef = ref<TableInstance>()
  const keyword = ref('')
  const loading = ref(false)
  const loadError = ref('')

  const filteredMerchants = computed(() => {
    const q = keyword.value.trim().toLowerCase()
    if (!q) return merchants.value
    return merchants.value.filter((m) => m.merchantName.toLowerCase().includes(q))
  })

  const allExpanded = computed(
    () =>
      filteredMerchants.value.length > 0 &&
      filteredMerchants.value.every((m) => expanded.value.has(m.code))
  )

  function applyDefaultExpansion(): void {
    const codes = merchants.value.filter((m) => m.blockedAssets > 0).map((m) => m.code)
    if (!codes.length) return
    const target = new Set(codes)
    filteredMerchants.value.forEach((m) => {
      if (target.has(m.code)) tableRef.value?.toggleRowExpansion(m, true)
    })
  }

  // 必须在 ElTable 子组件 onMounted 注册完列之后才能按行展开：
  // 只等 nextTick 时列还是空的，toggleRowExpansion 会走 tree 分支而失效。
  watch(tableRef, (table) => {
    if (table) window.setTimeout(applyDefaultExpansion, 0)
  })

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const overview = await fetchReconciliationOverview()
      merchants.value = overview.merchants
      expanded.value = new Set()
    } catch (caught) {
      merchants.value = []
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load reconciliation overview.'
    } finally {
      loading.value = false
    }
  }

  /** 点击整行展开/收起；行内资产明细的点击不会冒泡到这里 */
  function toggleMerchant(row: ReconciliationMerchantRowView): void {
    tableRef.value?.toggleRowExpansion(row)
  }

  function handleExpandChange(
    row: ReconciliationMerchantRowView,
    expandedRows: ReconciliationMerchantRowView[] | boolean
  ): void {
    const isExpanded = Array.isArray(expandedRows) ? expandedRows.includes(row) : expandedRows
    const next = new Set(expanded.value)
    if (isExpanded) next.add(row.code)
    else next.delete(row.code)
    expanded.value = next
  }

  function toggleAll(): void {
    const target = !allExpanded.value
    filteredMerchants.value.forEach((m) => tableRef.value?.toggleRowExpansion(m, target))
  }

  function openAsset(merchant: ReconciliationMerchantRowView, asset: ReconciliationAssetRowView) {
    router.push({
      name: 'daily-reconciliation-detail',
      query: { merchant: merchant.code, coinId: asset.coinId, network: asset.network }
    })
  }

  function stalenessClass(days: number): string {
    if (days === 0) return 'fresh'
    if (days <= 2) return 'stale'
    return 'very-stale'
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
  /* ========== 商户行（tier 1） ========== */
  :deep(.merchant-row) {
    cursor: pointer;
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

  .stat-value {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--theme-text, var(--g-900));
  }

  .stat-value.exceptions {
    color: var(--tone-progress-text);
  }

  /* ========== 展开行：资产明细（tier 2） ========== */
  :deep(.el-table__expanded-cell) {
    padding: 0 !important;
    background: var(--tone-neutral-bg);
  }

  .asset-panel {
    padding: 4px 0 8px;
    background: var(--tone-neutral-bg);
  }

  .asset-table {
    width: 100%;

    /* 固定布局：列宽不随资产名称/金额长度变化 */
    table-layout: fixed;
    border-collapse: collapse;
    background: var(--theme-surface, #fff);
  }

  .asset-table th {
    padding: 8px 14px;
    font-size: 10px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    background: var(--tone-neutral-bg);
    border-top: 1px solid var(--default-border);
    border-bottom: 1px solid var(--default-border);
  }

  .asset-table th:first-child {
    padding-left: 62px;
  }

  .asset-table td {
    padding: 12px 14px;
    vertical-align: middle;
    border-bottom: 1px solid var(--default-border);
  }

  .asset-table td:first-child {
    padding-left: 62px;
  }

  .asset-table tbody tr:last-child td {
    border-bottom: none;
  }

  .asset-table col.num-col {
    width: 160px;
  }

  .asset-table col.date-col {
    width: 150px;
  }

  .asset-table col.days-col {
    width: 170px;
  }

  .asset-table col.chevron-col {
    width: 48px;
  }

  .num-col,
  .balance-cell {
    font-variant-numeric: tabular-nums;
  }

  .chevron-col {
    text-align: center;
  }

  /* 展开列：箭头居中，展开后旋转 90° */
  :deep(.el-table__expand-column .cell) {
    padding: 0;
    text-align: center;
  }

  /* 固定正方形盒子：旋转后包围盒尺寸不变，箭头不会左右漂移 */
  :deep(.el-table__expand-icon) {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin: 0 auto;
    color: var(--ink-400);
    vertical-align: middle;
  }

  .asset-row {
    cursor: pointer;
    transition: background 0.15s;
  }

  .asset-row:hover td {
    background: var(--tone-neutral-bg);
  }

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

  .balance-cell {
    font-weight: 600;
    color: var(--theme-text, var(--g-900));
  }

  .chevron-icon {
    display: inline-block;
    color: var(--ink-400);
    vertical-align: middle;
  }

  .staleness-cell {
    font-size: 12px;
    font-weight: 600;
  }

  .staleness-cell.fresh,
  .stat-value.fresh {
    color: var(--tone-done-text);
  }

  .staleness-cell.stale,
  .stat-value.stale {
    color: var(--tone-progress-text);
  }

  .staleness-cell.very-stale,
  .stat-value.very-stale {
    color: var(--tone-error-text);
  }
</style>
