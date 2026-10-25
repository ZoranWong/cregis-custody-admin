<!-- Daily Reconciliation — 商户级对账总览（完全按原型结构） -->
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

    <!-- 完全按原型结构：原生 table + merchant-row + asset-subheader + asset-row -->
    <div v-else class="table-wrap">
      <table>
        <tbody>
          <template v-for="merchant in filteredMerchants" :key="merchant.code">
            <!-- 商户行（tier 1） -->
            <tr class="merchant-row" :data-merchant="merchant.code" @click="toggle(merchant.code)">
              <td>
                <div class="merchant-cell">
                  <div class="merchant-icon" :style="avatarStyle(merchant.code)">
                    {{ merchant.initials }}
                  </div>
                  <div class="merchant-name">{{ merchant.merchantName }}</div>
                </div>
              </td>
              <td>
                <span class="stat-label">{{ $t('dailyReconciliation.assetCount') }}</span>
                <span class="stat-value">{{ merchant.assetCount }}</span>
              </td>
              <td>
                <span class="stat-label">{{ $t('dailyReconciliation.blocked') }}</span>
                <span class="stat-value" :class="{ exceptions: merchant.blockedAssets > 0 }">
                  {{ merchant.blockedAssets }}
                </span>
              </td>
              <td>
                <span class="stat-label">{{ $t('dailyReconciliation.maxUnreconciledDays') }}</span>
                <span
                  class="stat-value"
                  :class="
                    merchant.maxUnreconciledDays === 0
                      ? 'staleness-cell fresh'
                      : merchant.maxUnreconciledDays <= 2
                        ? 'staleness-cell stale'
                        : 'staleness-cell very-stale'
                  "
                  >{{ merchant.maxUnreconciledDays }}</span
                >
              </td>
              <td>
                <span class="stat-label">{{
                  $t('dailyReconciliation.totalUnreconciledDays')
                }}</span>
                <span
                  class="stat-value"
                  :class="{ exceptions: merchant.totalUnreconciledDays > 0 }"
                  >{{ merchant.totalUnreconciledDays }}</span
                >
              </td>
              <td style="text-align: right">
                <svg
                  class="expand-icon"
                  :class="{ expanded: expanded.has(merchant.code) }"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="color: var(--ink-400)"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </td>
            </tr>

            <!-- 资产子表头（tier 2 header，仅展开时显示） -->
            <tr
              v-if="expanded.has(merchant.code)"
              class="asset-subheader"
              :data-parent="merchant.code"
            >
              <td>{{ $t('dailyReconciliation.asset') }}</td>
              <td>{{ $t('dailyReconciliation.treasuryUnits') }}</td>
              <td>{{ $t('dailyReconciliation.lastClosedBalance') }}</td>
              <td>{{ $t('dailyReconciliation.lastClosedDate') }}</td>
              <td>{{ $t('dailyReconciliation.unreconciledDays') }}</td>
              <td></td>
            </tr>

            <!-- 资产行（tier 2，仅展开时显示） -->
            <tr
              v-for="asset in merchant.assets"
              :key="`${merchant.code}-${asset.coinId}-${asset.network}`"
              class="asset-row"
              :data-parent="merchant.code"
              :class="{ visible: expanded.has(merchant.code) }"
              @click="
                router.push({
                  name: 'daily-reconciliation-detail',
                  query: {
                    merchant: merchant.code,
                    coinId: asset.coinId,
                    network: asset.network
                  }
                })
              "
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
              <td class="count-cell">{{ asset.treasuryUnitCount }}</td>
              <td class="balance-cell">
                {{ formatBaseAmountDisplay(asset.lastClosedBalance, asset.decimals) }}
              </td>
              <td class="date-cell">{{ formatShortDate(asset.lastClosedDate) }}</td>
              <td
                class="staleness-cell"
                :class="
                  asset.unreconciledDays === 0
                    ? 'fresh'
                    : asset.unreconciledDays <= 2
                      ? 'stale'
                      : 'very-stale'
                "
              >
                {{ asset.unreconciledDays }}
              </td>
              <td style="text-align: right">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="color: var(--ink-400)"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
  /* ========== 原型 table-wrap 样式 ========== */
  .table-wrap {
    overflow: hidden;
    background: var(--theme-surface, #fff);
    border: 1px solid var(--default-border);
    border-radius: 12px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  /* 商户行（tier 1） */
  .merchant-row {
    cursor: pointer;
    transition: background 0.15s;
  }

  .merchant-row:hover {
    background: var(--tone-neutral-bg);
  }

  .merchant-row td {
    padding: 16px 14px;
    vertical-align: middle;
    border-bottom: 1px solid var(--default-border);
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

  .stat-label {
    margin-right: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--tone-muted-text);
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

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  /* 资产子表头（tier 2 header） */
  .asset-subheader td {
    padding: 8px 14px 8px 62px;
    font-size: 10px;
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--tone-neutral-bg);
    border-top: 1px solid var(--default-border);
    border-bottom: 1px solid var(--default-border);
  }

  /* 资产行（tier 2） */
  .asset-row {
    display: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .asset-row.visible {
    display: table-row;
  }

  .asset-row:hover {
    background: var(--tone-neutral-bg);
  }

  .asset-row td {
    padding: 12px 14px 12px 62px;
    vertical-align: middle;
    background: var(--theme-surface, #fff);
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
    font-variant-numeric: tabular-nums;
    color: var(--theme-text, var(--g-900));
  }

  .count-cell {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--tone-muted-text);
  }

  .date-cell {
    font-weight: 500;
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
