<!-- Transaction Lens Detail — 交易检查详情（步骤化） -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('txLens.detail.title') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('txLens.detail.subtitle') }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('txLens.detail.backToLens') }}
      </el-button>
    </div>

    <!-- ═══ Transaction Header Card ═══ -->
    <div class="art-card mb-4 p-4">
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="text-xl font-bold text-g-900">{{ txData.amount }}</div>
          <div class="text-xs text-g-500 font-medium">≈ {{ txData.fiatAmount }}</div>
        </div>
        <div class="text-right">
          <div class="text-xs font-semibold text-g-700 font-mono">{{ txData.orderId }}</div>
          <div class="text-[10px] text-g-500 mt-1">{{ txData.time }}</div>
          <div class="flex gap-1 justify-end mt-1">
            <el-tag :type="statusType(txData.status)" size="small" effect="dark">{{
              txData.status
            }}</el-tag>
            <el-tag type="success" size="small" effect="dark">{{ txData.compliance }}</el-tag>
            <el-tag type="success" size="small" effect="dark">TR {{ txData.travelRule }}</el-tag>
          </div>
        </div>
      </div>
      <!-- Parties -->
      <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div class="originator-box rounded-md p-3">
          <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
            {{ $t('txLens.detail.originatorOurCustomer') }}
          </div>
          <div class="text-sm font-semibold text-g-900">{{ txData.originator.name }}</div>
          <div class="text-xs text-g-600 mt-0.5">{{ txData.originator.detail }}</div>
          <div class="text-xs text-g-500 font-mono mt-0.5">{{ txData.originator.address }}</div>
        </div>
        <div
          class="text-xl font-bold"
          :class="
            txData.direction === 'Outgoing'
              ? 'text-[var(--el-color-primary)]'
              : 'text-[var(--el-color-success)]'
          "
        >
          →
        </div>
        <div class="beneficiary-box rounded-md p-3">
          <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
            {{ $t('txLens.detail.beneficiaryCounterparty') }}
          </div>
          <div class="text-sm font-semibold text-g-900">{{ txData.beneficiary.name }}</div>
          <div class="text-xs text-g-600 mt-0.5">{{ txData.beneficiary.detail }}</div>
          <div class="text-xs text-g-500 font-mono mt-0.5">{{ txData.beneficiary.address }}</div>
        </div>
      </div>
    </div>

    <!-- ═══ Progress Stepper ═══ -->
    <div class="onboarding-progress mb-5">
      <div class="progress-stepper">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="progress-step"
          :class="{
            completed: step.stepStatus === 'success',
            active: step.stepStatus === 'progress',
            failed: step.stepStatus === 'error',
            clickable: step.stepStatus !== 'pending'
          }"
          @click="handleStepClick(index)"
        >
          <div
            class="step-circle"
            :class="{
              done: step.stepStatus === 'success',
              active: step.stepStatus === 'progress',
              failed: step.stepStatus === 'error'
            }"
          >
            <span v-if="step.stepStatus === 'success'" class="step-check">✓</span>
            <span v-else-if="step.stepStatus === 'error'" class="step-fail">✗</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
          <div v-if="step.state" class="step-meta" :class="statusMetaClass(step.stepStatus)">
            {{ step.state }}
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Step Content ═══ -->
    <div v-show="activeStep === 'compliance'">
      <StepCompliance :tx-data="txData" />
    </div>
    <div v-show="activeStep === 'travel-rule'">
      <StepTravelRule :tx-data="txData" />
    </div>
    <div v-show="activeStep === 'signoff'">
      <StepSignOff :tx-data="txData" />
    </div>
    <div v-show="activeStep === 'onchain'">
      <StepOnChain :tx-data="txData" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import StepCompliance from './components/StepCompliance.vue'
  import StepTravelRule from './components/StepTravelRule.vue'
  import StepSignOff from './components/StepSignOff.vue'
  import StepOnChain from './components/StepOnChain.vue'

  defineOptions({ name: 'TransactionLensDetail' })

  const { t } = useI18n()

  const route = useRoute()
  const router = useRouter()
  const orderId = route.params.id as string

  // ─── State ───
  const activeStep = ref('compliance')
  const reviewOutcome = ref('none')
  const showActionBar = ref(true)

  // ─── Mock Transaction Data ───
  const txData = reactive({
    amount: '0.1 BTC',
    fiatAmount: '15,000 AED',
    orderId: orderId || 'ORDER-2026-07-28-0042',
    time: '2026-07-28 10:30 UTC',
    direction: 'Outgoing',
    status: 'Settled',
    compliance: 'Clear',
    travelRule: 'Complete',
    signOff: 'Approved',
    fundDisposition: '',
    originator: {
      name: 'CryptoVault Ltd',
      detail: 'Unit: Treasury · Account: Primary Pay-Out',
      address: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26'
    },
    beneficiary: {
      name: 'John Doe',
      detail: '',
      address: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75'
    }
  })

  // ── Step Navigation ───
  type StepStatus = 'pending' | 'progress' | 'success' | 'error'

  const stepOrder = ['compliance', 'travel-rule', 'signoff', 'onchain']

  const stepIndex = computed(() => {
    const idx = stepOrder.indexOf(activeStep.value)
    return idx === -1 ? 0 : idx
  })

  const steps = computed(() => {
    const allSteps: Array<{ key: string; label: string; state?: string; stepStatus: StepStatus }> =
      [
        {
          key: 'compliance',
          label: t('txLens.detail.tabCompliance'),
          state: txData.compliance,
          stepStatus: 'success'
        },
        {
          key: 'travel-rule',
          label: t('txLens.detail.tabTravelRule'),
          state: txData.travelRule,
          stepStatus: 'success'
        }
      ]
    if (txData.direction === 'Outgoing') {
      allSteps.push({
        key: 'signoff',
        label: t('txLens.detail.tabSignOff'),
        state: txData.signOff,
        stepStatus:
          txData.signOff === 'Approved' ? 'success' : txData.signOff ? 'progress' : 'pending'
      })
    }
    allSteps.push({
      key: 'onchain',
      label: t('txLens.detail.tabOnChain'),
      state: txData.status,
      stepStatus:
        txData.status === 'Settled' || txData.status === 'Confirmed'
          ? 'success'
          : txData.status === 'Failed'
            ? 'error'
            : 'progress'
    })
    return allSteps
  })

  function handleStepClick(index: number) {
    // Only pending steps cannot be clicked
    if (steps.value[index]?.stepStatus !== 'pending') {
      activeStep.value = stepOrder[index]
    }
  }

  function statusMetaClass(status: StepStatus): string {
    const map: Record<StepStatus, string> = {
      success: 'text-success',
      progress: 'text-warning',
      error: 'text-danger',
      pending: 'text-g-400'
    }
    return map[status]
  }

  // ─── Helpers ───
  type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
  function statusType(status: string): TagType | undefined {
    const map: Record<string, TagType> = {
      Settled: 'info',
      Broadcasted: 'warning',
      Confirmed: 'success',
      Failed: 'danger'
    }
    return map[status]
  }

  function handleDecision(decision: string) {
    if (decision === 'approved') {
      ElMessage.success('Transaction approved.')
    } else {
      ElMessage.warning('Transaction rejected.')
    }
  }
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

  /* Progress Stepper */
  .onboarding-progress {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    padding: 24px 32px 20px;
  }
  .progress-stepper {
    display: flex;
    align-items: flex-start;
  }
  .progress-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    text-align: center;
    cursor: pointer;
  }
  .progress-step::before {
    content: '';
    position: absolute;
    top: 18px;
    left: -50%;
    right: 50%;
    height: 3px;
    background: var(--el-border-color-lighter);
    border-radius: 2px;
    z-index: 0;
  }
  .progress-step:first-child::before {
    display: none;
  }
  .progress-step.completed::before {
    background: var(--el-color-success);
  }
  .progress-step.active::before {
    background: var(--el-color-success-light-5);
  }
  .step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    position: relative;
    z-index: 1;
    background: var(--el-bg-color);
    border: 2.5px solid var(--el-border-color-light);
    color: var(--el-text-color-placeholder);
    transition: all 0.2s;
  }
  .step-circle.done {
    background: var(--el-color-success);
    border-color: transparent;
    color: #fff;
  }
  .step-circle.active {
    background: var(--el-color-primary);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  }
  .step-circle.failed {
    background: var(--el-color-danger);
    border-color: transparent;
    color: #fff;
  }
  .step-check {
    font-size: 16px;
  }
  .step-fail {
    font-size: 14px;
  }
  .step-label {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    max-width: 120px;
  }
  .progress-step.completed .step-label {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
  .progress-step.active .step-label {
    color: var(--el-color-primary);
    font-weight: 700;
  }
  .progress-step.failed .step-label {
    color: var(--el-color-danger);
    font-weight: 600;
  }
  .progress-step.pending {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .progress-step.clickable:hover .step-circle {
    transform: scale(1.1);
  }
  .step-meta {
    font-size: 11px;
    margin-top: 3px;
  }
</style>
