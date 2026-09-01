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
      <!-- Lifecycle Row -->
      <div class="tx-lifecycle mt-3 pt-3 border-t border-[var(--default-border)]">
        <div class="lc-stage" v-for="stage in lifecycleStages" :key="stage.key">
          <div class="lc-stage-dot" :class="stage.dotClass"></div>
          <div class="lc-stage-content">
            <div class="lc-stage-label">{{ stage.label }}</div>
            <div class="lc-stage-state" :class="stage.stateClass">{{ stage.state }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Step Navigation ═══ -->
    <div class="step-nav mb-5">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step-item"
        :class="{ active: activeStep === step.key, completed: step.completed }"
        @click="activeStep = step.key"
      >
        <div class="step-number">
          <span v-if="step.completed" class="step-check">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-label">{{ step.label }}</div>
        <div v-if="step.state" class="step-state" :class="step.stateClass">{{ step.state }}</div>
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
  import { useRoute, useRouter } from 'vue-router'
  import StepCompliance from './components/StepCompliance.vue'
  import StepTravelRule from './components/StepTravelRule.vue'
  import StepSignOff from './components/StepSignOff.vue'
  import StepOnChain from './components/StepOnChain.vue'

  defineOptions({ name: 'TransactionLensDetail' })

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

  // ─── Lifecycle Stages ───
  const lifecycleStages = computed(() => {
    const stages: Array<{
      key: string
      label: string
      state: string
      dotClass: string
      stateClass: string
    }> = []
    stages.push({
      key: 'compliance',
      label: 'Compliance',
      state: txData.compliance,
      dotClass: txData.compliance === 'Clear' ? 'done' : 'active',
      stateClass: txData.compliance === 'Clear' ? 'done' : 'active'
    })
    stages.push({
      key: 'travel',
      label: 'Travel Rule',
      state: txData.travelRule,
      dotClass: txData.travelRule === 'Complete' ? 'done' : 'active',
      stateClass: txData.travelRule === 'Complete' ? 'done' : 'active'
    })
    if (txData.direction === 'Outgoing') {
      stages.push({
        key: 'signoff',
        label: 'Sign-off',
        state: txData.signOff,
        dotClass: txData.signOff === 'Approved' ? 'done' : 'pending',
        stateClass: txData.signOff === 'Approved' ? 'done' : 'pending'
      })
      stages.push({
        key: 'onchain',
        label: 'On-Chain',
        state: txData.status,
        dotClass: txData.status === 'Settled' ? 'done' : 'active',
        stateClass: txData.status === 'Settled' ? 'done' : 'active'
      })
    } else {
      stages.push({
        key: 'onchain',
        label: 'On-Chain',
        state: txData.status,
        dotClass: txData.status === 'Confirmed' ? 'done' : 'active',
        stateClass: txData.status === 'Confirmed' ? 'done' : 'active'
      })
      if (txData.fundDisposition) {
        stages.push({
          key: 'disposition',
          label: 'Fund Disposition',
          state: txData.fundDisposition,
          dotClass: txData.fundDisposition === 'Released' ? 'released' : 'held',
          stateClass: txData.fundDisposition === 'Released' ? 'released' : 'held'
        })
      }
    }
    return stages
  })

  // ─── Step Navigation ──
  const steps = computed(() => {
    const result: Array<{
      key: string
      label: string
      state?: string
      stateClass?: string
      completed?: boolean
    }> = [
      {
        key: 'compliance',
        label: 'Compliance',
        state: txData.compliance,
        stateClass: 'done',
        completed: txData.compliance === 'Clear'
      },
      {
        key: 'travel-rule',
        label: 'Travel Rule',
        state: txData.travelRule,
        stateClass: 'done',
        completed: txData.travelRule === 'Complete'
      }
    ]
    if (txData.direction === 'Outgoing') {
      result.push({
        key: 'signoff',
        label: 'Sign-off',
        state: txData.signOff,
        stateClass: txData.signOff === 'Approved' ? 'done' : 'pending',
        completed: txData.signOff === 'Approved'
      })
    }
    result.push({
      key: 'onchain',
      label: 'On-Chain',
      state: txData.status,
      stateClass: txData.status === 'Settled' || txData.status === 'Confirmed' ? 'done' : 'active',
      completed: txData.status === 'Settled' || txData.status === 'Confirmed'
    })
    return result
  })

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

  .tx-lifecycle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }
  .lc-stage {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .lc-stage-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lc-stage-dot.done {
    background: #16a34a;
  }
  .lc-stage-dot.active {
    background: #d97706;
  }
  .lc-stage-dot.pending {
    background: var(--el-text-color-placeholder);
  }
  .lc-stage-dot.released {
    background: #16a34a;
  }
  .lc-stage-dot.held {
    background: #d97706;
  }
  .lc-stage-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .lc-stage-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--el-text-color-secondary);
    line-height: 1;
  }
  .lc-stage-state {
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
  }
  .lc-stage-state.done {
    color: #16a34a;
  }
  .lc-stage-state.active {
    color: #d97706;
  }
  .lc-stage-state.pending {
    color: var(--el-text-color-secondary);
  }
  .lc-stage-state.released {
    color: #16a34a;
  }
  .lc-stage-state.held {
    color: #d97706;
  }

  .step-nav {
    display: flex;
    align-items: flex-start;
    gap: 0;
    border-bottom: 2px solid var(--el-border-color-light);
  }
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 24px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    min-width: 120px;
  }
  .step-item:hover {
    background: var(--el-fill-color-light);
  }
  .step-item.active {
    border-bottom-color: var(--el-color-primary);
  }
  .step-item.active .step-number {
    background: var(--el-color-primary);
    color: #fff;
    border-color: var(--el-color-primary);
  }
  .step-item.completed .step-number {
    background: var(--el-color-success);
    color: #fff;
    border-color: var(--el-color-success);
  }
  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color);
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
  .step-check {
    font-size: 14px;
  }
  .step-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
  }
  .step-item:not(.active) .step-label {
    color: var(--el-text-color-secondary);
  }
  .step-state {
    font-size: 11px;
    font-weight: 600;
  }
  .step-state.done {
    color: var(--el-color-success);
  }
  .step-state.active {
    color: var(--el-color-warning);
  }
  .step-state.pending {
    color: var(--el-text-color-secondary);
  }
</style>
