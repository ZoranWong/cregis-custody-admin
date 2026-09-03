<!-- Rule Detail — 规则详情 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('rules.ruleDetailTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('rules.ruleDetailSubtitle') }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('rules.backToRules') }}
      </el-button>
    </div>

    <!-- Read-only Notice -->
    <div
      class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-warning-light-9)] border border-[var(--el-color-warning-light-5)] rounded-lg text-sm text-[var(--el-color-warning)] mb-5"
    >
      <ArtSvgIcon icon="ri:lock-line" class="text-base" />
      <span>{{ $t('rules.readonlyNotice') }}</span>
    </div>

    <!-- Rule Detail Card -->
    <div class="art-card mb-5">
      <div class="p-5 border-b border-[var(--default-border)] flex items-center justify-between">
        <h2 class="text-lg font-semibold text-g-900">{{ currentRule.name }}</h2>
        <div class="flex items-center gap-2">
          <el-tag :type="statusTag(currentRule.status)" size="default" effect="light">
            {{ statusLabel(currentRule.status) }}
          </el-tag>
          <el-button
            v-if="currentRule.status === 'Active'"
            type="danger"
            plain
            size="small"
            @click="cancelRule"
          >
            {{ $t('rules.cancelRule') }}
          </el-button>
          <el-button
            v-if="currentRule.status === 'Pending'"
            type="warning"
            plain
            size="small"
            @click="activateRule"
          >
            {{ $t('rules.activateRule') }}
          </el-button>
          <el-button
            v-if="currentRule.status === 'Cancelled'"
            type="success"
            plain
            size="small"
            @click="recoverRule"
          >
            {{ $t('rules.recoverRule') }}
          </el-button>
        </div>
      </div>
      <div class="p-5">
        <!-- Description -->
        <div class="mb-5">
          <label class="text-xs font-semibold text-g-600 block mb-1">{{
            $t('rules.description')
          }}</label>
          <div
            class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800 leading-relaxed"
          >
            {{ currentRule.description }}
          </div>
        </div>

        <!-- Direction + Amount + Severity -->
        <div class="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.direction')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ directionLabel(currentRule.direction) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.minAmount')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ minAmountLabel(currentRule.minAmount) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.severity')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ severityLabel(currentRule.severity) }}
            </div>
          </div>
        </div>

        <!-- Stage + Decision + Scope -->
        <div class="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.stage')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ stageLabel(currentRule.stage) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.decision')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ decisionLabel(currentRule.decision) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.scope')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ scopeLabel(currentRule.scope) }}
            </div>
          </div>
        </div>

        <!-- Risk Factors -->
        <div>
          <label class="text-xs font-semibold text-g-600 block mb-2">{{
            $t('rules.riskFactors')
          }}</label>
          <div
            v-if="activeFactors.length === 0"
            class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-400 italic"
          >
            {{ $t('rules.noRiskFactors') }}
          </div>
          <div v-else class="space-y-4">
            <div v-for="domain in groupedFactors" :key="domain.domain">
              <div
                class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-1.5 pb-2 border-b border-[var(--default-border)]"
              >
                {{ domain.domain }}
              </div>
              <div class="flex flex-col gap-2">
                <div
                  v-for="factor in domain.items"
                  :key="factor.label"
                  class="flex items-center gap-2 px-3 py-2 bg-[var(--el-color-primary-light-9)] border border-[var(--el-color-primary-light-5)] rounded-lg"
                >
                  <span
                    class="w-4 h-4 rounded bg-[var(--el-color-primary)] flex items-center justify-center text-white text-[10px] flex-shrink-0"
                    >✓</span
                  >
                  <span class="text-sm font-medium text-g-800 min-w-[140px]">{{
                    factor.label
                  }}</span>
                  <span class="text-xs text-[var(--el-color-primary)] font-medium ml-auto">{{
                    factor.values.join(', ')
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import {
    decisionLabelKey,
    scopeLabelKey,
    severityLabelKey,
    ruleStatusLabelKey,
    directionLabelKey,
    stageLabelKey
  } from './dictionaries'

  defineOptions({ name: 'ComplianceRuleDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  // Mock rule data (in real app, fetch by route.params.id)
  const rulesMap: Record<string, any> = {
    '1': {
      name: 'Sanctions Hit Block',
      status: 'Active',
      severity: 'Critical',
      description:
        'Reject if counterparty VASP or beneficiary matches OFAC SDN, UN Security Council, or EU sanctions lists.',
      direction: 'Outgoing',
      decision: 'Auto Reject',
      scope: 'Global',
      minAmount: 'Any amount',
      stage: 'Due Diligence',
      factors: {
        Screening: [
          { label: 'Counterparty VASP', values: ['OFAC SDN', 'EU List', 'UN Security'] },
          { label: 'Beneficiary', values: ['OFAC SDN', 'EU List', 'UN Security'] }
        ]
      }
    },
    '2': {
      name: 'High-Risk Jurisdiction Block',
      status: 'Active',
      severity: 'Critical',
      description:
        'Reject outgoing transfers to DPRK, Iran, Syria, or Cuba above 10,000 AED equivalent.',
      direction: 'Outgoing',
      decision: 'Auto Reject',
      scope: 'Global',
      minAmount: '10,000',
      stage: 'Due Diligence',
      factors: {
        'Counterparty VASP': [
          {
            label: 'Jurisdiction',
            values: ['KP — North Korea', 'IR — Iran', 'SY — Syria', 'CU — Cuba']
          }
        ]
      }
    }
  }

  const ruleId = route.params.id as string
  const currentRule = reactive(
    rulesMap[ruleId] || {
      name: 'Rule Not Found',
      status: 'Active',
      severity: 'Routine',
      description: 'The requested rule could not be found.',
      direction: 'Outgoing',
      decision: 'Submit for Review',
      scope: 'Global',
      minAmount: 'Any amount',
      stage: 'Due Diligence',
      factors: {}
    }
  )

  // ─── 字典翻译（与列表页相同的 fallback 兼容）───
  const DECISION_FALLBACK: Record<string, string> = {
    'Auto Reject': 'rules.decisions.autoReject',
    'Submit for Review': 'rules.decisions.submitReview',
    Hold: 'rules.decisions.hold'
  }
  const SCOPE_FALLBACK: Record<string, string> = {
    Global: 'rules.scopes.global',
    'Merchant Specific': 'rules.scopes.merchantSpecific'
  }
  const SEVERITY_FALLBACK: Record<string, string> = {
    Routine: 'rules.severities.routine',
    Medium: 'rules.severities.medium',
    Critical: 'rules.severities.critical'
  }
  const STATUS_FALLBACK: Record<string, string> = {
    Active: 'rules.statuses.active',
    Pending: 'rules.statuses.pending',
    Cancelled: 'rules.statuses.cancelled'
  }
  const DIRECTION_FALLBACK: Record<string, string> = {
    Outgoing: 'rules.outgoing',
    Incoming: 'rules.incoming'
  }
  const STAGE_FALLBACK: Record<string, string> = {
    'Due Diligence': 'rules.stages.dueDiligence',
    'Mismatch Hold': 'rules.stages.mismatchHold'
  }

  function dictLabel(
    lookup: (value: string) => string | undefined,
    value: string,
    fallbackMap?: Record<string, string>
  ): string {
    const key = lookup(value)
    if (key) return t(key)
    if (fallbackMap?.[value]) return t(fallbackMap[value])
    return value
  }

  function severityLabel(value: string): string {
    return dictLabel(severityLabelKey, value, SEVERITY_FALLBACK)
  }

  function statusLabel(value: string): string {
    return dictLabel(ruleStatusLabelKey, value, STATUS_FALLBACK)
  }

  function decisionLabel(value: string): string {
    return dictLabel(decisionLabelKey, value, DECISION_FALLBACK)
  }

  function scopeLabel(value: string): string {
    return dictLabel(scopeLabelKey, value, SCOPE_FALLBACK)
  }

  function directionLabel(value: string): string {
    return dictLabel(directionLabelKey, value, DIRECTION_FALLBACK)
  }

  function stageLabel(stage: string): string {
    return dictLabel(stageLabelKey, stage, STAGE_FALLBACK)
  }

  /** 最小金额：空值 / ANY / 旧英文 'Any amount' 均显示本地化"任意金额" */
  function minAmountLabel(value: string): string {
    if (!value || value === 'ANY' || value === 'Any amount') return t('rules.anyAmount')
    return value
  }

  const activeFactors = computed(() => {
    const result: Array<{ domain: string; label: string; values: string[] }> = []
    for (const [domain, items] of Object.entries(currentRule.factors || {})) {
      for (const item of items as Array<{ label: string; values: string[] }>) {
        result.push({ domain, ...item })
      }
    }
    return result
  })

  const groupedFactors = computed(() => {
    const groups: Record<string, Array<{ label: string; values: string[] }>> = {}
    for (const f of activeFactors.value) {
      if (!groups[f.domain]) groups[f.domain] = []
      groups[f.domain].push({ label: f.label, values: f.values })
    }
    return Object.entries(groups).map(([domain, items]) => ({ domain, items }))
  })

  function statusTag(status: string) {
    if (status === 'Active') return 'success'
    if (status === 'Pending') return 'warning'
    return 'info'
  }

  function cancelRule() {
    currentRule.status = 'Cancelled'
  }

  function activateRule() {
    currentRule.status = 'Active'
  }

  function recoverRule() {
    currentRule.status = 'Active'
  }
</script>
