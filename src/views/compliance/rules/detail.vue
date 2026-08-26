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
      class="flex items-center gap-2 px-4 py-3 bg-warning-50 border border-warning rounded-lg text-sm text-warning mb-5"
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
            {{ currentRule.status }}
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
              {{ currentRule.direction }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.minAmount')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ currentRule.minAmount || 'Any amount' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.severity')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ currentRule.severity }}
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
              {{ currentRule.stage }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.decision')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ currentRule.decision }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.scope')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
            >
              {{ currentRule.scope }}
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
                  class="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg"
                >
                  <span
                    class="w-4 h-4 rounded bg-primary flex items-center justify-center text-white text-[10px] flex-shrink-0"
                    >✓</span
                  >
                  <span class="text-sm font-medium text-g-800 min-w-[140px]">{{
                    factor.label
                  }}</span>
                  <span class="text-xs text-primary font-medium ml-auto">{{
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

  defineOptions({ name: 'ComplianceRuleDetail' })

  const route = useRoute()
  const router = useRouter()

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
