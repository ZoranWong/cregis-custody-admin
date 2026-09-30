<!-- Transaction Lens — 交易全景 -->
<template>
  <div class="page-content">
    <!-- ═══ 主要筛选栏（卡片区上方） ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchant"
        :placeholder="$t('txLens.merchant')"
        clearable
        class="!w-48"
      >
        <el-option v-for="m in merchants" :key="m" :label="m" :value="m" />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        :start-placeholder="$t('txLens.startDate')"
        :end-placeholder="$t('txLens.endDate')"
        class="!w-64"
        @change="loadList"
      />
      <el-input
        v-model="filters.keyword"
        :placeholder="$t('txLens.searchPlaceholder')"
        clearable
        class="!w-64"
        @keyup.enter="loadList"
        @clear="loadList"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
      <el-button type="primary" @click="loadList">{{ $t('console.refresh') }}</el-button>
    </div>

    <!-- ═══ 摘要卡片（可点击筛选：all ↔ 各状态，切换时独立发请求）═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in summaryCards" :key="card.key">
        <div
          class="art-card h-20 px-4 mb-3 flex flex-col justify-center summary-filter-card"
          :class="{ active: activeSummaryFilter === card.key }"
          @click="toggleSummaryFilter(card.key)"
        >
          <span class="text-g-700 text-xs">{{ $t(card.labelKey) }}</span>
          <span class="text-xl font-medium mt-0.5" :class="card.valueClass">{{ card.value }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 审查结果卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in reviewCards" :key="card.key">
        <div class="art-card h-20 px-4 mb-3 flex flex-col justify-center">
          <span class="text-g-700 text-xs">{{ $t(card.labelKey) }}</span>
          <span class="text-lg font-medium mt-0.5" :class="card.valueClass">{{ card.value }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 交易卡片列表 ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <span class="text-g-900 font-medium">{{ $t('txLens.transactions') }}</span>
        <el-button text size="small">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
        </el-button>
      </div>
      <!-- 次要筛选栏（7组筛选） -->
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-4">
          <el-select
            v-model="filters.direction"
            :placeholder="$t('txLens.direction')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.outgoing')" value="outgoing" />
            <el-option :label="$t('txLens.incoming')" value="incoming" />
          </el-select>
          <el-select
            v-model="filters.compliance"
            :placeholder="$t('txLens.compliance')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.clear')" value="clear" />
            <el-option :label="$t('txLens.flagged')" value="flagged" />
            <el-option :label="$t('txLens.inReview')" value="review" />
          </el-select>
          <el-select
            v-model="filters.travelRule"
            :placeholder="$t('txLens.travelRule')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.trComplete')" value="complete" />
            <el-option :label="$t('txLens.trPending')" value="pending" />
            <el-option :label="$t('txLens.trMismatch')" value="mismatch" />
            <el-option :label="$t('txLens.trNa')" value="na" />
          </el-select>
          <el-select
            v-model="filters.signOff"
            :placeholder="$t('txLens.signOff')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.soApproved')" value="approved" />
            <el-option :label="$t('txLens.soRejected')" value="rejected" />
            <el-option :label="$t('txLens.soPending')" value="pending" />
            <el-option :label="$t('txLens.trNa')" value="na" />
          </el-select>
          <el-select
            v-model="filters.onChain"
            :placeholder="$t('txLens.onChain')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.broadcasted')" value="broadcasted" />
            <el-option :label="$t('txLens.confirmed')" value="confirmed" />
            <el-option :label="$t('txLens.settled')" value="settled" />
            <el-option :label="$t('txLens.failed')" value="failed" />
          </el-select>
          <el-select
            v-model="filters.fundDisposition"
            :placeholder="$t('txLens.fundDisposition')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.fdReleased')" value="released" />
            <el-option :label="$t('txLens.fdHeld')" value="held" />
            <el-option :label="$t('txLens.fdForfeited')" value="forfeited" />
            <el-option :label="$t('txLens.trNa')" value="na" />
          </el-select>
          <el-select
            v-model="filters.reviewResult"
            :placeholder="$t('txLens.reviewResult')"
            clearable
            class="!w-36"
            @change="loadList"
          >
            <el-option :label="$t('txLens.rrNone')" value="none" />
            <el-option :label="$t('txLens.truePositive')" value="tp" />
            <el-option :label="$t('txLens.falsePositive')" value="fp" />
            <el-option :label="$t('txLens.falseNegative')" value="fn" />
          </el-select>
        </div>
      </div>
      <div class="p-4">
        <template v-if="loading">
          <el-skeleton :rows="6" animated />
        </template>
        <template v-else>
          <div v-for="tx in displayTransactions" :key="tx.orderId" class="tx-card mb-2.5 last:mb-0">
            <!-- 顶部：金额 + 方向 + 结果 -->
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <ArtSvgIcon
                    :icon="tx.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
                    :class="
                      tx.direction === 'outgoing'
                        ? 'text-[var(--el-color-primary)]'
                        : 'text-[var(--el-color-success)]'
                    "
                    class="text-base flex-shrink-0"
                  />
                  <span class="text-base font-semibold text-g-900">{{ tx.amountDisplay }}</span>
                  <span class="text-xs text-g-400">{{ tx.fiatDisplay }}</span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-g-500 truncate">{{ tx.orderId }}</span>
                  <span class="text-xs text-g-400">· {{ tx.createTime }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <el-tag :type="tx.direction === 'outgoing' ? 'warning' : 'success'" size="small">{{
                  directionLabel(tx.direction)
                }}</el-tag>
                <el-tag
                  v-if="tx.reviewResult !== 'none'"
                  :type="reviewTag(tx.reviewResult)"
                  size="small"
                  effect="light"
                  >{{ reviewResultLabel(tx.reviewResult) }}</el-tag
                >
              </div>
            </div>

            <!-- parties 两侧 -->
            <div class="flex items-stretch gap-2 mb-2">
              <div
                class="flex-1 min-w-0 rounded-md px-2.5 py-1.5"
                :class="
                  tx.direction === 'outgoing'
                    ? 'bg-[var(--el-color-primary-light-9)]'
                    : 'bg-[var(--el-color-success-light-9)]'
                "
              >
                <div class="text-[10px] text-g-500 font-medium">{{
                  partyLabel(tx.direction, 'originator')
                }}</div>
                <div class="text-xs font-semibold text-g-900 truncate">{{ tx.originatorName }}</div>
                <div class="text-[10px] text-g-600 font-mono truncate">{{
                  tx.originator.address || '--'
                }}</div>
              </div>
              <div class="flex items-center">
                <ArtSvgIcon
                  icon="ri:arrow-right-long-line"
                  :class="
                    tx.direction === 'outgoing'
                      ? 'text-[var(--el-color-primary)]'
                      : 'text-[var(--el-color-success)]'
                  "
                  class="text-lg"
                />
              </div>
              <div
                class="flex-1 min-w-0 rounded-md px-2.5 py-1.5"
                :class="
                  tx.direction === 'outgoing'
                    ? 'bg-[var(--el-color-success-light-9)]'
                    : 'bg-[var(--el-color-primary-light-9)]'
                "
              >
                <div class="text-[10px] text-g-500 font-medium">{{
                  partyLabel(tx.direction, 'beneficiary')
                }}</div>
                <div class="text-xs font-semibold text-g-900 truncate">{{
                  tx.beneficiaryName
                }}</div>
                <div class="text-[10px] text-g-600 font-mono truncate">{{
                  tx.beneficiary.address || '--'
                }}</div>
              </div>
            </div>

            <!-- 生命周期阶段条 + Inspect 操作同行 -->
            <div class="flex items-center gap-3">
              <div class="lc-stages flex-1 min-w-0">
                <template v-for="(stage, i) in tx.stages" :key="stage.key">
                  <div v-if="i > 0" class="lc-sep"></div>
                  <div class="lc-stage">
                    <div class="lc-stage-dot" :style="toneDotStyle(stage.tone)"></div>
                    <div class="lc-stage-content">
                      <div class="lc-stage-label">{{ $t(stage.labelKey) }}</div>
                      <div class="lc-stage-state" :style="toneTextStyle(stage.tone)">
                        {{ stage.value }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <el-button
                size="small"
                plain
                type="primary"
                class="flex-shrink-0"
                @click="inspect(tx.orderId)"
                >{{ $t('txLens.inspect') }} →</el-button
              >
            </div>
          </div>
          <div
            v-if="displayTransactions.length === 0"
            class="py-10 text-center text-g-400 text-sm"
            >{{ $t('txLens.noResults') }}</div
          >
        </template>
      </div>

      <!-- 分页 -->
      <div
        v-if="pagination.total > 0"
        class="flex justify-end items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <el-pagination
          v-model:current-page="pagination.pageNum"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import {
    fetchTransactionLensList,
    fetchTransactionLensSummary,
    fetchTravelRuleCoinRates
  } from '@/api/compliance'
  import { fetchCoinList } from '@/api/coin'
  import type {
    TransactionLensItemView,
    TransactionLensSummaryView
  } from '@/features/compliance/types'
  import {
    COMPLIANCE_DICT,
    DISPOSITION_DICT,
    ONCHAIN_DICT,
    REVIEW_RESULT_DICT,
    SIGNOFF_DICT,
    TRAVEL_RULE_DICT,
    reviewResultTagType,
    toneDotStyle,
    toneOf,
    toneTextStyle,
    txStateLabel,
    type TagType,
    type Tone
  } from '@/features/compliance/txState'
  import {
    STAGE_LABEL_KEYS,
    buildStages,
    isStageDisabled,
    stageStateOf,
    type StageKey
  } from '@/features/compliance/txStages'
  import { formatCoinBalance, formatTime } from '@/utils/format'
  import BigNumber from 'bignumber.js'

  defineOptions({ name: 'TransactionLens' })

  const router = useRouter()
  const { t } = useI18n()

  // ─── State ───
  const loading = ref(false)
  const transactions = ref<TransactionLensItemView[]>([])
  const summary = ref<TransactionLensSummaryView | null>(null)
  const coinDecimals = ref<Record<string, number>>({})
  const coinUsdRate = ref<Record<string, number>>({})

  const filters = reactive({
    merchant: '',
    dateRange: [] as string[],
    keyword: '',
    direction: '',
    compliance: '',
    travelRule: '',
    signOff: '',
    onChain: '',
    fundDisposition: '',
    reviewResult: ''
  })

  const pagination = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })

  // ─── 摘要卡片点击筛选（all ↔ pending 等，每次切换独立发请求）───
  const activeSummaryFilter = ref<'all' | 'pending' | string>('all')

  /** 卡片 key → 列表查询条件（pending = 合规审查中） */
  const SUMMARY_FILTER_QUERIES: Record<string, Record<string, string>> = {
    pending: { compliance: 'review' }
  }

  function toggleSummaryFilter(key: string) {
    // 再点一次取消筛选；切换时重置页码并单独发请求
    activeSummaryFilter.value = activeSummaryFilter.value === key ? 'all' : key
    applySummaryFilter()
    pagination.pageNum = 1
    loadList()
  }

  function applySummaryFilter() {
    const query = SUMMARY_FILTER_QUERIES[activeSummaryFilter.value]
    if (query) {
      Object.assign(filters, query)
    } else {
      // all：清掉卡片引入的筛选条件（不影响用户手动设置的其他筛选）
      for (const k of Object.keys(SUMMARY_FILTER_QUERIES.pending || {})) {
        ;(filters as Record<string, unknown>)[k] = ''
      }
    }
  }

  const merchants = ['CryptoVault', 'PayFlow', 'ChainBridge', 'TokenGuard', 'BlockSafe']

  // ─── 摘要卡片（细分数据接口暂未提供，只显示主数值）───
  const summaryCards = computed(() => {
    const op = summary.value?.operational
    return [
      {
        key: 'total',
        labelKey: 'txLens.totalTransactions',
        value: op?.totalTransactions ?? 0,
        valueClass: 'text-g-900'
      },
      {
        key: 'settled',
        labelKey: 'txLens.settled',
        value: op?.settled ?? 0,
        valueClass: 'text-success'
      },
      {
        key: 'rejected',
        labelKey: 'txLens.rejected',
        value: op?.rejected ?? 0,
        valueClass: 'text-[var(--el-color-danger)]'
      },
      {
        key: 'pending',
        labelKey: 'txLens.pendingReview',
        value: op?.pendingReview ?? 0,
        valueClass: 'text-[var(--el-color-warning)]'
      }
    ]
  })

  const reviewCards = computed(() => {
    const rr = summary.value?.reviewResult
    return [
      {
        key: 'tp',
        labelKey: 'txLens.truePositive',
        value: rr?.truePositive ?? 0,
        valueClass: 'text-success'
      },
      {
        key: 'tn',
        labelKey: 'txLens.trueNegative',
        value: rr?.trueNegative ?? 0,
        valueClass: 'text-success'
      },
      {
        key: 'fp',
        labelKey: 'txLens.falsePositive',
        value: rr?.falsePositive ?? 0,
        valueClass: 'text-warning'
      },
      {
        key: 'fn',
        labelKey: 'txLens.falseNegative',
        value: rr?.falseNegative ?? 0,
        valueClass: 'text-purple-600'
      }
    ]
  })

  // ─── 枚举 → i18n 标签（统一走 features/compliance/txState）───
  function directionLabel(v: string): string {
    return v === 'outgoing'
      ? t('txLens.outgoing')
      : v === 'incoming'
        ? t('txLens.incoming')
        : v || '--'
  }
  function complianceLabel(v: string): string {
    return txStateLabel(COMPLIANCE_DICT, v, t)
  }
  function travelRuleLabel(v: string): string {
    return txStateLabel(TRAVEL_RULE_DICT, v, t)
  }
  function signoffLabel(v: string): string {
    return txStateLabel(SIGNOFF_DICT, v, t)
  }
  function onchainLabel(v: string): string {
    return txStateLabel(ONCHAIN_DICT, v, t)
  }
  function dispositionLabel(v: string): string {
    return txStateLabel(DISPOSITION_DICT, v, t)
  }
  function reviewResultLabel(v: string): string {
    return txStateLabel(REVIEW_RESULT_DICT, v, t)
  }

  // ─── 展示对象 ───
  interface Stage {
    key: StageKey
    labelKey: string
    value: string
    tone: Tone
    /** 不可点击（状态 N/A） */
    disabled?: boolean
  }

  const displayTransactions = computed(() => {
    return transactions.value.map((tx) => {
      const decimals = coinDecimals.value[tx.coinId]
      const amount = decimals ? formatCoinBalance(tx.amount, decimals) : tx.amount
      const usdRate = coinUsdRate.value[tx.coinId]
      const fiat = usdRate != null && decimals ? new BigNumber(amount).times(usdRate) : null
      const fiatDisplay = fiat != null ? `≈ $${fiat.toFormat(2, BigNumber.ROUND_HALF_UP)}` : '--'

      // 状态取值统一走 stageStateOf：无 Travel Rule 信息时 travelRule 按 na 处理
      const stages: Stage[] = buildStages(tx).map((key) => {
        const rawState = stageStateOf(tx, key)
        const labelMap: Record<StageKey, (v: string) => string> = {
          compliance: complianceLabel,
          travelRule: travelRuleLabel,
          signoff: signoffLabel,
          onchain: onchainLabel,
          disposition: dispositionLabel
        }
        return {
          key,
          labelKey: STAGE_LABEL_KEYS[key],
          value: labelMap[key](rawState || ''),
          tone: toneOf(rawState),
          disabled: isStageDisabled(tx, key)
        }
      })

      return {
        ...tx,
        amountDisplay: `${amount} ${tx.coinId}`,
        fiatDisplay,
        createTime: formatTime(tx.createTime),
        originatorName: tx.originator?.name
          ? tx.originator.name
          : tx.originator?.did
            ? t('txLens.unknownVasp')
            : t('txLens.unknownCustomer'),
        beneficiaryName: tx.beneficiary?.name
          ? tx.beneficiary.name
          : tx.beneficiary?.did
            ? t('txLens.unknownVasp')
            : t('txLens.unknownCustomer'),
        stages
      }
    })
  })

  function reviewTag(result: string): TagType {
    return reviewResultTagType(result)
  }

  function partyLabel(direction: string, party: 'originator' | 'beneficiary'): string {
    if (direction === 'outgoing') {
      return party === 'originator' ? 'Originator (Our Customer)' : 'Beneficiary (Counterparty)'
    } else {
      return party === 'originator' ? 'Originator (Counterparty)' : 'Beneficiary (Our Customer)'
    }
  }

  // ─── 数据加载 ───
  async function loadCoinMeta() {
    try {
      const coins = await fetchCoinList()
      const decimals: Record<string, number> = {}
      for (const c of coins) decimals[c.coinId] = c.decimals
      coinDecimals.value = decimals
    } catch {
      coinDecimals.value = {}
    }
    try {
      const rates = await fetchTravelRuleCoinRates()
      const rateMap: Record<string, number> = {}
      for (const r of rates) rateMap[r.coinId] = r.usdRate
      coinUsdRate.value = rateMap
    } catch {
      coinUsdRate.value = {}
    }
  }

  async function loadSummary() {
    try {
      summary.value = await fetchTransactionLensSummary()
    } catch {
      summary.value = null
    }
  }

  async function loadList() {
    loading.value = true
    try {
      const result = await fetchTransactionLensList({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        direction: filters.direction || undefined,
        compliance: filters.compliance || undefined,
        travelRule: filters.travelRule || undefined,
        signoff: filters.signOff || undefined,
        onchain: filters.onChain || undefined,
        outcome: filters.fundDisposition || undefined,
        keyword: filters.keyword || undefined
      })
      transactions.value = result.records || []
      pagination.total = result.total || 0
    } catch {
      transactions.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  function handleSizeChange() {
    pagination.pageNum = 1
    loadList()
  }

  function inspect(orderId: string) {
    router.push({ name: 'TransactionLensDetail', params: { id: orderId } })
  }

  onMounted(() => {
    loadCoinMeta()
    loadSummary()
    loadList()
  })
</script>

<style scoped>
  .tx-card {
    padding: 10px 12px;
    border: 1px solid var(--default-border);
    border-radius: 10px;
    transition: border-color 0.2s;
  }

  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }

  /* 摘要卡片点击筛选：可点击反馈 + 激活态 */
  .summary-filter-card {
    cursor: pointer;
    transition: all 0.2s;
  }

  .summary-filter-card:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  }

  .summary-filter-card.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  /* 阶段条：横向排布，圆点 + 标签/状态两行；阶段数随场景变化，自适应 */
  .lc-stages {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 5px 8px;
    background: var(--art-gray-100);
    border-radius: 6px;
  }

  .lc-stage {
    display: flex;
    flex: 1;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .lc-stage-dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  /* 圆点与状态文字颜色由 toneDotStyle / toneTextStyle 内联注入 */

  .lc-stage-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .lc-sep {
    flex-shrink: 0;
    width: 1px;
    height: 20px;
    background: var(--default-border);
  }

  .lc-stage-label {
    font-size: 9px;
    font-weight: 600;
    line-height: 1;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .lc-stage-state {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
