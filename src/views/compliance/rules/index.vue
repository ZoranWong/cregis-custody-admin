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
        <span class="text-[15px] font-semibold text-g-900">{{ step.name }}</span>
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
                {{ rule.severity }}
              </el-tag>
              <el-tag :type="statusTag(rule.status)" size="small" effect="light">
                {{ rule.status }}
              </el-tag>
            </div>
          </div>
          <p class="text-xs text-g-600 leading-relaxed mb-3">{{ rule.description }}</p>
          <div class="flex gap-3 text-[11px] text-g-400">
            <span
              >{{ $t('rules.decision') }}: <span class="text-g-600">{{ rule.decision }}</span></span
            >
            <span
              >{{ $t('rules.scope') }}: <span class="text-g-600">{{ rule.scope }}</span></span
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

    <!-- ═══ 新增/编辑规则弹窗 ═══ -->
    <el-dialog
      v-model="showDialog"
      :title="editing ? $t('rules.editRule') : $t('rules.addRule')"
      width="760px"
      destroy-on-close
    >
      <el-form label-width="140px" :model="form">
        <el-form-item :label="$t('rules.ruleName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('rules.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-x-6">
          <el-form-item :label="$t('rules.direction')">
            <el-input :model-value="form.direction" disabled />
          </el-form-item>
          <el-form-item :label="$t('rules.stage')">
            <el-input :model-value="form.stage" disabled />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-x-6">
          <el-form-item :label="$t('rules.minAmount')">
            <el-input v-model="form.minAmount" placeholder="e.g. 10000" />
          </el-form-item>
          <el-form-item :label="$t('rules.severity')">
            <el-select v-model="form.severity" class="w-full">
              <el-option label="Routine" value="Routine" />
              <el-option label="Medium" value="Medium" />
              <el-option label="Critical" value="Critical" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-x-6">
          <el-form-item :label="$t('rules.scope')">
            <el-select v-model="form.scope" class="w-full">
              <el-option :label="$t('rules.global')" value="Global" />
              <el-option :label="$t('rules.merchantSpecific')" value="Merchant Specific" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('rules.decision')">
            <el-select v-model="form.decision" class="w-full">
              <el-option :label="$t('rules.autoReject')" value="Auto Reject" />
              <el-option :label="$t('rules.submitReview')" value="Submit for Review" />
              <el-option :label="$t('rules.hold')" value="Hold" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('rules.riskFactors')">
          <div class="w-full">
            <p class="text-xs text-g-400 mb-2">{{ $t('rules.riskFactorHint') }}</p>
            <el-checkbox-group v-model="form.riskFactors" size="small">
              <div v-for="domain in factorCatalog" :key="domain.domain">
                <div
                  class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-1.5 pb-2 border-b border-[var(--default-border)]"
                >
                  {{ domain.domain }}
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                  <el-checkbox v-for="f in domain.factors" :key="f" :value="f" :label="f" />
                </div>
              </div>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveRule">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ComplianceRules' })

  const router = useRouter()
  const direction = ref('outgoing')
  const statusFilter = ref('all')
  const severityFilter = ref('all')
  const showDialog = ref(false)
  const editing = ref(false)

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'Active' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Cancelled', value: 'Cancelled' }
  ]
  const severityOptions = [
    { label: 'All', value: 'all' },
    { label: 'Routine', value: 'Routine' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Critical', value: 'Critical' }
  ]

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

  const factorCatalog = [
    {
      domain: 'Customer Due Diligence',
      factors: ['Onboarding Status', 'Customer Risk Level']
    },
    {
      domain: 'Screening',
      factors: ['Counterparty VASP', 'Beneficiary', 'Originator Address', 'Beneficiary Address']
    },
    {
      domain: 'Counterparty VASP',
      factors: ['Jurisdiction', 'VASP Status', 'Regulatory', 'Travel Rule Capable', 'IVMS101 PII']
    }
  ]

  const form = reactive({
    id: 0,
    name: '',
    description: '',
    direction: 'Outgoing',
    stage: '',
    minAmount: '',
    severity: 'Routine',
    scope: 'Global',
    decision: 'Submit for Review',
    riskFactors: [] as string[]
  })

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
    const descs: Record<string, string> = {
      'Due Diligence':
        dir === 'outgoing'
          ? 'Screen the transaction for risk before anything leaves our side. Decision: Auto Reject or Submit for Review.'
          : 'Screen the received funds for risk before crediting to the customer. Decision: Hold or Submit for Review.',
      'Mismatch Hold':
        'Hold incoming transfers when the on-chain transaction does not match the Travel Rule PII. Decision: Hold or Submit for Review.'
    }
    return descs[stage] || ''
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
    editing.value = false
    Object.assign(form, {
      id: 0,
      name: '',
      description: '',
      direction: direction.value === 'outgoing' ? 'Outgoing' : 'Incoming',
      stage,
      minAmount: '',
      severity: 'Routine',
      scope: 'Global',
      decision: direction.value === 'outgoing' ? 'Auto Reject' : 'Hold',
      riskFactors: []
    })
    showDialog.value = true
  }

  function editRule(rule: Rule) {
    editing.value = true
    Object.assign(form, { ...rule, riskFactors: (rule as any).riskFactors || [] })
    showDialog.value = true
  }

  function toggleRuleStatus(rule: Rule, status: string) {
    rule.status = status
  }

  function goDetail(id: number) {
    router.push({ name: 'ComplianceRuleDetail', params: { id: String(id) } })
  }

  function saveRule() {
    if (editing.value) {
      const idx = rules.value.findIndex((r) => r.id === form.id)
      if (idx >= 0) {
        rules.value[idx] = {
          id: form.id,
          name: form.name,
          description: form.description,
          direction: form.direction,
          stage: form.stage,
          severity: form.severity,
          scope: form.scope,
          decision: form.decision,
          status: rules.value[idx].status
        }
      }
    } else {
      rules.value.push({
        id: Date.now(),
        name: form.name,
        description: form.description,
        direction: form.direction,
        stage: form.stage,
        severity: form.severity,
        scope: form.scope,
        decision: form.decision,
        status: 'Pending'
      })
    }
    showDialog.value = false
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
</style>
