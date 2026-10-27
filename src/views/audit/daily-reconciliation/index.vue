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
    <ArtMockNotice :description="$t('dailyReconciliation.apiPending')" />

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
        <el-table-column :label="$t('dailyReconciliation.merchantName')" min-width="200">
          <template #default="{ row }">
            <div class="merchant-cell">
              <div class="merchant-icon" :style="avatarStyle(row.code)">
                {{ row.initials }}
              </div>
              <div class="merchant-name">{{ row.merchantName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.assetCount')" min-width="130">
          <template #default="{ row }">
            <span class="stat-value">{{ row.assetCount }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.blocked')" min-width="120">
          <template #default="{ row }">
            <span class="stat-value" :class="{ exceptions: row.blockedAssets > 0 }">
              {{ row.blockedAssets }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.maxUnreconciledDays')" min-width="180">
          <template #default="{ row }">
            <span class="stat-value" :class="stalenessClass(row.maxUnreconciledDays)">
              {{ row.maxUnreconciledDays }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('dailyReconciliation.totalUnreconciledDays')" min-width="180">
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
              <el-table
                :data="row.assets"
                class="asset-table"
                row-key="coinId"
                size="small"
                @row-click="(asset: ReconciliationAssetRowView) => openAsset(row, asset)"
              >
                <el-table-column
                  :label="$t('dailyReconciliation.asset')"
                  min-width="220"
                  class-name="asset-name-col"
                >
                  <template #default="{ row: asset }">
                    <div class="asset-cell">
                      <img
                        v-if="iconOf(asset) && !iconFailed(asset)"
                        class="asset-icon-img"
                        :src="iconOf(asset)!"
                        :alt="asset.coinId"
                        loading="lazy"
                        @error="markIconFailed(asset)"
                      />
                      <div v-else class="asset-icon" :style="fallbackStyle(asset.coinId)">
                        {{ asset.coinId.slice(0, 1).toUpperCase() }}
                      </div>
                      <div class="asset-info">
                        <span class="asset-name">{{ asset.coinId }}</span>
                        <span class="asset-network">{{ networkLabel(asset.network) }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column
                  :label="$t('dailyReconciliation.treasuryUnits')"
                  width="160"
                  align="left"
                >
                  <template #default="{ row: asset }">{{ asset.treasuryUnitCount }}</template>
                </el-table-column>

                <el-table-column
                  :label="$t('dailyReconciliation.lastClosedBalance')"
                  width="220"
                  align="left"
                >
                  <template #default="{ row: asset }">
                    <span class="balance-cell">{{
                      formatBaseAmountDisplay(asset.lastClosedBalance, asset.decimals)
                    }}</span>
                  </template>
                </el-table-column>

                <el-table-column
                  :label="$t('dailyReconciliation.lastClosedDate')"
                  width="170"
                  align="left"
                >
                  <template #default="{ row: asset }">{{
                    formatShortDate(asset.lastClosedDate)
                  }}</template>
                </el-table-column>

                <el-table-column
                  :label="$t('dailyReconciliation.unreconciledDays')"
                  width="180"
                  align="left"
                >
                  <template #default="{ row: asset }">
                    <span class="staleness-cell" :class="stalenessClass(asset.unreconciledDays)">
                      {{ asset.unreconciledDays }}
                    </span>
                  </template>
                </el-table-column>

                <el-table-column width="48" align="center">
                  <template #default>
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
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import type { TableInstance } from 'element-plus'
  import { fetchReconciliationOverview } from '@/features/audit/reconciliation/mock'
  import {
    assetRollup,
    assetsFromCoinList,
    coinFallbackStyle,
    coinIconMap,
    coinKey
  } from '@/features/audit/reconciliation/coins'
  import type {
    ReconciliationAssetRowView,
    ReconciliationMerchantRowView
  } from '@/features/audit/reconciliation/types'
  import { useCoinStore } from '@/store/modules/coins'
  import {
    formatBaseAmountDisplay,
    formatShortDate,
    networkLabel
  } from '@/views/audit/_shared/format'

  defineOptions({ name: 'DailyReconciliation' })

  const router = useRouter()
  const coinStore = useCoinStore()

  const merchants = ref<ReconciliationMerchantRowView[]>([])
  /** 与表格展开状态保持同步，仅用于驱动「全部展开 / 收起」按钮文案 */
  const expanded = ref(new Set<string>())
  const tableRef = ref<TableInstance>()
  const keyword = ref('')
  const loading = ref(false)
  const loadError = ref('')
  /** 加载失败的图标，回退为字母角标 */
  const failedIcons = reactive(new Set<string>())

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
      const [overview] = await Promise.all([
        fetchReconciliationOverview(),
        coinStore.ensureLoaded()
      ])
      merchants.value = overview.merchants.map((m) => {
        const assets = assetsFromCoinList(coinStore.list, m.assets)
        // 商户汇总随资产行重算，避免与子表展示的数量/天数不一致
        return { ...m, assets, ...assetRollup(assets) }
      })
      expanded.value = new Set()
    } catch (caught) {
      merchants.value = []
      loadError.value =
        caught instanceof Error ? caught.message : 'Unable to load reconciliation overview.'
    } finally {
      loading.value = false
    }
  }

  /** 系统币种图标：coinId@network → 图标地址 */
  const COIN_ICONS = computed(() => coinIconMap(coinStore.list))

  function iconOf(asset: ReconciliationAssetRowView): string | undefined {
    return COIN_ICONS.value.get(coinKey(asset.coinId, asset.network))
  }

  function iconFailed(asset: ReconciliationAssetRowView): boolean {
    return failedIcons.has(coinKey(asset.coinId, asset.network))
  }

  function markIconFailed(asset: ReconciliationAssetRowView): void {
    failedIcons.add(coinKey(asset.coinId, asset.network))
  }

  /** 图标缺失/加载失败时的字母角标配色 */
  function fallbackStyle(coinId: string): Record<string, string> {
    return coinFallbackStyle(coinId)
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
    color: var(--tone-strong-text);
  }

  .stat-value {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--tone-strong-text);
  }

  .stat-value.exceptions {
    color: var(--tone-progress-text);
  }

  /* ========== 展开行：资产明细（tier 2，ElTable） ========== */
  :deep(.el-table__expanded-cell) {
    padding: 0 !important;
    background: var(--tone-neutral-bg);
  }

  .asset-panel {
    padding: 4px 0 8px;
    background: var(--tone-neutral-bg);
  }

  /* 子表：表头与主表同一视觉语言 */
  .asset-table {
    --el-table-border-color: var(--default-border);
    --el-table-bg-color: var(--default-box-color);
    --el-table-tr-bg-color: var(--default-box-color);
    --el-table-header-bg-color: var(--tone-neutral-bg);
    --el-table-row-hover-bg-color: var(--tone-neutral-bg);
    --el-table-text-color: var(--tone-secondary-text);
    --el-table-header-text-color: var(--tone-muted-text);

    width: 100%;
    font-size: var(--font-size-body);
  }

  /* 资产列与主表商户名对齐（展开列占 48px） */
  .asset-table :deep(.asset-name-col .cell) {
    padding-left: 62px;
  }

  .asset-table :deep(th.el-table__cell) {
    padding: 8px 14px;
    font-size: var(--font-size-label);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .asset-table :deep(td.el-table__cell) {
    padding: 12px 14px;
    vertical-align: middle;
  }

  .asset-table :deep(.el-table__row) {
    cursor: pointer;
  }

  .balance-cell {
    font-variant-numeric: tabular-nums;
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
    color: var(--tone-muted-text);
    vertical-align: middle;
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

  /* 系统币种图标：与字母角标同尺寸，避免两种状态切换时行高跳动 */
  .asset-icon-img {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 50%;
  }

  .asset-info {
    display: flex;
    flex-direction: column;
  }

  .asset-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--tone-strong-text);
  }

  .asset-network {
    font-size: 11px;
    color: var(--tone-muted-text);
  }

  .chevron-icon {
    display: inline-block;
    color: var(--tone-muted-text);
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
