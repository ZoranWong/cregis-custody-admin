<!-- Transaction Lens Detail — 交易检查详情（步骤化） -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ $t('txLens.detail.title') }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('txLens.detail.subtitle') }}</p>
      </div>
      <ArtBackButton history />
    </div>
    <!-- Loading / Error -->
    <div v-if="loading" class="art-card p-10 text-center">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="errorMessage" class="art-card p-10 text-center">
      <p class="text-tone-error-text mb-4">{{ errorMessage }}</p>
      <el-button type="primary" @click="loadDetail">{{ $t('console.refresh') }}</el-button>
    </div>

    <template v-else-if="overview">
      <!-- ═══ Transaction Header Card ═══ -->
      <div class="art-card mb-4 p-4">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-start gap-3">
            <ArtSvgIcon
              :icon="isOutgoing ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
              :class="isOutgoing ? 'text-tone-outbound-text' : 'text-tone-inbound-text'"
              class="text-icon-xl mt-0.5"
            />
            <div>
              <div class="text-hero tabular-nums font-semibold text-g-900">{{ amountDisplay }}</div>
              <div class="text-xs text-g-700 font-medium">{{ fiatDisplay }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center justify-end gap-1 mb-1">
              <ArtDirectionTag :inbound="!isOutgoing" />
            </div>
            <div class="text-xs font-semibold text-g-700 font-mono">{{ overview.orderId }}</div>
            <div class="text-caption text-g-700 mt-1">{{ createTime }}</div>
          </div>
        </div>
        <!-- Parties -->
        <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div class="originator-box rounded-lg p-3">
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-1">
              {{ originatorLabelText }}
            </div>
            <div class="text-sm font-semibold text-g-900">
              {{
                overview.originator?.name ||
                (overview.originator?.did ? $t('txLens.unknownVasp') : $t('txLens.unknownCustomer'))
              }}
            </div>
            <div class="text-xs text-g-700 font-mono mt-0.5">
              {{ overview.originator?.address || '--' }}
            </div>
          </div>
          <div
            class="text-hero font-semibold"
            :class="
              overview.direction === 'outgoing'
                ? 'text-tone-outbound-text'
                : 'text-tone-inbound-text'
            "
          >
            →
          </div>
          <div class="beneficiary-box rounded-lg p-3">
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-1">
              {{ beneficiaryLabelText }}
            </div>
            <div class="text-sm font-semibold text-g-900">
              {{
                overview.beneficiary?.name ||
                (overview.beneficiary?.did
                  ? $t('txLens.unknownVasp')
                  : $t('txLens.unknownCustomer'))
              }}
            </div>
            <div class="text-xs text-g-700 font-mono mt-0.5">
              {{ overview.beneficiary?.address || '--' }}
            </div>
          </div>
        </div>

        <!-- Review Result（前端固定 none：接口实现有误，暂不取接口值；点击提示开发中） -->
        <div class="mt-4 pt-4 border-t border-[var(--default-border)]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-g-700 uppercase tracking-wider">{{
              $t('txLens.detail.reviewResult')
            }}</span>
            <div class="flex items-center gap-1.5">
              <!-- 仅当前值着色（reviewResultStyle），未选中的 tag 一律灰（与 none 同款），
                   避免固定 none 时五颜六色误导「已有结论」 -->
              <button
                v-for="opt in reviewResultOptions"
                :key="opt.value"
                type="button"
                class="review-pill rounded-full px-2.5 py-0.5 text-label font-semibold transition-colors"
                :class="{ 'is-selected': reviewResult === opt.value }"
                :style="reviewResult === opt.value ? reviewResultStyle(opt.value) : undefined"
                @click="handleReviewResultClick"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Step Navigation (Tab-style) ═══ -->
      <div class="step-nav mb-5">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-tab"
          :class="{ active: activeStep === step.key, disabled: step.disabled }"
          @click="handleStepClick(index)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="handleStepClick(index)"
          @keydown.space.prevent="handleStepClick(index)"
        >
          <div class="step-indicator" :style="{ background: toneColor(step.tone) }"></div>
          <div class="step-content">
            <div class="step-title">{{ step.label }}</div>
            <div class="step-status" :style="toneTextStyle(step.tone)">{{ step.state }}</div>
          </div>
        </div>
      </div>

      <!-- ═══ Step Content ═══ -->
      <div v-show="activeStep === 'compliance'">
        <StepCompliance
          :data="complianceData"
          :direction="overview.direction"
          :approving="approving"
          :rejecting="rejecting"
          @approve="handleApprove"
          @reject="handleReject"
        />
      </div>
      <div v-show="activeStep === 'travelRule'">
        <StepTravelRule
          :data="travelRuleData"
          :direction="overview.direction"
          :orderId="overview.orderId"
          @reviewed="loadDetail"
        />
      </div>
      <div v-show="activeStep === 'signoff'">
        <StepSignOff :data="signoffData" />
      </div>
      <div v-show="activeStep === 'onchain'">
        <StepOnChain :data="onchainData" />
      </div>
      <div v-show="activeStep === 'disposition'">
        <StepDisposition
          :disposition="overview.disposition"
          :amount="amountDisplay"
          :held-since="createTime"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import StepCompliance from './components/StepCompliance.vue'
  import StepTravelRule from './components/StepTravelRule.vue'
  import StepSignOff from './components/StepSignOff.vue'
  import StepOnChain from './components/StepOnChain.vue'
  import StepDisposition from './components/StepDisposition.vue'
  import {
    fetchTransactionLensOverview,
    fetchTransactionComplianceTab,
    fetchTransactionTravelRuleTab,
    fetchTransactionSignoffTab,
    fetchTransactionOnChainTab,
    approveTransaction,
    rejectTransaction,
    fetchTravelRuleCoinRates
  } from '@/api/compliance'
  import { fetchCoinList } from '@/api/coin'
  import { ElMessage } from 'element-plus'
  import type {
    TransactionLensItemView,
    ComplianceTabView,
    TravelRuleTabView,
    SignoffTabView,
    OnChainTabView
  } from '@/features/compliance/types'
  import {
    COMPLIANCE_DICT,
    DISPOSITION_DICT,
    ONCHAIN_DICT,
    SIGNOFF_DICT,
    TRAVEL_RULE_DICT,
    reviewResultStyle,
    toneColor as toneColorShared,
    toneOf,
    toneTextStyle,
    txStateLabel
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

  defineOptions({ name: 'TransactionLensDetail' })

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const orderId = route.params.id as string

  const loading = ref(false)
  const errorMessage = ref('')
  const overview = ref<TransactionLensItemView | null>(null)
  const complianceData = ref<ComplianceTabView | null>(null)
  const travelRuleData = ref<TravelRuleTabView | null>(null)
  const signoffData = ref<SignoffTabView | null>(null)
  const onchainData = ref<OnChainTabView | null>(null)

  const coinDecimals = ref<Record<string, number>>({})
  const coinUsdRate = ref<Record<string, number>>({})

  // 初始步骤从 URL query 读取，默认为 'compliance'
  const activeStep = ref((route.query.step as string) || 'compliance')
  const approving = ref(false)
  const rejecting = ref(false)

  // ─── 金额/法币 ───
  const amountDisplay = computed(() => {
    if (!overview.value) return '--'
    const decimals = coinDecimals.value[overview.value.coinId]
    const amount = decimals
      ? formatCoinBalance(overview.value.amount, decimals)
      : overview.value.amount
    return `${amount} ${overview.value.coinId}`
  })
  const fiatDisplay = computed(() => {
    if (!overview.value) return '--'
    const decimals = coinDecimals.value[overview.value.coinId]
    const usdRate = coinUsdRate.value[overview.value.coinId]
    if (decimals == null || usdRate == null) return '--'
    const amount = formatCoinBalance(overview.value.amount, decimals)
    return `≈ $${new BigNumber(amount).times(usdRate).toFormat(2, BigNumber.ROUND_HALF_UP)}`
  })
  const createTime = computed(() => formatTime(overview.value?.createTime))

  /** 出金方向（列表/overview 均为小写） */
  const isOutgoing = computed(() => overview.value?.direction === 'outgoing')

  // ─── 状态枚举统一走 features/compliance/txState ───
  const enumMaps = {
    compliance: COMPLIANCE_DICT,
    travelRule: TRAVEL_RULE_DICT,
    signoff: SIGNOFF_DICT,
    onchain: ONCHAIN_DICT,
    disposition: DISPOSITION_DICT
  }

  const originatorLabelText = computed(() => {
    const outgoing = overview.value?.direction === 'outgoing'
    return outgoing ? t('txLens.detail.originatorOurCustomer') : 'Originator (Counterparty)'
  })
  const beneficiaryLabelText = computed(() => {
    const outgoing = overview.value?.direction === 'outgoing'
    return outgoing ? t('txLens.detail.beneficiaryCounterparty') : 'Beneficiary (Our Customer)'
  })

  // Review Result：多 tag 可切换设置（当前值着色，其余灰）。
  // 固定为 none —— 接口当前的 reviewResult 实现有误，暂不取用。
  // 后端修复后接入：REVIEW_RESULT_DICT 归一化取值
  // （兼容 tp/true_positive 两种写法，未登记取值回退 none），
  // 即 `reviewResult.value = 归一化(overview.value?.reviewResult)`。
  const reviewResult = ref('none')

  const reviewResultOptions = computed(() => [
    { value: 'none', label: t('txLens.rrNone') },
    { value: 'tp', label: t('txLens.truePositive') },
    { value: 'tn', label: t('txLens.trueNegative') },
    { value: 'fp', label: t('txLens.falsePositive') },
    { value: 'fn', label: t('txLens.falseNegative') }
  ])

  function handleReviewResultClick() {
    // TODO: 接口就绪后替换为设置 reviewResult 的调用
    ElMessage.info(t('txLens.detail.reviewResultPending'))
  }

  // 阶段序列与列表页同源：方向决定槽位与时序；N/A 阶段统一置灰不可点击
  const steps = computed(() => {
    const o = overview.value
    if (!o) return []
    return buildStages(o).map((key) => {
      // stageStateOf 统一取值：无 Travel Rule 信息时 travelRule 按 na 处理
      const rawState = stageStateOf(o, key)
      const disabled = isStageDisabled(o, key)
      const state = txStateLabel(enumMaps[key], rawState, t)
      return {
        key,
        label: t(STAGE_LABEL_KEYS[key]),
        state,
        tone: toneOf(rawState),
        disabled
      }
    })
  })

  /** 可进入的 step：在序列中且未被禁用（如个人转账的 Travel Rule） */
  const enterableSteps = computed(() => steps.value.filter((s) => !s.disabled).map((s) => s.key))

  function handleStepClick(index: number) {
    const step = steps.value[index]
    // 不可用槽位（如个人转账的 Travel Rule）不可进入
    if (!step || step.disabled) return
    const key = step.key
    if (key) {
      activeStep.value = key
      // 更新 URL query 参数，使用 replace 避免添加浏览器历史
      router.replace({
        query: { ...route.query, step: key }
      })
    }
  }

  /**
   * 色调 → 状态指示器颜色。
   * 已迁至 txState.toneColor，此处保留薄封装仅为模板可读性。
   */
  const toneColor = toneColorShared

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

  async function loadDetail() {
    loading.value = true
    errorMessage.value = ''
    try {
      overview.value = await fetchTransactionLensOverview(orderId)
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Failed to load transaction'
      overview.value = null
      loading.value = false
      return
    }
    // 各 tab 独立加载，失败不阻塞整体
    const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn()
      } catch {
        return null
      }
    }
    const [comp, tr, sign, onchain] = await Promise.all([
      safe(() => fetchTransactionComplianceTab(orderId)),
      safe(() => fetchTransactionTravelRuleTab(orderId)),
      safe(() => fetchTransactionSignoffTab(orderId)),
      safe(() => fetchTransactionOnChainTab(orderId))
    ])
    complianceData.value = comp
    travelRuleData.value = tr
    signoffData.value = sign
    onchainData.value = onchain
    loading.value = false

    // 验证 URL 中的 step 参数：须在序列中且未被禁用（个人转账的 travelRule 不可进入），
    // 无效则回退到 'compliance'（恒存在且可用）
    if (!enterableSteps.value.includes(activeStep.value as StageKey)) {
      activeStep.value = 'compliance'
      // 同步更新 URL
      router.replace({
        query: { ...route.query, step: 'compliance' }
      })
    }
  }

  // ─── 放行/拒绝（各自独立 loading，互不影响）───
  async function handleApprove() {
    approving.value = true
    try {
      await approveTransaction(orderId)
      ElMessage.success(t('txLens.detail.approve') + ' OK')
      await loadDetail()
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      approving.value = false
    }
  }

  async function handleReject() {
    rejecting.value = true
    try {
      await rejectTransaction(orderId)
      ElMessage.success(t('txLens.detail.reject') + ' OK')
      await loadDetail()
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      rejecting.value = false
    }
  }

  onMounted(() => {
    loadCoinMeta()
    loadDetail()
  })
</script>

<style scoped>
  .originator-box {
    background: var(--el-color-primary-light-9);
    border-left: 3px solid var(--el-color-primary);
  }

  .beneficiary-box {
    /* 对手方：中性底 + 中性描边。此前用 success 色，与我方的品牌色同为绿系，
       两块并排时分不出「我方 / 对手方」。 */
    background: var(--tone-neutral-bg);
    border-left: 3px solid var(--tone-neutral-mark);
  }

  /* Step Navigation - Tab Style */
  .step-nav {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
  }

  .step-tab {
    display: flex;
    flex: 1;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-light);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .step-tab:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--art-shadow-hover);
  }

  .step-tab.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    box-shadow: var(--art-shadow-raised);
  }

  /* 不可用槽位（无 Travel Rule 信息）：置灰、不可点击、去 hover 反馈；
     与 na（未执行，实心灰点）区分：空心点 + 状态文字删除线 */
  .step-tab.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .step-tab.disabled:hover {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-light);
    box-shadow: none;
  }

  .step-tab.disabled .step-title {
    color: var(--el-text-color-placeholder);
  }

  /* 不可用槽位（na：未执行 / 无 Travel Rule 信息）：指示器用【空心】而非实心灰点。
     与列表阶段点同规则 —— 状态不依赖颜色也能被读出 */
  .step-tab.disabled .step-indicator {
    box-sizing: border-box;
    background: transparent !important;
    border: 1.5px solid var(--el-text-color-placeholder);
  }

  .step-indicator {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .step-content {
    flex: 1;
    min-width: 0;
  }

  .step-title {
    margin-bottom: 2px;
    font-size: var(--font-size-body-lg);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .step-tab.active .step-title {
    color: var(--theme-text);
  }

  .step-status {
    font-size: var(--font-size-label);
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  /* 复核结果选择：仅当前值由 reviewResultStyle 内联注入彩色（与列表徽章同源），
     未选中一律灰底（与 none 同款）、选中态用 currentColor 描边强调 */
  .review-pill {
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: none;
    outline: none;
  }

  .review-pill.is-selected {
    box-shadow: inset 0 0 0 1.5px currentcolor;
  }

  .review-pill:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
</style>
