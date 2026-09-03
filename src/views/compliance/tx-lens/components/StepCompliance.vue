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
      <!-- Rules Triggered -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.rulesTriggered')
          }}</span>
          <span class="text-xs font-semibold text-g-500">{{
            $t('txLens.detail.rulesCount', { count: rulesTriggered.length })
          }}</span>
        </div>
        <div class="p-4 flex flex-col gap-2">
          <div
            v-for="rule in rulesTriggered"
            :key="rule.key"
            class="border border-[var(--default-border)] rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-semibold text-g-900">{{ rule.name }}</span>
              <span class="text-xs font-medium text-primary cursor-pointer">{{
                $t('txLens.detail.viewRule')
              }}</span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in rule.tags"
                :key="tag"
                class="px-2 py-0.5 bg-g-50 border border-[var(--default-border)] rounded text-[11px] text-g-700"
                >{{ tag }}</span
              >
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
          <div
            v-for="item in cddItems"
            :key="item.key"
            class="flex items-center gap-1.5 text-xs text-g-700"
          >
            <span class="text-success font-bold">✓</span>
            <span>{{ $t(item.label) }}</span>
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
          <div class="mb-4">
            <div
              class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
              >{{ $t('txLens.detail.entityScreening') }}</div
            >
            <div
              v-for="item in entityScreening"
              :key="item.key"
              class="flex items-center justify-between py-1.5"
            >
              <span class="text-xs text-g-700">{{ $t(item.label) }}</span>
              <el-tag
                :type="item.status === 'CLEAR' ? 'success' : 'danger'"
                size="small"
                effect="dark"
                >{{
                  item.status === 'CLEAR' ? $t('txLens.detail.statusClear') : $t(item.status)
                }}</el-tag
              >
            </div>
          </div>
          <div>
            <div
              class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
              >{{ $t('txLens.detail.onChainScreening') }}</div
            >
            <div
              v-for="item in onChainScreening"
              :key="item.key"
              class="flex items-center justify-between py-1.5"
            >
              <span class="text-xs text-g-700">{{ $t(item.label) }}</span>
              <el-tag type="success" size="small" effect="dark">{{
                $t('txLens.detail.statusClear')
              }}</el-tag>
            </div>
          </div>
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
          <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4 mb-3">
            <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspIdentity.name }}</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                  $t('txLens.detail.jurisdiction')
                }}</span>
                <span class="text-sm text-g-800 font-medium">{{ vaspIdentity.jurisdiction }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                  $t('txLens.detail.regulatoryStatus')
                }}</span>
                <span class="text-sm text-g-800 font-medium">{{
                  vaspIdentity.regulatoryStatus
                }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                  $t('txLens.detail.trCapable')
                }}</span>
                <span class="text-sm text-g-800 font-medium">{{ vaspIdentity.trCapable }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-g-500 uppercase">DID</span>
                <span class="text-xs text-g-800 font-medium font-mono">{{ vaspIdentity.did }}</span>
              </div>
            </div>
          </div>
          <div
            class="flex items-center justify-between px-3 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
          >
            <span class="text-xs font-semibold text-g-600">{{
              $t('txLens.detail.ivms101PiiExchange')
            }}</span>
            <span class="text-xs font-semibold" :class="piiValid ? 'text-success' : 'text-danger'">
              {{
                piiValid
                  ? $t('txLens.detail.valid')
                  : $t('txLens.detail.invalid', { count: piiMissingCount })
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Communication -->
    <div v-show="activeTab === 'communication'">
      <div class="art-card mb-4">
        <div class="p-4">
          <div class="flex justify-end gap-2 mb-4">
            <el-button size="small">{{ $t('txLens.detail.requestInfo') }}</el-button>
            <el-button size="small">{{ $t('txLens.detail.requestPiiUpdate') }}</el-button>
          </div>
          <!-- Communication Rounds -->
          <div
            v-for="(round, idx) in commRounds"
            :key="round.id"
            class="mb-5 pb-5 border-b border-[var(--default-border)] last:border-b-0 last:mb-0 last:pb-0"
            :class="{ 'pii-round': round.isPii }"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span
                class="text-sm font-semibold"
                :class="round.isPii ? 'text-orange-700' : 'text-g-900'"
              >
                {{
                  round.isPii
                    ? $t('txLens.detail.roundPiiValidation', { n: commRounds.length - idx })
                    : $t('txLens.detail.roundQuestionsRaised', { n: commRounds.length - idx })
                }}
              </span>
              <span class="text-[11px] text-g-400">{{ round.time }}</span>
            </div>
            <div class="text-[11px] text-g-500 mb-1.5">{{ round.by }}</div>
            <div class="text-xs text-g-600 mb-2.5">{{ round.description }}</div>
            <!-- Q&A Items -->
            <div v-for="qa in round.questions" :key="qa.qNum" class="mb-2.5">
              <div class="flex gap-1.5 mb-1">
                <span class="text-[11px] font-bold text-primary flex-shrink-0">Q{{ qa.qNum }}</span>
                <span class="text-xs text-g-800" v-html="qa.text" />
              </div>
              <div class="pl-5">
                <div class="text-[10px] font-semibold text-g-400 uppercase mb-0.5">{{
                  $t('txLens.detail.answer')
                }}</div>
                <div
                  v-if="qa.file"
                  class="text-xs text-primary flex items-center gap-1 cursor-pointer"
                >
                  <ArtSvgIcon icon="ri:file-line" />
                  <span>{{ qa.file }}</span>
                </div>
                <div v-else-if="qa.textAnswer" class="text-xs text-g-700 leading-relaxed">{{
                  qa.textAnswer
                }}</div>
                <div v-else class="text-[11px] text-g-400 italic">{{
                  $t('txLens.detail.awaitingResponse')
                }}</div>
              </div>
            </div>
            <!-- Response Status -->
            <div
              v-if="round.responseTime"
              class="text-[11px] text-g-400 mt-2 pt-1.5 border-t border-dashed border-[var(--default-border)]"
            >
              {{ $t('txLens.detail.responseSubmitted') }}: {{ round.responseTime }}
            </div>
            <div
              v-else-if="round.pending"
              class="flex items-center justify-between text-[11px] text-warning mt-2 pt-1.5 border-t border-dashed border-[var(--default-border)]"
            >
              <span>{{ round.pending }}</span>
              <el-button size="small" text type="danger">{{
                $t('txLens.detail.cancelRound')
              }}</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fund Disposition (only for Incoming) -->
    <div v-show="activeTab === 'disposition'" v-if="txData.direction === 'Incoming'">
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.currentStatus')
          }}</span>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.receivedAmount')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ fundStatus.receivedAmount }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.heldSince')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ fundStatus.heldSince }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.currentStatus')
              }}</span>
              <span class="text-sm font-bold" :class="fundStatus.statusColor">{{
                fundStatus.status
              }}</span>
            </div>
          </div>
          <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4">
            <div class="text-xs text-g-600 mb-3 leading-relaxed">{{
              $t('txLens.detail.fundHeldDescription')
            }}</div>
            <div class="flex gap-3 flex-wrap">
              <el-button type="success" plain @click="handleDisposition('released')">{{
                $t('txLens.detail.releaseToCustomer')
              }}</el-button>
              <el-button type="danger" plain @click="handleDisposition('forfeited')">{{
                $t('txLens.detail.forfeitToDesignated')
              }}</el-button>
            </div>
            <div v-if="showForfeitAddress" class="mt-3">
              <label class="text-[11px] text-g-500 block mb-1">{{
                $t('txLens.detail.designatedForfeitureAddress')
              }}</label>
              <el-input placeholder="0x..." class="font-mono text-sm" />
            </div>
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
          <div class="timeline-chain">
            <div v-for="node in complianceTimeline" :key="node.label" class="timeline-node">
              <div class="timeline-dot" :class="node.dotClass" />
              <div class="text-sm font-semibold text-g-800">{{ $t(node.label) }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ $t(node.detail) }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'

  defineProps<{ txData: any }>()

  const activeTab = ref('assessment')
  const showForfeitAddress = ref(false)
  const piiValid = ref(false)
  const piiMissingCount = ref(3)

  const tabs = [
    { key: 'assessment', label: 'txLens.detail.subTabRiskProfile' },
    { key: 'communication', label: 'txLens.detail.subTabCommunication' },
    { key: 'timeline', label: 'txLens.detail.subTabTimeline' }
  ]

  const rulesTriggered = [
    {
      key: 'sanctions-hit',
      name: 'Sanctions Hit Block',
      tags: ['txLens.detail.screeningBeneficiary']
    },
    {
      key: 'large-tx',
      name: 'Large Transaction Review',
      tags: ['Amount ≥ 10,000 AED']
    },
    {
      key: 'high-risk-juris',
      name: 'High-Risk Jurisdiction Block',
      tags: ['Beneficiary Jurisdiction: KP (North Korea)']
    }
  ]

  const cddItems = [
    { key: 'onboarding', label: 'txLens.detail.cddOnboardingStatus' },
    { key: 'customerType', label: 'txLens.detail.cddCustomerType' },
    { key: 'riskLevel', label: 'txLens.detail.cddRiskLevel' },
    { key: 'proof', label: 'txLens.detail.cddProofCrsFatca' },
    { key: 'corporateId', label: 'txLens.detail.cddCorporateIdentity' },
    { key: 'sourceOfWealth', label: 'txLens.detail.cddSourceOfWealth' },
    { key: 'sourceOfFunds', label: 'txLens.detail.cddSourceOfFunds' },
    { key: 'financialThreshold', label: 'txLens.detail.cddFinancialThreshold' }
  ]

  const entityScreening = [
    { key: 'vasp', label: 'txLens.detail.screeningVasp', status: 'CLEAR' },
    {
      key: 'beneficiary',
      label: 'txLens.detail.screeningBeneficiary',
      status: 'txLens.detail.statusOfacSdn'
    }
  ]
  const onChainScreening = [
    { key: 'originatorAddr', label: 'txLens.detail.screeningOriginatorAddr', status: 'CLEAR' },
    { key: 'beneficiaryAddr', label: 'txLens.detail.screeningBeneficiaryAddr', status: 'CLEAR' }
  ]

  const vaspIdentity = {
    name: 'The UCE DMCC',
    jurisdiction: 'AE (UAE)',
    regulatoryStatus: 'Exempt',
    trCapable: 'Yes ✓',
    did: 'did:web:cregisio-8f89b...am'
  }

  const commRounds = [
    {
      id: 1,
      isPii: false,
      time: '2026-07-28 10:30 UTC',
      by: 'By: Compliance Team',
      description: 'Additional clarification required after reviewing your first submission:',
      questions: [
        {
          qNum: 1,
          text: 'Please provide <strong>proof of business relationship</strong> with the beneficiary.',
          file: 'Business_relationship_contract.pdf',
          textAnswer: ''
        },
        {
          qNum: 2,
          text: 'Please clarify the <strong>purpose of this transaction</strong>.',
          file: '',
          textAnswer:
            'Payment for consulting services provided by the beneficiary for regulatory audit preparation.'
        }
      ],
      responseTime: '2026-07-28 11:45 UTC',
      pending: ''
    },
    {
      id: 2,
      isPii: false,
      time: '2026-07-28 09:15 UTC',
      by: 'By: Compliance Team',
      description: 'Our compliance team has reviewed this transaction and requires clarification:',
      questions: [
        {
          qNum: 1,
          text: 'Please provide <strong>source of funds documentation</strong>.',
          file: 'Source_of_funds_statement.pdf',
          textAnswer: ''
        },
        {
          qNum: 2,
          text: "Clarify the <strong>beneficiary's identity</strong> and relationship.",
          file: '',
          textAnswer: 'Independent compliance consultant engaged on a project basis.'
        }
      ],
      responseTime: '2026-07-28 10:05 UTC',
      pending: ''
    }
  ]

  const fundStatus = reactive({
    receivedAmount: '50,000 USDT',
    heldSince: '2026-07-28 10:35 UTC',
    status: 'Held',
    statusColor: 'text-warning'
  })

  function handleDisposition(action: string) {
    if (action === 'forfeited') {
      showForfeitAddress.value = true
      return
    }
    showForfeitAddress.value = false
    const labels: Record<string, string> = { released: 'Released', held: 'Held' }
    const colors: Record<string, string> = { released: 'text-success', held: 'text-warning' }
    fundStatus.status = labels[action] || 'Held'
    fundStatus.statusColor = colors[action] || 'text-warning'
  }

  const complianceTimeline = [
    {
      label: 'txLens.detail.timelineRuleTriggered',
      detail: 'txLens.detail.detailRuleTriggered',
      time: '2026-07-28 10:28:16 UTC',
      dotClass: 'info'
    },
    {
      label: 'txLens.detail.timelineAutoRejected',
      detail: 'txLens.detail.detailAutoRejected',
      time: '2026-07-28 10:28:16 UTC',
      dotClass: 'failed'
    },
    {
      label: 'txLens.detail.timelineCustomerEscalation',
      detail: 'txLens.detail.detailCustomerEscalation',
      time: '2026-07-28 10:45:00 UTC',
      dotClass: 'pending'
    },
    {
      label: 'txLens.detail.timelineApproved',
      detail: 'txLens.detail.detailManualOverride',
      time: '2026-07-28 11:15:00 UTC',
      dotClass: 'completed'
    }
  ]
</script>

<style scoped>
  .pii-round {
    border-color: var(--el-color-warning-light-5);
  }
  .sub-tab-bar {
    display: inline-flex;
    gap: 2px;
    background: var(--el-fill-color);
    border-radius: 8px;
    padding: 3px;
  }
  .sub-tab {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .sub-tab:hover {
    color: var(--el-text-color-primary);
  }
  .sub-tab.active {
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }
  .timeline-chain::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
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
    left: -20px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
  }
  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }
  .timeline-dot.pending {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 2px var(--el-color-warning-light-5);
  }
  .timeline-dot.failed {
    background: var(--el-color-danger);
    box-shadow: 0 0 0 2px var(--el-color-danger-light-5);
  }
  .timeline-dot.info {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
  }
</style>
