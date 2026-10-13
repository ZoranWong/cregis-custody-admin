<!-- Compliance Alerts — 合规告警 -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="mb-5">
      <h1 class="text-hero font-semibold text-g-900">{{ $t('alerts.pageTitle') }}</h1>
      <p class="text-sm text-g-700 mt-1">{{ $t('alerts.pageSubtitle') }}</p>
    </div>

    <!-- ═══ 筛选栏 ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchantEcode"
        :placeholder="$t('alerts.merchant')"
        clearable
        filterable
        class="!w-48"
        @change="handleFilterChange"
      >
        <el-option
          v-for="m in merchants"
          :key="m.code"
          :label="m.merchantName || m.code"
          :value="m.code"
        />
      </el-select>
      <el-select
        v-model="filters.direction"
        :placeholder="$t('alerts.direction')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option :label="$t('alerts.outgoing')" value="OUTGOING" />
        <el-option :label="$t('alerts.incoming')" value="INCOMING" />
      </el-select>
      <el-select
        v-model="filters.decision"
        :placeholder="$t('alerts.decision')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option
          v-for="d in DECISION_DICT"
          :key="d.value"
          :label="$t(d.labelKey)"
          :value="d.value"
        />
      </el-select>
      <el-select
        v-model="filters.dispositionStatus"
        :placeholder="$t('alerts.disposition')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option
          v-for="d in DISPOSITION_STATUS_DICT"
          :key="d.value"
          :label="$t(d.labelKey)"
          :value="d.value"
        />
      </el-select>
      <!-- 条件变更即刷新，无需单独搜索按钮；Reset 清空全部筛选 -->
      <el-button plain @click="resetFilters">{{ $t('common.reset') }}</el-button>
    </div>

    <!-- ═══ 告警卡片列表 ═══ -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <span class="text-g-700 font-medium">{{ $t('alerts.pageTitle') }}</span>
        <el-button text size="small">
          <ArtSvgIcon icon="ri:download-line" class="text-icon-sm mr-1" />{{ $t('common.export') }}
        </el-button>
      </div>

      <div class="p-4">
        <template v-if="loading">
          <el-skeleton :rows="6" animated />
        </template>
        <template v-else>
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="tx-card mb-2.5 last:mb-0 cursor-pointer"
            @click="openAlert(alert)"
            role="button"
            tabindex="0"
            @keydown.enter.prevent="openAlert(alert)"
            @keydown.space.prevent="openAlert(alert)"
          >
            <!-- 顶部：金额 + 订单号 + 标签（对齐 tx-lens 密度） -->
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <ArtSvgIcon
                    :icon="
                      alert.direction === 'INCOMING' ? 'ri:arrow-down-line' : 'ri:arrow-up-line'
                    "
                    :class="
                      alert.direction === 'INCOMING'
                        ? 'text-tone-inbound-text'
                        : 'text-tone-outbound-text'
                    "
                    class="text-icon-md flex-shrink-0"
                  />
                  <span class="text-metric tabular-nums font-semibold text-g-900">{{
                    displayAmount(alert)
                  }}</span>
                  <span class="text-xs text-tone-muted-text">{{ alert.currency }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs mt-0.5">
                  <el-tooltip :content="alert.bizRefId" placement="top">
                    <span class="text-g-700 font-mono truncate max-w-52">{{ alert.bizRefId }}</span>
                  </el-tooltip>
                  <span class="text-tone-muted-text">· {{ formatTime(alert.createTime) }}</span>
                  <span class="text-tone-muted-text">· {{ $t('alerts.merchantName') }}:</span>
                  <span class="text-g-700 truncate">{{ merchantName(alert.merchantEcode) }}</span>
                </div>
              </div>
              <!-- 徽章（对齐原型：方向 → 处置状态 → 严重级别） -->
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <ArtDirectionTag :inbound="alert.direction === 'INCOMING'" />
                <el-tag
                  :type="dispositionTagType(alert.dispositionStatus)"
                  size="small"
                  effect="light"
                >
                  {{ txStateLabel(DISPOSITION_STATUS_DICT, alert.dispositionStatus, t) }}
                </el-tag>
                <el-tag
                  :type="severityTagType(alert.maxSeverity)"
                  v-if="alert.maxSeverity"
                  size="small"
                  effect="light"
                >
                  {{ severityLabelOf(alert.maxSeverity) }}
                </el-tag>
              </div>
            </div>

            <!-- 出入金双方（三行结构，与 tx-lens / travel-rule 一致） -->
            <div class="flex items-stretch gap-2 mb-2">
              <div
                class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
                :class="
                  alert.direction === 'OUTGOING'
                    ? 'bg-[var(--el-color-primary-light-9)]'
                    : 'bg-[var(--tone-neutral-bg)]'
                "
              >
                <div class="text-caption text-g-700 font-medium">
                  {{ partyLabel(alert.direction, 'originator') }}
                </div>
                <div class="text-xs font-semibold text-g-900 truncate">
                  {{ partyName(alert.originator) }}
                </div>
                <div class="text-caption text-g-700 font-mono truncate">
                  {{ alert.originator?.address || '--' }}
                </div>
              </div>
              <div class="flex items-center">
                <ArtSvgIcon
                  icon="ri:arrow-right-long-line"
                  :class="
                    alert.direction === 'INCOMING'
                      ? 'text-tone-inbound-text'
                      : 'text-tone-outbound-text'
                  "
                  class="text-icon-lg"
                />
              </div>
              <div
                class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
                :class="
                  alert.direction === 'OUTGOING'
                    ? 'bg-[var(--tone-neutral-bg)]'
                    : 'bg-[var(--el-color-primary-light-9)]'
                "
              >
                <div class="text-caption text-g-700 font-medium">
                  {{ partyLabel(alert.direction, 'beneficiary') }}
                </div>
                <div class="text-xs font-semibold text-g-900 truncate">
                  {{ partyName(alert.beneficiary) }}
                </div>
                <div class="text-caption text-g-700 font-mono truncate">
                  {{ alert.beneficiary?.address || '--' }}
                </div>
              </div>
            </div>

            <!-- 命中规则 + 结论 + Full Review 同行（对齐原型 footer） -->
            <div
              class="flex items-center justify-between gap-4 pt-3 border-t border-[var(--default-border)]"
            >
              <div class="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                <span class="text-xs text-g-700 flex-shrink-0">{{ $t('alerts.ruleHits') }}:</span>
                <template v-if="alert.ruleHits?.length">
                  <el-tag
                    :type="severityTagType(hit.severity)"
                    v-for="hit in alert.ruleHits"
                    :key="hit.ruleCode"
                    size="small"
                    effect="light"
                  >
                    {{ hit.ruleName }}
                  </el-tag>
                </template>
                <span v-else class="text-sm text-g-700">{{ $t('alerts.noRuleHit') }}</span>
                <span class="text-xs text-g-700 ml-2">{{ $t('alerts.conclusion') }}:</span>
                <span class="text-sm text-g-700 font-medium">{{
                  txStateLabel(CONCLUSION_DICT, alert.conclusion, t)
                }}</span>
              </div>
              <el-button
                size="small"
                type="primary"
                plain
                class="flex-shrink-0"
                @click.stop="openAlert(alert)"
              >
                {{ $t('alerts.fullReview') }} →
              </el-button>
            </div>
          </div>
          <div v-if="alerts.length === 0" class="p-10 text-center text-tone-neutral-text text-body">
            {{ $t('alerts.noResults') }}
          </div>
        </template>
      </div>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex justify-end items-center px-4 py-3 border-t border-[var(--default-border)]"
      >
        <el-pagination
          v-model:current-page="pagination.pageIndex"
          :total="total"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { fetchCoinList } from '@/api/coin'
  import { fetchComplianceAlerts } from '@/api/compliance'
  import { fetchMerchantList } from '@/api/merchant'
  import type { ComplianceAlertItem, TransactionPartyView } from '@/features/compliance/types'
  import {
    CONCLUSION_DICT,
    DECISION_DICT,
    DISPOSITION_STATUS_DICT,
    dispositionTagType,
    txStateLabel
  } from '@/features/compliance/txState'
  import { severityLabel, severityTagType } from '@/features/compliance/dictionaries'
  import { formatCoinBalance, formatTime } from '@/utils/format'

  defineOptions({ name: 'ComplianceAlerts' })

  const router = useRouter()
  const { t } = useI18n()
  const loading = ref(false)
  const total = ref(0)

  const alerts = ref<ComplianceAlertItem[]>([])
  const merchants = ref<Array<{ code: string; merchantName: string }>>([])
  const merchantMap = ref<Record<string, string>>({})
  const coinDecimals = ref<Record<string, number>>({})

  const filters = reactive({
    merchantEcode: '',
    direction: '',
    decision: '',
    dispositionStatus: ''
  })

  const pagination = reactive({
    pageIndex: 1,
    pageSize: 20
  })

  // ─── 展示辅助 ───

  /** 金额按币种精度换算；币种精度未知时回退原始值 */
  function displayAmount(alert: ComplianceAlertItem): string {
    const decimals = coinDecimals.value[alert.currency]
    if (!decimals) return String(alert.amount)
    return formatCoinBalance(String(alert.amount), decimals)
  }

  function merchantName(ecode: string): string {
    return merchantMap.value[ecode] || ecode || '--'
  }

  function severityLabelOf(severity: string): string {
    return severityLabel(severity, t)
  }

  /** 出入金双方：本方（我们的客户）为发起方还是受益方，取决于交易方向 */
  function partyLabel(direction: string, party: 'originator' | 'beneficiary'): string {
    const outgoing = direction === 'OUTGOING'
    if (party === 'originator') {
      return outgoing ? t('alerts.originatorOurCustomer') : t('alerts.originatorCounterparty')
    }
    return outgoing ? t('alerts.beneficiaryCounterparty') : t('alerts.beneficiaryOurCustomer')
  }

  function partyName(party: TransactionPartyView | null): string {
    if (!party) return '--'
    return party.name || party.did || party.address || '--'
  }

  function openAlert(alert: ComplianceAlertItem) {
    router.push({
      name: 'TransactionLensDetail',
      params: { id: alert.bizRefId },
      query: { step: 'compliance' }
    })
  }

  // ─── 数据加载 ───

  /**
   * 商户名回填。接口分页上限 200 且不支持翻页取全量，
   * 超出部分回退展示 ecode（列表本身仍按 ecode 筛选，不影响正确性）。
   */
  async function loadMerchants() {
    try {
      const res = await fetchMerchantList({ pageSize: 200 })
      const records = res.records ?? []
      merchants.value = records
        .filter((r) => r.code)
        .map((r) => ({ code: r.code, merchantName: r.merchantName || r.code }))
      const map: Record<string, string> = {}
      for (const m of merchants.value) map[m.code] = m.merchantName
      merchantMap.value = map
    } catch {
      merchants.value = []
      merchantMap.value = {}
    }
  }

  /** 币种精度用于金额换算；缺失的币种原样展示最小单位 */
  async function loadCoins() {
    try {
      const coins = await fetchCoinList()
      const map: Record<string, number> = {}
      for (const c of coins) map[c.coinId] = c.decimals
      coinDecimals.value = map
    } catch {
      coinDecimals.value = {}
    }
  }

  async function fetchData() {
    loading.value = true
    try {
      const queryList: Array<{ key: string; value: unknown }> = []
      if (filters.merchantEcode)
        queryList.push({ key: 'merchantEcode', value: filters.merchantEcode })
      if (filters.direction) queryList.push({ key: 'direction', value: filters.direction })
      if (filters.decision) queryList.push({ key: 'decision', value: filters.decision })
      if (filters.dispositionStatus)
        queryList.push({ key: 'dispositionStatus', value: filters.dispositionStatus })

      const res = await fetchComplianceAlerts({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        queryList
      })
      alerts.value = res.records ?? []
      total.value = res.total ?? 0
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
      alerts.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleFilterChange() {
    pagination.pageIndex = 1
    fetchData()
  }

  function resetFilters() {
    filters.merchantEcode = ''
    filters.direction = ''
    filters.decision = ''
    filters.dispositionStatus = ''
    handleFilterChange()
  }

  function handleSizeChange() {
    pagination.pageIndex = 1
    fetchData()
  }

  onMounted(() => {
    loadMerchants()
    loadCoins()
    fetchData()
  })
</script>

<style scoped>
  .tx-card {
    padding: 10px 12px;
    border: 1px solid var(--default-border);
    border-radius: 10px;
    transition: border-color 0.2s;
  }

  /* 卡片可点击（role=button + tabindex）后必须提供可见焦点环：
     否则键盘用户无法定位当前选中项。focus-visible 只在键盘导航时出现，鼠标点击不触发 */
  .tx-card:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  .tx-card:focus {
    outline: none;
  }

  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }
</style>
