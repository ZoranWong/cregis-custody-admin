<!-- Transaction Lens — 交易全景 -->
<template>
  <div class="page-content">
    <!-- ═══ 摘要卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in summaryCards" :key="card.key">
        <div class="art-card h-28 px-5 mb-5 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[26px] font-medium mt-1" :class="card.valueClass">{{
            card.value
          }}</span>
          <span v-if="card.sub" class="text-xs mt-1 text-g-400">{{ card.sub }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 审查结果卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in reviewCards" :key="card.key">
        <div class="art-card h-24 px-5 mb-5 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[22px] font-medium mt-1 text-g-900">{{ card.value }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 筛选栏 ═══ -->
    <div class="art-card mb-5 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <el-select
          v-model="filters.merchant"
          :placeholder="$t('txLens.merchant')"
          clearable
          class="!w-44"
        >
          <el-option v-for="m in merchants" :key="m" :label="m" :value="m" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          :start-placeholder="$t('txLens.startDate')"
          :end-placeholder="$t('txLens.endDate')"
          class="!w-64"
        />
        <el-input
          v-model="filters.keyword"
          :placeholder="$t('txLens.searchPlaceholder')"
          clearable
          class="!w-56"
        />
        <div class="w-px h-6 bg-g-300" />
        <el-select
          v-model="filters.direction"
          :placeholder="$t('txLens.direction')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.outgoing')" value="Outgoing" />
          <el-option :label="$t('txLens.incoming')" value="Incoming" />
        </el-select>
        <el-select
          v-model="filters.compliance"
          :placeholder="$t('txLens.compliance')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.clear')" value="Clear" />
          <el-option :label="$t('txLens.flagged')" value="Flagged" />
          <el-option :label="$t('txLens.inReview')" value="In Review" />
        </el-select>
        <el-select
          v-model="filters.travelRule"
          :placeholder="$t('txLens.travelRule')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.trComplete')" value="Complete" />
          <el-option :label="$t('txLens.trPending')" value="Pending" />
          <el-option :label="$t('txLens.trMismatch')" value="Mismatch" />
          <el-option :label="$t('txLens.trNa')" value="N/A" />
        </el-select>
        <el-select
          v-model="filters.signOff"
          :placeholder="$t('txLens.signOff')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.soApproved')" value="Approved" />
          <el-option :label="$t('txLens.soPending')" value="Pending" />
        </el-select>
        <el-select
          v-model="filters.onChain"
          :placeholder="$t('txLens.onChain')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.broadcasted')" value="Broadcasted" />
          <el-option :label="$t('txLens.confirmed')" value="Confirmed" />
          <el-option :label="$t('txLens.settled')" value="Settled" />
          <el-option :label="$t('txLens.failed')" value="Failed" />
        </el-select>
        <el-select
          v-model="filters.fundDisposition"
          :placeholder="$t('txLens.fundDisposition')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.fdReleased')" value="Released" />
          <el-option :label="$t('txLens.fdHeld')" value="Held" />
          <el-option :label="$t('txLens.fdForfeited')" value="Forfeited" />
          <el-option :label="$t('txLens.trNa')" value="N/A" />
        </el-select>
        <el-select
          v-model="filters.reviewResult"
          :placeholder="$t('txLens.reviewResult')"
          clearable
          class="!w-32"
        >
          <el-option :label="$t('txLens.rrNone')" value="None" />
          <el-option :label="$t('txLens.truePositive')" value="True Positive" />
          <el-option :label="$t('txLens.falsePositive')" value="False Positive" />
          <el-option :label="$t('txLens.falseNegative')" value="False Negative" />
        </el-select>
      </div>
    </div>

    <!-- ═══ 交易卡片列表 ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <span class="text-g-900 font-medium">{{ $t('txLens.transactions') }}</span>
        <el-button text size="small">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
        </el-button>
      </div>
      <div class="p-4">
        <div v-for="tx in filteredTransactions" :key="tx.orderId" class="tx-card mb-4 last:mb-0">
          <!-- 顶部：金额 + 方向 + 结果 -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg font-semibold text-g-900">{{ tx.amount }}</span>
                <span class="text-sm text-g-400">≈ {{ tx.fiatAmount }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-g-500">{{ tx.orderId }}</span>
                <span class="text-xs text-g-400">· {{ tx.time }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-tag :type="tx.direction === 'Outgoing' ? 'warning' : 'success'" size="small">{{
                tx.direction
              }}</el-tag>
              <el-tag
                v-if="tx.reviewResult !== 'None'"
                :type="reviewTag(tx.reviewResult)"
                size="small"
                effect="light"
                >{{ tx.reviewResult }}</el-tag
              >
            </div>
          </div>

          <!-- parties 两侧 -->
          <div class="flex items-center gap-3 mb-3 py-2">
            <div class="flex-1 min-w-0">
              <div class="text-xs text-g-400 mb-0.5">{{ $t('txLens.originator') }}</div>
              <div class="text-sm font-medium text-g-800 truncate">{{ tx.originator.name }}</div>
              <div class="text-xs text-g-500 truncate">{{ tx.originator.account }}</div>
            </div>
            <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400 text-lg flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-xs text-g-400 mb-0.5">{{ $t('txLens.beneficiary') }}</div>
              <div class="text-sm font-medium text-g-800 truncate">{{ tx.beneficiary.name }}</div>
              <div class="text-xs text-g-500 truncate">{{ tx.beneficiary.account }}</div>
            </div>
          </div>

          <!-- 5 步生命周期阶段条 -->
          <div class="lc-stages">
            <div v-for="stage in tx.stages" :key="stage.key" class="lc-stage">
              <div class="lc-stage-dot" :class="stage.dotClass"></div>
              <div class="lc-stage-label">{{ stage.label }}</div>
              <div class="lc-stage-value">{{ stage.value }}</div>
            </div>
          </div>

          <!-- 操作 -->
          <div class="flex justify-end mt-3 pt-3 border-t border-[var(--default-border)]">
            <el-button size="small" type="primary" @click="inspect(tx.orderId)">{{
              $t('txLens.inspect')
            }}</el-button>
          </div>
        </div>
        <div
          v-if="filteredTransactions.length === 0"
          class="py-10 text-center text-g-400 text-sm"
          >{{ $t('txLens.noResults') }}</div
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'TransactionLens' })

  const router = useRouter()

  const filters = reactive({
    merchant: '',
    dateRange: [] as string[],
    keyword: '',
    direction: '',
    compliance: '',
    travelRule: '',
    signOff: '',
    onChain: '',
    fundDisposition: '',
    reviewResult: ''
  })

  const merchants = ['CryptoVault', 'PayFlow', 'ChainBridge', 'TokenGuard', 'BlockSafe']

  const summaryCards = [
    {
      key: 'total',
      labelKey: 'txLens.totalTransactions',
      value: '1,247',
      valueClass: 'text-g-900',
      sub: ''
    },
    {
      key: 'settled',
      labelKey: 'txLens.settled',
      value: '1,189',
      valueClass: 'text-success',
      sub: '95.3%'
    },
    {
      key: 'rejected',
      labelKey: 'txLens.rejected',
      value: '8',
      valueClass: 'text-[var(--el-color-danger)]',
      sub: '0.6%'
    },
    {
      key: 'pending',
      labelKey: 'txLens.pendingReview',
      value: '24',
      valueClass: 'text-[var(--el-color-warning)]',
      sub: '8 critical'
    }
  ]

  const reviewCards = [
    { key: 'tp', labelKey: 'txLens.truePositive', value: 22 },
    { key: 'tn', labelKey: 'txLens.trueNegative', value: 1194 },
    { key: 'fp', labelKey: 'txLens.falsePositive', value: 12 },
    { key: 'fn', labelKey: 'txLens.falseNegative', value: 3 }
  ]

  interface Party {
    name: string
    account: string
  }
  interface Stage {
    key: string
    label: string
    value: string
    dotClass: string
  }
  interface Tx {
    orderId: string
    amount: string
    fiatAmount: string
    direction: string
    reviewResult: string
    time: string
    originator: Party
    beneficiary: Party
    stages: Stage[]
  }

  // dot class: done / active / held / pending / rejected / released / na
  const mockTransactions: Tx[] = [
    {
      orderId: 'ORDER-2026-08-25-001',
      amount: '3,500 USDT',
      fiatAmount: '12,950 AED',
      direction: 'Outgoing',
      reviewResult: 'None',
      time: '2026-08-25 10:30',
      originator: { name: 'CryptoVault Ltd', account: 'Unit A · 0x4f2a...' },
      beneficiary: { name: 'The UCE DMCC', account: '0x9c1b...' },
      stages: [
        { key: 'compliance', label: 'Compliance', value: 'Clear', dotClass: 'done' },
        { key: 'travelRule', label: 'Travel Rule', value: 'Complete', dotClass: 'done' },
        { key: 'signOff', label: 'Sign-off', value: 'Approved', dotClass: 'done' },
        { key: 'onChain', label: 'On-Chain', value: 'Settled', dotClass: 'done' },
        { key: 'fund', label: 'Fund Disposition', value: 'Released', dotClass: 'released' }
      ]
    },
    {
      orderId: 'ORDER-2026-08-25-002',
      amount: '1,200 USDT',
      fiatAmount: '4,440 AED',
      direction: 'Incoming',
      reviewResult: 'False Positive',
      time: '2026-08-25 09:15',
      originator: { name: 'Coinbase Prime', account: '0xa8f3...' },
      beneficiary: { name: 'PayFlow Inc', account: 'Unit B · 0x2d7e...' },
      stages: [
        { key: 'compliance', label: 'Compliance', value: 'Flagged', dotClass: 'held' },
        { key: 'travelRule', label: 'Travel Rule', value: 'Pending', dotClass: 'pending' },
        { key: 'signOff', label: 'Sign-off', value: 'Pending', dotClass: 'pending' },
        { key: 'onChain', label: 'On-Chain', value: 'Confirmed', dotClass: 'active' },
        { key: 'fund', label: 'Fund Disposition', value: 'Held', dotClass: 'held' }
      ]
    },
    {
      orderId: 'ORDER-2026-08-24-042',
      amount: '5,000 USDT',
      fiatAmount: '18,500 AED',
      direction: 'Outgoing',
      reviewResult: 'True Positive',
      time: '2026-08-24 16:45',
      originator: { name: 'ChainBridge', account: 'Unit C · 0x7b3c...' },
      beneficiary: { name: 'Kraken Pro', account: '0x1e6a...' },
      stages: [
        { key: 'compliance', label: 'Compliance', value: 'In Review', dotClass: 'active' },
        { key: 'travelRule', label: 'Travel Rule', value: 'Mismatch', dotClass: 'held' },
        { key: 'signOff', label: 'Sign-off', value: 'Pending', dotClass: 'pending' },
        { key: 'onChain', label: 'On-Chain', value: 'Broadcasted', dotClass: 'active' },
        { key: 'fund', label: 'Fund Disposition', value: 'N/A', dotClass: 'na' }
      ]
    },
    {
      orderId: 'ORDER-2026-08-24-038',
      amount: '800 USDT',
      fiatAmount: '2,960 AED',
      direction: 'Incoming',
      reviewResult: 'None',
      time: '2026-08-24 14:20',
      originator: { name: 'Binance Institutional', account: '0x6c4d...' },
      beneficiary: { name: 'TokenGuard', account: 'Unit D · 0x3f9b...' },
      stages: [
        { key: 'compliance', label: 'Compliance', value: 'Clear', dotClass: 'done' },
        { key: 'travelRule', label: 'Travel Rule', value: 'Complete', dotClass: 'done' },
        { key: 'signOff', label: 'Sign-off', value: 'Approved', dotClass: 'done' },
        { key: 'onChain', label: 'On-Chain', value: 'Settled', dotClass: 'done' },
        { key: 'fund', label: 'Fund Disposition', value: 'Released', dotClass: 'released' }
      ]
    },
    {
      orderId: 'ORDER-2026-08-24-035',
      amount: '2,100 USDT',
      fiatAmount: '7,770 AED',
      direction: 'Outgoing',
      reviewResult: 'False Negative',
      time: '2026-08-24 11:00',
      originator: { name: 'BlockSafe', account: 'Unit E · 0x8a2f...' },
      beneficiary: { name: 'OKX', account: '0x5b1c...' },
      stages: [
        { key: 'compliance', label: 'Compliance', value: 'Clear', dotClass: 'done' },
        { key: 'travelRule', label: 'Travel Rule', value: 'Complete', dotClass: 'done' },
        { key: 'signOff', label: 'Sign-off', value: 'Approved', dotClass: 'done' },
        { key: 'onChain', label: 'On-Chain', value: 'Failed', dotClass: 'rejected' },
        { key: 'fund', label: 'Fund Disposition', value: 'N/A', dotClass: 'na' }
      ]
    }
  ]

  const filteredTransactions = computed(() => {
    return mockTransactions.filter((t) => {
      if (filters.direction && t.direction !== filters.direction) return false
      if (filters.compliance && t.stages[0].value !== filters.compliance) return false
      if (filters.travelRule && t.stages[1].value !== filters.travelRule) return false
      if (filters.signOff && t.stages[2].value !== filters.signOff) return false
      if (filters.onChain && t.stages[3].value !== filters.onChain) return false
      if (filters.fundDisposition && t.stages[4].value !== filters.fundDisposition) return false
      if (filters.reviewResult && t.reviewResult !== filters.reviewResult) return false
      if (filters.keyword && !t.orderId.toLowerCase().includes(filters.keyword.toLowerCase()))
        return false
      return true
    })
  })

  function reviewTag(result: string) {
    if (result === 'True Positive') return 'success'
    if (result === 'False Positive') return 'warning'
    if (result === 'False Negative') return 'danger'
    return 'info'
  }

  function inspect(orderId: string) {
    router.push({ name: 'TransactionLensDetail', params: { id: orderId } })
  }
</script>

<style scoped>
  .tx-card {
    border: 1px solid var(--default-border);
    border-radius: 12px;
    padding: 16px;
    transition: border-color 0.2s;
  }
  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }
  .lc-stages {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  .lc-stage {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }
  .lc-stage:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 6px;
    right: -50%;
    width: 100%;
    height: 2px;
    background: var(--default-border);
    z-index: 0;
  }
  .lc-stage-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--default-border);
    background: var(--art-bg-color);
    z-index: 1;
    margin-bottom: 4px;
  }
  .lc-stage-dot.done {
    background: var(--el-color-success);
    border-color: var(--el-color-success);
  }
  .lc-stage-dot.active {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
  .lc-stage-dot.held {
    background: var(--el-color-warning);
    border-color: var(--el-color-warning);
  }
  .lc-stage-dot.pending {
    background: var(--el-color-info-light-5);
    border-color: var(--el-color-info);
  }
  .lc-stage-dot.rejected {
    background: var(--el-color-danger);
    border-color: var(--el-color-danger);
  }
  .lc-stage-dot.released {
    background: var(--el-color-success-light-5);
    border-color: var(--el-color-success);
  }
  .lc-stage-dot.na {
    background: var(--art-bg-color);
    border-color: var(--default-border);
  }
  .lc-stage-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-bottom: 2px;
  }
  .lc-stage-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
</style>
