<!-- Compliance Rules — 合规规则管理 -->
<template>
  <div class="page-content">
    <!-- ═══ 方向切换 + 筛选 ═══ -->
    <div class="art-card mb-5 p-4 flex flex-wrap items-center gap-3">
      <el-radio-group v-model="direction" size="small">
        <el-radio-button value="outgoing">{{ $t('rules.outgoing') }}</el-radio-button>
        <el-radio-button value="incoming">{{ $t('rules.incoming') }}</el-radio-button>
      </el-radio-group>
      <div class="w-px h-6 bg-g-300" />
      <el-select v-model="statusFilter" :placeholder="$t('rules.status')" clearable class="!w-36">
        <el-option :label="$t('rules.all')" value="" />
        <el-option :label="$t('rules.active')" value="Active" />
        <el-option :label="$t('rules.pending')" value="Pending" />
        <el-option :label="$t('rules.cancelled')" value="Cancelled" />
      </el-select>
      <el-select
        v-model="severityFilter"
        :placeholder="$t('rules.severity')"
        clearable
        class="!w-36"
      >
        <el-option :label="$t('rules.all')" value="" />
        <el-option :label="$t('rules.routine')" value="Routine" />
        <el-option :label="$t('rules.medium')" value="Medium" />
        <el-option :label="$t('rules.critical')" value="Critical" />
      </el-select>
      <div class="flex-1" />
      <el-button type="primary" @click="openAddRule">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />{{ $t('rules.addRule') }}
      </el-button>
    </div>

    <!-- ═══ 规则分组 ═══ -->
    <div v-for="step in filteredSteps" :key="step.name" class="mb-5">
      <div class="art-card">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-g-900 font-medium">{{ step.name }}</span>
        </div>
        <div class="p-4 grid gap-3">
          <div
            v-for="rule in step.rules"
            :key="rule.id"
            class="border border-[var(--default-border)] rounded-lg p-4 hover:border-g-400 transition-colors cursor-pointer"
            @click="goDetail(rule.id)"
          >
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium text-g-900">{{ rule.name }}</span>
                  <el-tag :type="severityTag(rule.severity)" size="small" effect="light">
                    {{ rule.severity }}
                  </el-tag>
                  <el-tag :type="statusTag(rule.status)" size="small" effect="light">
                    {{ rule.status }}
                  </el-tag>
                </div>
                <p class="text-sm text-g-500 mb-2">{{ rule.description }}</p>
                <div class="flex items-center gap-4 text-xs text-g-400">
                  <span
                    >{{ $t('rules.decision') }}:
                    <span class="text-g-600">{{ rule.decision }}</span></span
                  >
                  <span
                    >{{ $t('rules.scope') }}: <span class="text-g-600">{{ rule.scope }}</span></span
                  >
                </div>
              </div>
              <div class="flex gap-1 flex-shrink-0" @click.stop>
                <el-button
                  v-if="rule.status === 'Active' || rule.status === 'Pending'"
                  size="small"
                  text
                  type="danger"
                  @click="toggleRuleStatus(rule, 'Cancelled')"
                  >{{ $t('rules.cancel') }}</el-button
                >
                <el-button
                  v-if="rule.status === 'Cancelled'"
                  size="small"
                  text
                  type="success"
                  @click="toggleRuleStatus(rule, 'Active')"
                  >{{ $t('rules.recover') }}</el-button
                >
                <el-button size="small" text @click="editRule(rule)">{{
                  $t('rules.edit')
                }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 新增/编辑规则弹窗 ═══ -->
    <el-dialog
      v-model="showDialog"
      :title="editing ? $t('rules.editRule') : $t('rules.addRule')"
      width="560px"
    >
      <el-form label-width="120px" :model="form">
        <el-form-item :label="$t('rules.ruleName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('rules.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('rules.direction')">
          <el-input :model-value="form.direction" disabled />
        </el-form-item>
        <el-form-item :label="$t('rules.stage')">
          <el-input v-model="form.stage" />
        </el-form-item>
        <el-form-item :label="$t('rules.minAmount')">
          <el-input v-model="form.minAmount" />
        </el-form-item>
        <el-form-item :label="$t('rules.severity')">
          <el-select v-model="form.severity">
            <el-option label="Routine" value="Routine" />
            <el-option label="Medium" value="Medium" />
            <el-option label="Critical" value="Critical" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('rules.scope')">
          <el-select v-model="form.scope">
            <el-option :label="$t('rules.global')" value="Global" />
            <el-option :label="$t('rules.merchantSpecific')" value="Merchant Specific" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('rules.decision')">
          <el-select v-model="form.decision">
            <el-option :label="$t('rules.autoReject')" value="Auto Reject" />
            <el-option :label="$t('rules.submitReview')" value="Submit for Review" />
            <el-option :label="$t('rules.hold')" value="Hold" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('rules.riskFactors')">
          <div class="w-full">
            <p class="text-xs text-g-400 mb-2">{{ $t('rules.riskFactorHint') }}</p>
            <el-checkbox-group v-model="form.riskFactors" class="flex flex-wrap gap-2">
              <el-checkbox
                v-for="f in riskFactorCatalog"
                :key="f"
                :value="f"
                :label="f"
                border
                size="small"
              />
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
  const statusFilter = ref('')
  const severityFilter = ref('')
  const showDialog = ref(false)
  const editing = ref(false)

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

  const riskFactorCatalog = [
    'Customer Due Diligence',
    'Sanctions Screening',
    'Adverse Media',
    'VASP Domain',
    'Counterparty VASP',
    'On-Chain Heuristics',
    'Mixer/Darknet',
    'Ransomware',
    'Theft',
    'Structuring',
    'Jurisdiction Risk',
    'Transaction Pattern'
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
      description: 'Block transactions where any party matches sanctions lists.',
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
      description: 'Block transactions involving high-risk jurisdictions.',
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
      description: 'Submit large transactions for manual review.',
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
      description: 'Flag transactions with unlicensed VASP counterparties.',
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
      description: 'Block incoming transactions from tainted addresses.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 6,
      name: 'High Volume Review',
      severity: 'Medium',
      status: 'Active',
      description: 'Review incoming high-volume transactions.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 7,
      name: 'IVMS101 Mismatch',
      severity: 'Routine',
      status: 'Active',
      description: 'Submit when IVMS101 PII data does not match.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    },
    {
      id: 8,
      name: 'Amount Mismatch Hold',
      severity: 'Critical',
      status: 'Active',
      description: 'Hold transactions with amount discrepancies.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    }
  ])

  const filteredSteps = computed(() => {
    const filtered = rules.value.filter((r) => {
      if (r.direction.toLowerCase() !== direction.value) return false
      if (statusFilter.value && r.status !== statusFilter.value) return false
      if (severityFilter.value && r.severity !== severityFilter.value) return false
      return true
    })
    const stages = [...new Set(filtered.map((r) => r.stage))]
    return stages.map((name) => ({
      name,
      rules: filtered.filter((r) => r.stage === name)
    }))
  })

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

  function openAddRule() {
    editing.value = false
    Object.assign(form, {
      id: 0,
      name: '',
      description: '',
      direction: direction.value === 'outgoing' ? 'Outgoing' : 'Incoming',
      stage: '',
      minAmount: '',
      severity: 'Routine',
      scope: 'Global',
      decision: 'Submit for Review',
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
      if (idx >= 0) rules.value[idx] = { ...form }
    } else {
      rules.value.push({ ...form, id: Date.now() } as Rule)
    }
    showDialog.value = false
  }
</script>
