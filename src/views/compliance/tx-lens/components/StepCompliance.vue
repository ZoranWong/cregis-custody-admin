<!-- Step: Compliance — 合规审查 -->
<template>
  <div>
    <!-- Compliance Sub-Tabs -->
    <div class="sub-tab-bar mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="sub-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ $t(tab.label) }}
      </button>
    </div>

    <!-- Risk Profile -->
    <div v-show="activeTab === 'assessment'">
      <!-- Risk Score + Decision -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.compRiskProfile')
          }}</span>
        </div>
        <div class="p-4 grid grid-cols-3 gap-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{
              $t('txLens.detail.riskScore')
            }}</span>
            <span class="text-sm text-g-800 font-medium">{{ data?.riskScore ?? '--' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{
              $t('rules.decision')
            }}</span>
            <span class="text-sm text-g-800 font-medium">{{ decisionText }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{
              $t('alerts.conclusion')
            }}</span>
            <span class="text-sm text-g-800 font-medium">{{ conclusionText }}</span>
          </div>
        </div>
      </div>

      <!-- Rules Triggered -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.rulesTriggered')
          }}</span>
          <span class="text-xs font-semibold text-g-500">
            {{ rulesTriggered.length }}
            {{ rulesTriggered.length === 1 ? $t('txLens.detail.rule') : $t('txLens.detail.rules') }}
          </span>
        </div>
        <div class="p-4 flex flex-col gap-2">
          <div
            v-if="rulesTriggered.length === 0"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-success-light-9)] border border-[var(--el-color-success-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-success text-base" />
            <div>
              <div class="text-sm font-medium text-success">{{
                $t('txLens.detail.noRulesTriggered')
              }}</div>
              <div class="text-xs text-g-500 mt-0.5">{{
                $t('txLens.detail.noRulesTriggeredHint')
              }}</div>
            </div>
          </div>
          <div
            v-for="rule in rulesTriggered"
            :key="rule.ruleCode"
            class="border border-[var(--default-border)] rounded-lg p-3"
          >
            <!-- 规则名 + 严重级别 + 跳转规则详情 -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span class="text-sm font-semibold text-g-900">{{ rule.ruleName }}</span>
                <el-tag
                  v-if="rule.severity"
                  :type="severityTag(rule.severity)"
                  size="small"
                  effect="light"
                >
                  {{ severityLabelOf(rule.severity) }}
                </el-tag>
              </div>
              <el-button
                v-if="rule.id != null"
                text
                size="small"
                class="flex-shrink-0 !px-1"
                @click="openRule(rule.id)"
              >
                {{ $t('txLens.detail.viewRule') }}
              </el-button>
            </div>

            <!-- 命中条件 -->
            <div v-if="rule.conditions?.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="(cond, ci) in rule.conditions"
                :key="ci"
                class="px-2 py-0.5 bg-g-50 border border-[var(--default-border)] rounded text-[11px] text-g-700"
              >
                {{ conditionLabel(cond) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Due Diligence -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.cdd') }}</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-2">
          <div v-if="cddItems.length === 0" class="text-xs text-g-400">--</div>
          <div
            v-for="item in cddItems"
            :key="item.label"
            class="flex items-center gap-1.5 text-xs text-g-700"
          >
            <span :class="item.passed ? 'text-success font-bold' : 'text-g-400'">
              {{ item.passed ? '✓' : '✗' }}</span
            >
            <span>{{ cddLabel(item.label) }}</span>
            <span v-if="item.value" class="text-g-400 ml-1">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- Screening Results -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.screeningResults')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="!hasScreening"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noScreeningResult') }}</span>
          </div>
          <template v-else>
            <div class="mb-4">
              <div
                class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                >{{ $t('txLens.detail.entityScreening') }}</div
              >
              <div
                v-for="item in entityScreening"
                :key="item.subject"
                class="flex items-center justify-between py-1.5"
              >
                <span class="text-xs text-g-700">{{ item.subject }}</span>
                <el-tag
                  :type="item.result === 'CLEAR' ? 'success' : 'danger'"
                  size="small"
                  effect="dark"
                  >{{ item.result }}</el-tag
                >
              </div>
              <div v-if="entityScreening.length === 0" class="text-xs text-g-400 py-1.5">--</div>
            </div>
            <div>
              <div
                class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                >{{ $t('txLens.detail.onChainScreening') }}</div
              >
              <div
                v-for="item in onChainScreening"
                :key="item.subject"
                class="flex items-center justify-between py-1.5"
              >
                <span class="text-xs text-g-700">{{ item.subject }}</span>
                <el-tag
                  :type="item.result === 'CLEAR' ? 'success' : 'danger'"
                  size="small"
                  effect="dark"
                  >{{ item.result }}</el-tag
                >
              </div>
              <div v-if="onChainScreening.length === 0" class="text-xs text-g-400 py-1.5">--</div>
            </div>
          </template>
        </div>
      </div>

      <!-- Travel Rule Compliance -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.travelRuleCompliance')
          }}</span>
        </div>
        <div class="p-4">
          <!-- 无 Travel Rule 通知 -->
          <div
            v-if="!hasTravelRule"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{
              $t('txLens.detail.noTravelRuleNotification')
            }}</span>
          </div>
          <template v-else>
            <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4 mb-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                    $t('travelRule.status')
                  }}</span>
                  <span class="text-sm text-g-800 font-medium">{{ trStatusText }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">VASP DID</span>
                  <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                    travelRuleSummary?.vaspDid || '--'
                  }}</span>
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-3 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
            >
              <span class="text-xs font-semibold text-g-600">{{
                $t('txLens.detail.ivms101PiiExchange')
              }}</span>
              <span class="text-xs font-semibold" :class="ivms101StatusClass">
                {{ ivms101StatusText }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- 操作：合规状态为审查中时显示审核按钮（clear / flagged 不显示） -->
      <div
        v-if="showReviewActions"
        class="flex items-center justify-between gap-3 mt-2 px-4 py-3 bg-[var(--el-fill-color-light)] border border-[var(--default-border)] rounded-lg"
      >
        <span class="text-xs text-g-600">{{ $t('txLens.detail.pendingReviewHint') }}</span>
        <div class="flex gap-2 flex-shrink-0">
          <el-button type="danger" :loading="acting" @click="emit('reject')">{{
            $t('txLens.detail.reject')
          }}</el-button>
          <el-button type="success" :loading="acting" @click="emit('approve')">{{
            $t('txLens.detail.approve')
          }}</el-button>
        </div>
      </div>
    </div>

    <!-- Communication -->
    <div v-show="activeTab === 'communication'">
      <div class="art-card mb-4">
        <div class="p-4">
          <div
            v-if="communication.length === 0"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:chat-3-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noCommunication') }}</span>
          </div>
          <div
            v-for="round in communication"
            :key="round.roundNo"
            class="mb-5 pb-5 border-b border-[var(--default-border)] last:border-b-0 last:mb-0 last:pb-0"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-semibold text-g-900">{{
                $t('txLens.detail.roundQuestionsRaised', { n: round.roundNo })
              }}</span>
              <span class="text-[11px] text-g-400">{{ round.requestedAt }}</span>
            </div>
            <div class="text-[11px] text-g-500 mb-1.5">{{ round.initiator }}</div>
            <div class="text-xs text-g-600 mb-2.5">{{ round.status }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compliance Timeline -->
    <div v-show="activeTab === 'timeline'">
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.compTimeline')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="timeline.length === 0"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
          </div>
          <div v-else class="timeline-chain">
            <div v-for="node in timeline" :key="node.label + node.time" class="timeline-node">
              <div class="timeline-dot" :style="toneDotStyle(toneOf(node.status))" />
              <div class="text-sm font-semibold text-g-800">{{ timelineLabel(node.label) }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ timelineDetail(node.detail) }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import type { ComplianceTabView, RuleTriggerView } from '@/features/compliance/types'
  import { formatTime } from '@/utils/format'
  import {
    conditionText,
    severityLabel,
    severityTagType,
    type TagType
  } from '@/features/compliance/dictionaries'
  import {
    CONCLUSION_DICT,
    DECISION_DICT,
    toneDotStyle,
    toneOf,
    txStateLabel
  } from '@/features/compliance/txState'

  const { t } = useI18n()
  const router = useRouter()

  const props = defineProps<{
    data: ComplianceTabView | null
    direction: string
    acting?: boolean
  }>()
  const emit = defineEmits<{ (e: 'approve'): void; (e: 'reject'): void }>()

  const activeTab = ref('assessment')

  /**
   * 审核按钮显示条件：dispositionStatus 为 PENDING（待审核）。
   * PENDING = 待审核（显示按钮）
   * APPROVED = 审核通过（不显示按钮）
   * REJECTED = 审核拒绝（不显示按钮）
   */
  const showReviewActions = computed(() => props.data?.dispositionStatus === 'PENDING')

  const tabs = [
    { key: 'assessment', label: 'txLens.detail.subTabRiskProfile' },
    { key: 'communication', label: 'txLens.detail.subTabCommunication' },
    { key: 'timeline', label: 'txLens.detail.subTabTimeline' }
  ]

  const rulesTriggered = computed(() => props.data?.rulesTriggered || [])
  const cddItems = computed(() => props.data?.cddChecklist || [])
  const entityScreening = computed(() => props.data?.screening?.entity || [])
  const onChainScreening = computed(() => props.data?.screening?.onchain || [])

  // ─── 规则展示统一走 dictionaries 的格式化函数 ───
  function severityTag(severity: string): TagType {
    return severityTagType(severity)
  }
  function severityLabelOf(severity: string): string {
    return severityLabel(severity, t)
  }
  function conditionLabel(cond: RuleTriggerView['conditions'][number]): string {
    return conditionText(cond, t)
  }

  // ─── 风险概览（决策/结论走统一字典）───
  const decisionText = computed(() => txStateLabel(DECISION_DICT, props.data?.decision, t))
  const conclusionText = computed(() => txStateLabel(CONCLUSION_DICT, props.data?.conclusion, t))

  // ─── 跳转规则详情（接口已直接返回规则 id）───
  function openRule(ruleId: number) {
    router.push({ name: 'ComplianceRuleDetail', params: { id: ruleId } })
  }

  // 是否有筛查结果（entity/onchain 均为 null 视为无筛查数据）
  const hasScreening = computed(() => {
    const s = props.data?.screening
    if (!s) return false
    return (s.entity && s.entity.length > 0) || (s.onchain && s.onchain.length > 0)
  })
  const communication = computed(() => props.data?.communication || [])
  const timeline = computed(() => props.data?.timeline || [])
  const travelRuleSummary = computed(() => props.data?.travelRuleSummary || null)

  // 是否收到 Travel Rule 通知（status/vaspDid 均无值视为未收到）
  const hasTravelRule = computed(() => {
    const s = travelRuleSummary.value
    if (!s) return false
    return (s.status && s.status !== 'N/A') || (s.vaspDid && s.vaspDid.trim() !== '')
  })

  const trStatusText = computed(() => {
    const s = travelRuleSummary.value?.status
    if (!s || s === 'N/A') return '--'
    const map: Record<string, string> = {
      CREATED: 'travelRule.stCreated',
      PII_APPENDED: 'travelRule.stPiiAppended',
      UNMATCHED: 'travelRule.stUnmatched',
      AUTHORIZED: 'travelRule.stAuthorized',
      ACCEPTED: 'travelRule.stAccepted',
      REJECTED: 'travelRule.stRejected',
      SETTLING: 'travelRule.stSettling',
      SETTLED: 'travelRule.stSettled',
      REVERTED: 'travelRule.stReverted'
    }
    return map[s] ? t(map[s]) : s
  })

  const ivms101StatusText = computed(() => {
    const s = travelRuleSummary.value?.ivms101Status
    if (!s || s === 'N/A') return '--'
    return s
  })

  const ivms101StatusClass = computed(() => {
    const s = travelRuleSummary.value?.ivms101Status
    if (s === 'VALID') return 'text-success'
    if (s === 'INVALID') return 'text-danger'
    return 'text-g-600'
  })

  /** 后端返回的 CDD label → 翻译；未收录的 label 原样展示 */
  const CDD_LABELS: Record<string, string> = {
    'Onboarding Status': 'txLens.detail.cddLabelOnboarding',
    'Corporate Identity': 'txLens.detail.cddLabelCorporateIdentity',
    'Corporate Identity Verified': 'txLens.detail.cddLabelCorporateIdentity',
    Jurisdiction: 'txLens.detail.cddLabelJurisdiction',
    'Entity Type': 'txLens.detail.cddLabelEntityType',
    'Risk Level': 'txLens.detail.cddLabelRiskLevel'
  }

  function cddLabel(label: string): string {
    const key = CDD_LABELS[label]
    return key ? t(key) : label
  }

  // ─── 时间线：label / detail 为后端枚举，统一翻译 ───
  const TIMELINE_LABELS: Record<string, string> = {
    'Rule Triggered': 'txLens.detail.timelineRuleTriggered',
    'Compliance Decision': 'txLens.detail.tlComplianceDecision',
    'Travel Rule': 'txLens.detail.tabTravelRule',
    'Sign-off': 'txLens.detail.tabSignOff',
    'On-Chain': 'txLens.detail.tabOnChain'
  }

  function timelineLabel(label: string): string {
    const key = TIMELINE_LABELS[label]
    return key ? t(key) : label
  }

  /** detail 可能是决策值（HOLD / MANUAL_REVIEW）或自由文本 */
  function timelineDetail(detail: string): string {
    const key =
      DECISION_DICT.find((d) => d.value === detail)?.labelKey ||
      CONCLUSION_DICT.find((d) => d.value === detail)?.labelKey
    return key ? t(key) : detail
  }
</script>

<style scoped>
  .pii-round {
    border-color: var(--el-color-warning-light-5);
  }

  .sub-tab-bar {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: var(--el-fill-color);
    border-radius: 8px;
  }

  .sub-tab {
    padding: 6px 14px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .sub-tab:hover {
    color: var(--el-text-color-primary);
  }

  .sub-tab.active {
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-bg-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
  }

  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  .timeline-chain::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 7px;
    width: 2px;
    content: '';
    background: var(--el-border-color-light);
  }

  .timeline-node {
    position: relative;
    padding-bottom: 16px;
  }

  .timeline-node:last-child {
    padding-bottom: 0;
  }

  .timeline-dot {
    position: absolute;
    top: 4px;
    left: -20px;
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  /* 圆点颜色由 toneDotStyle 内联注入 */
</style>
