<!-- Transaction Lens — 交易全景 -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ $t('txLens.pageTitle') }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('txLens.pageSubtitle') }}</p>
      </div>
      <!-- 导出：页面级动作，放在标题栏右侧 -->
      <el-button type="primary" plain class="flex-shrink-0" @click="handleExport">
        <ArtSvgIcon icon="ri:download-line" class="text-icon-sm mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- ═══ 主要筛选栏（卡片区上方） ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchant"
        :placeholder="$t('txLens.merchant')"
        clearable
        class="!w-48"
        @change="handleSearch"
      >
        <el-option v-for="m in merchants" :key="m.ecode" :label="m.name" :value="m.ecode" />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        class="tx-date-range"
        :start-placeholder="$t('txLens.startDate')"
        :end-placeholder="$t('txLens.endDate')"
        @change="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">{{ $t('console.refresh') }}</el-button>
      <!-- 卡片密度切换（refresh 同行最右）：4 列宽松 / 8 列紧凑，选择全局记忆 -->
      <div class="ml-auto flex items-center gap-1.5 flex-shrink-0">
        <el-tooltip :content="$t('txLens.densityCozy')" placement="top">
          <button
            type="button"
            class="density-btn"
            :class="{ 'is-active': cardLayout.density === 4 }"
            @click="cardLayout.setDensity(4)"
          >
            <ArtSvgIcon icon="ri:layout-grid-line" class="text-icon-md" />
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('txLens.densityDense')" placement="top">
          <button
            type="button"
            class="density-btn"
            :class="{ 'is-active': cardLayout.density === 8 }"
            @click="cardLayout.setDensity(8)"
          >
            <ArtSvgIcon icon="ri:layout-masonry-line" class="text-icon-md" />
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- ═══ 卡片区：摘要卡 + 审查结果卡共 8 张放同一个 grid，自动流排列 ——
         4 列档两行（摘要一行 + 审查结果一行），8 列档单行。纯展示，不可点击 ═══ -->
    <div
      class="summary-grid"
      :class="cardLayout.density === 8 ? 'summary-grid--dense' : 'summary-grid--cozy'"
    >
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="art-card px-4 py-2.5 flex flex-col justify-center"
      >
        <span class="text-g-700 text-xs">{{ $t(card.labelKey) }}</span>
        <span class="text-hero font-semibold mt-0.5 tabular-nums" :class="card.valueClass">{{
          card.value
        }}</span>
      </div>
      <div
        v-for="card in reviewCards"
        :key="card.key"
        class="art-card px-4 py-2.5 flex flex-col justify-center"
      >
        <span class="text-g-700 text-xs">{{ $t(card.labelKey) }}</span>
        <span class="text-hero font-semibold mt-0.5 tabular-nums" :class="card.valueClass">{{
          card.value
        }}</span>
      </div>
    </div>

    <!-- ═══ 交易卡片列表 ═══ -->
    <div class="art-card mb-4">
      <!--
        筛选栏。
        用「分组标签 + 分段按钮」而非下拉框 —— 对齐原型 compliance-tx-lens.html 的
        .filter-bar / .filter-btn（每组带 All 重置项）。
        下拉框的问题：7 个选项默认收起，用户看不到有哪些可选项，且必须点开才能选。
        分段按钮一次铺开全部选项，一眼可见、单击即生效。
      -->
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
          <!-- 分组由 script 的 FILTER_GROUPS 驱动，避免 7 组重复模板 -->
          <div v-for="g in FILTER_GROUPS" :key="g.key" class="flex items-center gap-2 min-w-0">
            <span class="text-body font-medium text-g-700 whitespace-nowrap">{{
              $t(g.labelKey)
            }}</span>
            <div class="flex items-center gap-1">
              <!-- All：清空该组筛选 -->
              <button
                type="button"
                class="filter-btn"
                :class="{ 'is-active': !filters[g.key] }"
                @click="setFilter(g.key, '')"
              >
                {{ $t('common.all') }}
              </button>
              <button
                v-for="opt in g.options"
                :key="opt.value"
                type="button"
                class="filter-btn"
                :class="{ 'is-active': filters[g.key] === opt.value }"
                @click="setFilter(g.key, opt.value)"
              >
                {{ $t(opt.labelKey) }}
              </button>
            </div>
          </div>
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
                        ? 'text-tone-outbound-text'
                        : 'text-tone-inbound-text'
                    "
                    class="text-icon-md flex-shrink-0"
                  />
                  <span class="text-metric tabular-nums font-semibold text-g-900">{{
                    tx.amountDisplay
                  }}</span>
                  <span class="text-xs text-tone-muted-text">{{ tx.fiatDisplay }}</span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-g-700 truncate">{{ tx.orderId }}</span>
                  <span class="text-xs text-tone-muted-text">· {{ tx.createTime }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <!-- 方向是方位语义，不是风险语义：入金=绿 / 出金=蓝，
                     走 ArtDirectionTag 以保证与其它页面的方向标签完全同款 -->
                <ArtDirectionTag :inbound="tx.direction !== 'outgoing'" />
                <!-- 复核结果四色：走 reviewResultStyle，与摘要卡/详情选择器同源，
                     避免 FN 在三处出现三种颜色 -->
                <span
                  v-if="tx.reviewResult && tx.reviewResult !== 'none'"
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-label font-semibold"
                  :style="reviewResultStyle(tx.reviewResult)"
                  >{{ reviewResultLabel(tx.reviewResult) }}</span
                >
              </div>
            </div>

            <!-- parties 两侧 -->
            <div class="flex items-stretch gap-2 mb-2">
              <div
                class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
                :class="
                  tx.direction === 'outgoing'
                    ? 'bg-[var(--el-color-primary-light-9)]'
                    : 'bg-[var(--tone-neutral-bg)]'
                "
              >
                <div class="text-caption text-g-700 font-medium">{{
                  partyLabel(tx.direction, 'originator')
                }}</div>
                <div class="text-xs font-semibold text-g-900 truncate">{{ tx.originatorName }}</div>
                <div class="text-caption text-g-700 font-mono truncate">{{
                  tx.originator.address || '--'
                }}</div>
              </div>
              <div class="flex items-center">
                <ArtSvgIcon
                  icon="ri:arrow-right-long-line"
                  :class="
                    tx.direction === 'outgoing'
                      ? 'text-tone-outbound-text'
                      : 'text-tone-inbound-text'
                  "
                  class="text-icon-lg"
                />
              </div>
              <div
                class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
                :class="
                  tx.direction === 'outgoing'
                    ? 'bg-[var(--tone-neutral-bg)]'
                    : 'bg-[var(--el-color-primary-light-9)]'
                "
              >
                <div class="text-caption text-g-700 font-medium">{{
                  partyLabel(tx.direction, 'beneficiary')
                }}</div>
                <div class="text-xs font-semibold text-g-900 truncate">{{
                  tx.beneficiaryName
                }}</div>
                <div class="text-caption text-g-700 font-mono truncate">{{
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
            class="p-10 text-center text-tone-neutral-text text-body"
            >{{ $t('txLens.noResults') }}</div
          >
        </template>
      </div>

      <!-- 分页 -->
      <div
        v-if="pagination.total > 0"
        class="flex justify-end items-center px-4 py-3 border-t border-[var(--default-border)]"
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
  import { ElMessage } from 'element-plus'
  import {
    fetchTransactionLensList,
    fetchTransactionLensSummary,
    fetchTravelRuleCoinRates
  } from '@/api/compliance'
  import { fetchCoinList } from '@/api/coin'
  import { fetchMerchantList } from '@/api/merchant'
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
    reviewResultStyle,
    toneDotStyle,
    toneOf,
    toneTextStyle,
    txStateLabel,
    type Tone
  } from '@/features/compliance/txState'
  import {
    STAGE_LABEL_KEYS,
    buildStages,
    currentStage,
    isStageDisabled,
    stageStateOf,
    type StageKey
  } from '@/features/compliance/txStages'
  import { formatCoinBalance, formatTime } from '@/utils/format'
  import { useCardLayoutStore } from '@/store/modules/cardLayout'
  import BigNumber from 'bignumber.js'

  defineOptions({ name: 'TransactionLens' })

  const router = useRouter()
  const { t } = useI18n()
  // 卡片密度（4/8 列）：pinia persist，全局记忆
  const cardLayout = useCardLayoutStore()

  // ─── State ───
  const loading = ref(false)
  const transactions = ref<TransactionLensItemView[]>([])
  const summary = ref<TransactionLensSummaryView | null>(null)
  const coinDecimals = ref<Record<string, number>>({})
  const coinUsdRate = ref<Record<string, number>>({})

  const filters = reactive({
    merchant: '',
    dateRange: [] as string[],
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

  // ─── 商户下拉：走接口（ecode 作为查询值，名称仅展示）───
  const merchants = ref<Array<{ ecode: string; name: string }>>([])

  async function loadMerchants() {
    try {
      const res = await fetchMerchantList({ pageSize: 200 })
      const map = new Map<string, string>()
      for (const m of res.records ?? []) {
        if (m.code) map.set(m.code, m.merchantName || m.code)
      }
      merchants.value = [...map.entries()].map(([ecode, name]) => ({ ecode, name }))
    } catch {
      merchants.value = []
    }
  }

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
        valueClass: 'text-tone-inbound-text'
      },
      {
        key: 'rejected',
        labelKey: 'txLens.rejected',
        value: op?.rejected ?? 0,
        valueClass: 'text-tone-error-text'
      },
      {
        key: 'pending',
        labelKey: 'txLens.pendingReview',
        value: op?.pendingReview ?? 0,
        valueClass: 'text-tone-progress-text'
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
        valueClass: 'text-tone-inbound-text'
      },
      {
        key: 'tn',
        labelKey: 'txLens.trueNegative',
        value: rr?.trueNegative ?? 0,
        valueClass: 'text-tone-neutral-text'
      },
      {
        key: 'fp',
        labelKey: 'txLens.falsePositive',
        value: rr?.falsePositive ?? 0,
        valueClass: 'text-tone-progress-text'
      },
      {
        key: 'fn',
        labelKey: 'txLens.falseNegative',
        value: rr?.falseNegative ?? 0,
        // FN 用独立紫色相：红已被 flagged/rejected 占用，且须与卡片徽章一致
        valueClass: 'text-tone-purple-text'
      }
    ]
  })

  // ─── 枚举 → i18n 标签（统一走 features/compliance/txState）───
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

  /** date-picker 的 Date → "YYYY-MM-DD" 查询参数 */
  function toDateParam(v: unknown): string | undefined {
    if (!v) return undefined
    const d = v instanceof Date ? v : new Date(String(v))
    if (Number.isNaN(d.getTime())) return undefined
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  /** 当前筛选条件（统计与列表共用，保证口径一致） */
  function buildQueryParams() {
    return {
      direction: filters.direction || undefined,
      compliance: filters.compliance || undefined,
      travelRule: filters.travelRule || undefined,
      signoff: filters.signOff || undefined,
      onchain: filters.onChain || undefined,
      outcome: filters.fundDisposition || undefined,
      reviewResult: filters.reviewResult || undefined,
      merchantEcode: filters.merchant || undefined,
      dateFrom: toDateParam(filters.dateRange?.[0]),
      dateTo: toDateParam(filters.dateRange?.[1])
    }
  }

  async function loadSummary() {
    try {
      summary.value = await fetchTransactionLensSummary(buildQueryParams())
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
        ...buildQueryParams()
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

  /** 顶部筛选变化：重置页码，同时刷新统计数据与交易列表 */
  /**
   * 次要筛选的分组定义。
   *
   * 原先是 7 个独立的 el-select —— 选项默认收起、必须点开才看得到有哪些可选，
   * 与原型 compliance-tx-lens.html 的 .filter-bar / .filter-btn 不一致。
   * 这里改成数据驱动的分段按钮：每组一个标签 + 若干选项 + 一个 All。
   */
  const FILTER_GROUPS = [
    {
      key: 'direction' as const,
      labelKey: 'txLens.direction',
      options: [
        { value: 'outgoing', labelKey: 'txLens.outgoing' },
        { value: 'incoming', labelKey: 'txLens.incoming' }
      ]
    },
    {
      key: 'compliance' as const,
      labelKey: 'txLens.compliance',
      options: [
        { value: 'clear', labelKey: 'txLens.clear' },
        { value: 'flagged', labelKey: 'txLens.flagged' },
        { value: 'review', labelKey: 'txLens.inReview' }
      ]
    },
    {
      key: 'travelRule' as const,
      labelKey: 'txLens.travelRule',
      options: [
        { value: 'complete', labelKey: 'txLens.trComplete' },
        { value: 'pending', labelKey: 'txLens.trPending' },
        { value: 'mismatch', labelKey: 'txLens.trMismatch' },
        { value: 'na', labelKey: 'txLens.trNa' }
      ]
    },
    {
      key: 'signOff' as const,
      labelKey: 'txLens.signOff',
      options: [
        { value: 'approved', labelKey: 'txLens.soApproved' },
        { value: 'rejected', labelKey: 'txLens.soRejected' },
        { value: 'pending', labelKey: 'txLens.soPending' },
        { value: 'na', labelKey: 'txLens.trNa' }
      ]
    },
    {
      key: 'onChain' as const,
      labelKey: 'txLens.onChain',
      options: [
        { value: 'broadcasted', labelKey: 'txLens.broadcasted' },
        { value: 'confirmed', labelKey: 'txLens.confirmed' },
        { value: 'settled', labelKey: 'txLens.settled' },
        { value: 'failed', labelKey: 'txLens.failed' }
      ]
    },
    {
      key: 'fundDisposition' as const,
      labelKey: 'txLens.fundDisposition',
      options: [
        { value: 'released', labelKey: 'txLens.fdReleased' },
        { value: 'held', labelKey: 'txLens.fdHeld' },
        { value: 'forfeited', labelKey: 'txLens.fdForfeited' },
        { value: 'na', labelKey: 'txLens.trNa' }
      ]
    },
    {
      key: 'reviewResult' as const,
      labelKey: 'txLens.reviewResult',
      options: [
        { value: 'none', labelKey: 'txLens.rrNone' },
        { value: 'tp', labelKey: 'txLens.truePositive' },
        { value: 'fp', labelKey: 'txLens.falsePositive' },
        { value: 'fn', labelKey: 'txLens.falseNegative' }
      ]
    }
  ]

  /** 设置某项筛选并立即查询（替代原先的下拉框 @change） */
  function setFilter(key: (typeof FILTER_GROUPS)[number]['key'], value: string) {
    filters[key] = value
    handleSearch()
  }

  function handleExport() {
    // TODO: 后端导出接口就绪后替换为真实调用
    ElMessage.info(t('common.export'))
  }

  function handleSearch() {
    pagination.pageNum = 1
    loadSummary()
    loadList()
  }

  function handleSizeChange() {
    pagination.pageNum = 1
    loadList()
  }

  /** 进入详情：默认定位到「当前进行到」的阶段（全部完成则停在最后一步） */
  function inspect(orderId: string) {
    const tx = transactions.value.find((t) => t.orderId === orderId)
    const step = tx ? currentStage(tx) : null
    router.push({
      name: 'TransactionLensDetail',
      params: { id: orderId },
      query: step ? { step } : undefined
    })
  }

  onMounted(() => {
    loadCoinMeta()
    loadMerchants()
    loadSummary()
    loadList()
  })
</script>

<style scoped>
  /*
   * 日期范围选择器宽度。
   *
   * EP 给 .el-range-editor 设了 flex: 1 1 auto —— 它作为 flex 子项会被拉伸，
   * 因此 Tailwind 的 !w-* 与 --el-date-editor-width 都压不住（实测仍 915px）。
   * 必须同时固定 width 与 flex，并用 :deep 穿透 scoped。
   */
  :deep(.tx-date-range.el-range-editor) {
    flex: none;
    width: 520px;
  }

  /*
   * 摘要卡片区网格。
   * 密度两档（--cozy 默认 4 列 / --dense 8 列），列间距 12px 与行间距 mb-3 对齐；
   * 卡片高度不固定 —— 由内容（label + 数值）与 py-2.5 决定，长文案换行时卡片自然撑高。
   * 窄屏（<768px）回落 2 列，避免 4 列下文字挤压成竖排。
   */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  @media (width >= 768px) {
    .summary-grid--cozy {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .summary-grid--dense {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }
  }

  /*
   * 密度切换按钮：方形图标按钮，高度与同行 el-button 一致
   * （--el-component-size = 36px），选中态同 .is-active（主色系），未选中灰。
   */
  .density-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--el-component-size);
    height: var(--el-component-size);
    padding: 0;
    color: var(--tone-muted-text);
    cursor: pointer;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 5px;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .density-btn:hover {
    background: var(--art-hover-color);
    border-color: var(--art-gray-400);
  }

  .density-btn.is-active {
    color: var(--theme-text);
    background: var(--tone-info-bg);
    border-color: var(--theme-border);
  }

  .density-btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  /*
   * 分段筛选按钮。
   * 规格取自原型 compliance-tx-lens.html 的 .filter-btn：
   *   padding 4px 10px · radius 5px · font-size 11px · weight 500
   * 选中态用主色系（原型的 accent-50/300/700 → 这里用主题色变量，随明暗模式切换）。
   */
  .filter-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--tone-muted-text);
    cursor: pointer;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 5px;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .filter-btn:hover {
    background: var(--art-hover-color);
    border-color: var(--art-gray-400);
  }

  .filter-btn.is-active {
    color: var(--theme-text);
    background: var(--tone-info-bg);
    border-color: var(--theme-border);
  }

  .filter-btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

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
    font-size: var(--font-size-caption);
    font-weight: 600;
    line-height: 1;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .lc-stage-state {
    font-size: var(--font-size-label);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
