<!-- Compliance Rules — 合规规则管理 -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-g-900">{{ $t('rules.title') }}</h1>
      <p class="text-sm text-g-500 mt-1">{{ $t('rules.subtitle') }}</p>
    </div>

    <!-- ═══ Filter Bar ═══ -->
    <div class="art-card mb-5 p-4">
      <div class="flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('rules.status') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: statusFilter === opt.value }"
              @click="statusFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('rules.severity') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in severityOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: severityFilter === opt.value }"
              @click="severityFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Direction Tabs ═══ -->
    <el-tabs v-model="direction" class="mb-5">
      <el-tab-pane :label="`${$t('rules.outgoing')} (${outgoingCount})`" name="outgoing" />
      <el-tab-pane :label="`${$t('rules.incoming')} (${incomingCount})`" name="incoming" />
    </el-tabs>

    <!-- ═══ Step Sections ═══ -->
    <div v-for="(step, stepIdx) in filteredSteps" :key="step.name" class="step-section mb-7">
      <div class="flex items-center gap-2.5 mb-1">
        <span
          class="w-6 h-6 rounded-full bg-g-100 text-g-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0"
        >
          {{ stepIdx + 1 }}
        </span>
        <span class="text-[15px] font-semibold text-g-900">{{ stageLabel(step.name) }}</span>
      </div>
      <div class="text-xs text-g-500 mb-4 ml-[34px]">{{ stepDescription(step.name) }}</div>

      <!-- Rule Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="rule in step.rules"
          :key="rule.id"
          class="art-card rule-card-hover p-4 cursor-pointer"
          :class="{ 'opacity-60 bg-g-50': rule.status === 'Cancelled' }"
          @click="goDetail(rule.id)"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="text-sm font-semibold text-g-900">{{ rule.name }}</span>
            <div class="flex gap-1 flex-shrink-0">
              <el-tag :type="severityTag(rule.severity)" size="small" effect="light">
                {{ severityLabel(rule.severity) }}
              </el-tag>
              <el-tag :type="statusTag(rule.status)" size="small" effect="light">
                {{ statusLabel(rule.status) }}
              </el-tag>
            </div>
          </div>
          <p class="text-xs text-g-600 leading-relaxed mb-3">{{ rule.description }}</p>
          <div class="flex gap-3 text-[11px] text-g-400">
            <span
              >{{ $t('rules.decision') }}:
              <span class="text-g-600">{{ decisionLabel(rule.decision) }}</span></span
            >
            <span
              >{{ $t('rules.scope') }}:
              <span class="text-g-600">{{ scopeLabel(rule.scope) }}</span></span
            >
          </div>
          <!-- Actions -->
          <div class="flex gap-2 mt-3 pt-3 border-t border-[var(--default-border)]" @click.stop>
            <el-button
              v-if="rule.status === 'Active' || rule.status === 'Pending'"
              size="small"
              text
              type="danger"
              @click="toggleRuleStatus(rule, 'Cancelled')"
            >
              {{ $t('rules.cancel') }}
            </el-button>
            <el-button
              v-if="rule.status === 'Cancelled'"
              size="small"
              text
              type="success"
              @click="toggleRuleStatus(rule, 'Active')"
            >
              {{ $t('rules.recover') }}
            </el-button>
            <el-button size="small" text @click="editRule(rule)">
              {{ $t('rules.edit') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- Add Rule per step -->
      <button
        class="w-full mt-3 py-2.5 border border-dashed border-g-300 rounded-lg text-sm font-medium text-g-500 hover:border-primary hover:bg-primary-50 hover:text-primary transition-all"
        @click="openAddRule(step.name)"
      >
        + {{ $t('rules.addRule') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import {
    decisionLabelKey,
    scopeLabelKey,
    severityLabelKey,
    ruleStatusLabelKey
  } from './dictionaries'

  defineOptions({ name: 'ComplianceRules' })

  const router = useRouter()
  const { t } = useI18n()

  const direction = ref('outgoing')
  const statusFilter = ref('all')
  const severityFilter = ref('all')

  const statusOptions = computed(() => [
    { label: t('rules.all'), value: 'all' },
    { label: t('rules.active'), value: 'Active' },
    { label: t('rules.pending'), value: 'Pending' },
    { label: t('rules.cancelled'), value: 'Cancelled' }
  ])
  const severityOptions = computed(() => [
    { label: t('rules.all'), value: 'all' },
    { label: t('rules.routine'), value: 'Routine' },
    { label: t('rules.medium'), value: 'Medium' },
    { label: t('rules.critical'), value: 'Critical' }
  ])

  interface Rule {
    id: number
    name: string
    severity: string
    status: string
    description: string
    decision: string
    scope: string
    stage: string
    direction: string
  }

  const rules = ref<Rule[]>([
    {
      id: 1,
      name: 'Sanctions Hit Block',
      severity: 'Critical',
      status: 'Active',
      description:
        'Reject if counterparty VASP or beneficiary matches OFAC SDN, UN Security Council, or EU sanctions lists.',
      decision: 'Auto Reject',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 2,
      name: 'High-Risk Jurisdiction Block',
      severity: 'Critical',
      status: 'Active',
      description:
        'Reject outgoing transfers to DPRK, Iran, Syria, or Cuba above 10,000 AED equivalent.',
      decision: 'Auto Reject',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 3,
      name: 'Large Transaction Review',
      severity: 'Routine',
      status: 'Active',
      description:
        'Route to compliance review for any outgoing transfer exceeding 50,000 AED equivalent.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 4,
      name: 'Unlicensed VASP Counterparty',
      severity: 'Medium',
      status: 'Pending',
      description:
        'Hold for manual review when counterparty VASP status is Unlicensed or regulatory verification is unconfirmed.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 5,
      name: 'Tainted Address Block',
      severity: 'Critical',
      status: 'Active',
      description:
        'Reject incoming transfers from addresses flagged for mixer interaction, darknet market, or ransomware association.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 6,
      name: 'CryptoVault — High Volume Review',
      severity: 'Medium',
      status: 'Active',
      description:
        'Merchant-specific override: review incoming transfers to CryptoVault Ltd exceeding 100,000 AED.',
      decision: 'Submit for Review',
      scope: 'Merchant-Specific',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 7,
      name: 'Suspicious Pattern Monitoring',
      severity: 'Medium',
      status: 'Cancelled',
      description: 'Flag transactions matching known suspicious patterns or structuring behavior.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 8,
      name: 'IVMS101 Mismatch',
      severity: 'Routine',
      status: 'Active',
      description:
        'Hold for review when originator PII fails IVMS101 validation or contains incomplete identifying information.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    },
    {
      id: 9,
      name: 'Amount Mismatch Hold',
      severity: 'Critical',
      status: 'Active',
      description:
        'Hold incoming transfers when the on-chain amount differs from the Travel Rule message by more than 1%.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    }
  ])

  const outgoingCount = computed(
    () => rules.value.filter((r) => r.direction.toLowerCase() === 'outgoing').length
  )
  const incomingCount = computed(
    () => rules.value.filter((r) => r.direction.toLowerCase() === 'incoming').length
  )

  const filteredSteps = computed(() => {
    const filtered = rules.value.filter((r) => {
      if (r.direction.toLowerCase() !== direction.value) return false
      if (statusFilter.value !== 'all' && r.status !== statusFilter.value) return false
      if (severityFilter.value !== 'all' && r.severity !== severityFilter.value) return false
      return true
    })
    const stages = [...new Set(filtered.map((r) => r.stage))]
    return stages.map((name) => ({
      name,
      rules: filtered.filter((r) => r.stage === name)
    }))
  })

  function stepDescription(stage: string): string {
    const dir = direction.value
    if (stage === 'Due Diligence') {
      return dir === 'outgoing'
        ? t('rules.stages.outgoingDueDiligenceDesc')
        : t('rules.stages.incomingDueDiligenceDesc')
    }
    if (stage === 'Mismatch Hold') {
      return t('rules.stages.mismatchHoldDesc')
    }
    return ''
  }

  function stageLabel(stage: string): string {
    if (stage === 'Due Diligence') return t('rules.stages.dueDiligence')
    if (stage === 'Mismatch Hold') return t('rules.stages.mismatchHold')
    return stage
  }

  // ─── 字典翻译（value 为后端枚举，labelKey 来自 dictionaries.ts）───
  function dictLabel(
    lookup: (value: string) => string | undefined,
    value: string,
    fallbackMap?: Record<string, string>
  ): string {
    const key = lookup(value)
    if (key) return t(key)
    // 兼容 mock 数据中的旧英文值
    if (fallbackMap?.[value]) return t(fallbackMap[value])
    return value
  }

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

  function severityLabel(severity: string): string {
    return dictLabel(severityLabelKey, severity, SEVERITY_FALLBACK)
  }

  function statusLabel(status: string): string {
    return dictLabel(ruleStatusLabelKey, status, STATUS_FALLBACK)
  }

  function decisionLabel(decision: string): string {
    return dictLabel(decisionLabelKey, decision, DECISION_FALLBACK)
  }

  function scopeLabel(scope: string): string {
    return dictLabel(scopeLabelKey, scope, SCOPE_FALLBACK)
  }

  function severityTag(severity: string) {
    if (severity === 'Critical') return 'danger'
    if (severity === 'Medium') return 'warning'
    return 'info'
  }

  function statusTag(status: string) {
    if (status === 'Active') return 'success'
    if (status === 'Pending') return 'warning'
    return 'info'
  }

  function openAddRule(stage: string) {
    router.push({
      name: 'ComplianceRuleEditor',
      query: { stage, direction: direction.value }
    })
  }

  function editRule(rule: Rule) {
    router.push({
      name: 'ComplianceRuleEditor',
      params: { id: String(rule.id) }
    })
  }

  function toggleRuleStatus(rule: Rule, status: string) {
    rule.status = status
  }

  function goDetail(id: number) {
    router.push({ name: 'ComplianceRuleDetail', params: { id: String(id) } })
  }
</script>

<style scoped>
  .filter-btn {
    padding: 4px 10px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: #fff;
    border: 1px solid var(--default-border);
    border-radius: 5px;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
  }

  .filter-btn.active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .rule-card-hover {
    transition: all 0.15s;
  }

  .rule-card-hover:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  }

  /* Dialog height limitation */
  :deep(.el-dialog) {
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  /* Factor row styles */
  .factor-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.15s;
  }

  .factor-row.active {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary-light-5);
  }

  .factor-toggle {
    width: 16px;
    height: 16px;
    border: 2px solid var(--el-border-color);
    border-radius: 4px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.15s;
  }

  .factor-row.active .factor-toggle {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  .factor-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    min-width: 140px;
  }

  .factor-options-hint {
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
