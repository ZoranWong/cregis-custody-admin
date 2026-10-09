<!-- Transaction Lens Detail — 交易检查详情（步骤化） -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('txLens.detail.title') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('txLens.detail.subtitle') }}</p>
      </div>
      <el-button text @click="back">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('txLens.detail.backToLens') }}
      </el-button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="art-card p-10 text-center">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="errorMessage" class="art-card p-10 text-center">
      <p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p>
      <el-button type="primary" @click="loadDetail">{{ $t('console.refresh') }}</el-button>
    </div>

    <template v-else-if="overview">
      <!-- ═══ Transaction Header Card ═══ -->
      <div class="art-card mb-4 p-4">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-start gap-3">
            <ArtSvgIcon
              :icon="isOutgoing ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
              :class="
                isOutgoing ? 'text-[var(--el-color-primary)]' : 'text-[var(--el-color-success)]'
              "
              class="text-2xl mt-0.5"
            />
            <div>
              <div class="text-xl font-bold text-g-900">{{ amountDisplay }}</div>
              <div class="text-xs text-g-500 font-medium">{{ fiatDisplay }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center justify-end gap-1 mb-1">
              <el-tag :type="isOutgoing ? 'warning' : 'success'" size="small" effect="dark">
                {{ isOutgoing ? $t('txLens.outgoing') : $t('txLens.incoming') }}
              </el-tag>
            </div>
            <div class="text-xs font-semibold text-g-700 font-mono">{{ overview.orderId }}</div>
            <div class="text-[10px] text-g-500 mt-1">{{ createTime }}</div>
          </div>
        </div>
        <!-- Parties -->
        <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div class="originator-box rounded-md p-3">
            <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
              {{ originatorLabelText }}
            </div>
            <div class="text-sm font-semibold text-g-900">
              {{
                overview.originator?.name ||
                (overview.originator?.did ? $t('txLens.unknownVasp') : $t('txLens.unknownCustomer'))
              }}
            </div>
            <div class="text-xs text-g-500 font-mono mt-0.5">
              {{ overview.originator?.address || '--' }}
            </div>
          </div>
          <div
            class="text-xl font-bold"
            :class="
              overview.direction === 'outgoing'
                ? 'text-[var(--el-color-primary)]'
                : 'text-[var(--el-color-success)]'
            "
          >
            →
          </div>
          <div class="beneficiary-box rounded-md p-3">
            <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
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
            <div class="text-xs text-g-500 font-mono mt-0.5">
              {{ overview.beneficiary?.address || '--' }}
            </div>
          </div>
        </div>

        <!-- Review Result（前端固定 none：接口实现有误，暂不取接口值；点击提示开发中） -->
        <div class="mt-4 pt-4 border-t border-[var(--default-border)]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-g-500 uppercase tracking-wider">{{
              $t('txLens.detail.reviewResult')
            }}</span>
            <div class="flex items-center gap-1.5">
              <el-tag
                v-for="opt in reviewResultOptions"
                :key="opt.value"
                :type="reviewResult === opt.value ? opt.tagType : 'info'"
                size="small"
                :effect="reviewResult === opt.value ? 'dark' : 'plain'"
                class="cursor-pointer"
                @click="handleReviewResultClick"
              >
                {{ opt.label }}
              </el-tag>
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
    toneOf,
    toneTextStyle,
    txStateLabel,
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

  // Review Result：多 tag 可切换设置（当前值高亮）。
  // 固定为 none —— 接口当前的 reviewResult 实现有误，暂不取用；
  // 后端修复后改为 `ref(overview.value?.reviewResult || 'none')` 即可。
  const reviewResult = ref('none')

  const reviewResultOptions = computed(() => [
    { value: 'none', label: t('txLens.rrNone'), tagType: 'info' as const },
    { value: 'tp', label: t('txLens.truePositive'), tagType: 'success' as const },
    { value: 'fp', label: t('txLens.falsePositive'), tagType: 'warning' as const },
    { value: 'fn', label: t('txLens.falseNegative'), tagType: 'danger' as const }
  ])

  function handleReviewResultClick() {
    // TODO: 接口就绪后替换为设置 reviewResult 的调用
    ElMessage.info(t('common.underDevelopment'))
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

  function back() {
    router.back()
  }

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

  /** 色调 → 状态指示器颜色 */
  function toneColor(tone: Tone): string {
    const map: Record<Tone, string> = {
      done: 'var(--el-color-success)',
      progress: 'var(--el-color-warning)',
      error: 'var(--el-color-danger)',
      info: 'var(--el-color-info)',
      na: 'var(--el-text-color-placeholder)'
    }
    return map[tone]
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
    background: var(--el-color-success-light-9);
    border-left: 3px solid var(--el-color-success);
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
    box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  }

  .step-tab.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
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

  .step-tab.disabled .step-indicator {
    box-sizing: border-box;
    background: var(--el-text-color-placeholder) !important;
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
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .step-tab.active .step-title {
    color: var(--el-color-primary);
  }

  .step-status {
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
</style>
