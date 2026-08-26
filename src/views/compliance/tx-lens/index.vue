<!-- Transaction Lens — 交易全景 -->
<template>
  <div class="page-content">
    <!-- ═══ 摘要卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in summaryCards" :key="card.key">
        <div class="art-card h-32 px-5 mb-5 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[26px] font-medium mt-1" :class="card.valueClass">{{
            card.value
          }}</span>
          <span class="text-xs mt-1 text-g-400">{{ $t(card.subKey) }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 审查结果卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in reviewCards" :key="card.key">
        <div class="art-card h-32 px-5 mb-5 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[22px] font-medium mt-1" :class="card.valueClass">{{
            card.value
          }}</span>
          <span class="text-xs mt-1 text-g-400">{{ $t(card.subKey) }}</span>
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
          <div class="flex items-center gap-4 mb-3 py-3">
            <div class="flex-1 min-w-0">
              <div class="text-xs text-g-500 mb-1">{{
                partyLabel(tx.direction, 'originator')
              }}</div>
              <div class="text-sm font-semibold text-g-900 truncate">{{ tx.originator.name }}</div>
              <div class="text-xs text-g-600 mt-1">{{ tx.originator.unit }}</div>
              <div class="text-xs text-g-500 font-mono truncate">{{ tx.originator.address }}</div>
            </div>
            <ArtSvgIcon
              :icon="tx.direction === 'Outgoing' ? 'ri:arrow-right-line' : 'ri:arrow-left-line'"
              :class="tx.direction === 'Outgoing' ? 'text-primary' : 'text-success'"
              class="text-xl flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="text-xs text-g-500 mb-1">{{
                partyLabel(tx.direction, 'beneficiary')
              }}</div>
              <div class="text-sm font-semibold text-g-900 truncate">{{ tx.beneficiary.name }}</div>
              <div class="text-xs text-g-600 mt-1">{{ tx.beneficiary.unit }}</div>
              <div class="text-xs text-g-500 font-mono truncate">{{ tx.beneficiary.address }}</div>
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
      subKey: 'txLens.subLast30Days'
    },
    {
      key: 'settled',
      labelKey: 'txLens.settled',
      value: '1,189',
      valueClass: 'text-success',
      subKey: 'txLens.subSettlementRate'
    },
    {
      key: 'rejected',
      labelKey: 'txLens.rejected',
      value: '8',
      valueClass: 'text-[var(--el-color-danger)]',
      subKey: 'txLens.subRejectionRate'
    },
    {
      key: 'pending',
      labelKey: 'txLens.pendingReview',
      value: '24',
      valueClass: 'text-[var(--el-color-warning)]',
      subKey: 'txLens.subPendingDetail'
    }
  ]

  const reviewCards = [
    {
      key: 'tp',
      labelKey: 'txLens.truePositive',
      value: 22,
      valueClass: 'text-success',
      subKey: 'txLens.subCorrectlyFlagged'
    },
    {
      key: 'tn',
      labelKey: 'txLens.trueNegative',
      value: 1194,
      valueClass: 'text-success',
      subKey: 'txLens.subCorrectlyCleared'
    },
    {
      key: 'fp',
      labelKey: 'txLens.falsePositive',
      value: 12,
      valueClass: 'text-warning',
      subKey: 'txLens.subWronglyFlagged'
    },
    {
      key: 'fn',
      labelKey: 'txLens.falseNegative',
      value: 3,
      valueClass: 'text-purple-600',
      subKey: 'txLens.subWronglyCleared'
    }
  ]

  interface Party {
    name: string
    unit: string
    address: string
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

  const mockTransactions: Tx[] = [
    {
      orderId: 'ORDER-2026-08-25-001',
      amount: '3,500 USDT',
      fiatAmount: '12,950 AED',
      direction: 'Outgoing',
      reviewResult: 'None',
      time: '2026-08-25 10:30',
      originator: {
        name: 'CryptoVault Ltd',
        unit: 'Unit: Treasury · Account: Primary Pay-Out',
        address: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26'
      },
      beneficiary: {
        name: 'John Doe',
        unit: 'Counterparty',
        address: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75'
      },
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
      originator: {
        name: 'Coinbase Prime',
        unit: 'Counterparty',
        address: '0xa8f3c2D8eB44f7a96B2c5D3E8901AbCdEf123456'
      },
      beneficiary: {
        name: 'PayFlow Inc',
        unit: 'Unit: Operations · Account: Settlement',
        address: '0x2d7e8B9c4F3a2D1e0F9a8B7c6D5e4F3a2B1c0D9'
      },
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
      originator: {
        name: 'ChainBridge',
        unit: 'Unit: C · Account: Bridge Ops',
        address: '0x7b3c8D9e0F1a2B3c4D5e6F7a8B9c0D1e2F3a4B5'
      },
      beneficiary: {
        name: 'Kraken Pro',
        unit: 'Counterparty',
        address: '0x1e6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4'
      },
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
      originator: {
        name: 'Binance Institutional',
        unit: 'Counterparty',
        address: '0x6c4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2'
      },
      beneficiary: {
        name: 'TokenGuard',
        unit: 'Unit: D · Account: Custody',
        address: '0x3f9b0C1d2E3f4A5b6C7d8E9f0A1b2C3d4E5f6A7'
      },
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
      originator: {
        name: 'BlockSafe',
        unit: 'Unit: E · Account: Safe Ops',
        address: '0x8a2f3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0'
      },
      beneficiary: {
        name: 'OKX',
        unit: 'Counterparty',
        address: '0x5b1c2D3e4F5a6B7c8D9e0F1a2B3c4D5e6F7a8B9'
      },
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

  function partyLabel(direction: string, party: 'originator' | 'beneficiary'): string {
    if (direction === 'Outgoing') {
      return party === 'originator' ? 'Originator (Our Customer)' : 'Beneficiary (Counterparty)'
    } else {
      return party === 'originator' ? 'Originator (Counterparty)' : 'Beneficiary (Our Customer)'
    }
  }

  function inspect(orderId: string) {
    router.push({ name: 'TransactionLensDetail', params: { id: orderId } })
  }
</script>

<style scoped>
  .tx-card {
    padding: 16px;
    border: 1px solid var(--default-border);
    border-radius: 12px;
    transition: border-color 0.2s;
  }

  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }

  .lc-stages {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .lc-stage {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
    text-align: center;
  }

  .lc-stage:not(:last-child)::after {
    position: absolute;
    top: 6px;
    right: -50%;
    z-index: 0;
    width: 100%;
    height: 2px;
    content: '';
    background: var(--default-border);
  }

  .lc-stage-dot {
    z-index: 1;
    width: 12px;
    height: 12px;
    margin-bottom: 4px;
    background: var(--art-bg-color);
    border: 2px solid var(--default-border);
    border-radius: 50%;
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
    margin-bottom: 2px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .lc-stage-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
</style>
