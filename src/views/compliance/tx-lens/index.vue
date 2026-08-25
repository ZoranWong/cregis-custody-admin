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
          class="!w-36"
        >
          <el-option :label="$t('txLens.outgoing')" value="Outgoing" />
          <el-option :label="$t('txLens.incoming')" value="Incoming" />
        </el-select>
        <el-select
          v-model="filters.compliance"
          :placeholder="$t('txLens.compliance')"
          clearable
          class="!w-36"
        >
          <el-option :label="$t('txLens.clear')" value="Clear" />
          <el-option :label="$t('txLens.flagged')" value="Flagged" />
          <el-option :label="$t('txLens.inReview')" value="In Review" />
        </el-select>
        <el-select
          v-model="filters.onChain"
          :placeholder="$t('txLens.onChain')"
          clearable
          class="!w-36"
        >
          <el-option :label="$t('txLens.broadcasted')" value="Broadcasted" />
          <el-option :label="$t('txLens.confirmed')" value="Confirmed" />
          <el-option :label="$t('txLens.settled')" value="Settled" />
          <el-option :label="$t('txLens.failed')" value="Failed" />
        </el-select>
      </div>
    </div>

    <!-- ═══ 交易列表 ═══ -->
    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <span class="text-g-900 font-medium">{{ $t('txLens.transactions') }}</span>
        <el-button text size="small">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
        </el-button>
      </div>
      <el-table :data="filteredTransactions" stripe size="small">
        <el-table-column :label="$t('txLens.orderId')" min-width="180">
          <template #default="{ row }">
            <span class="text-sm font-medium text-g-900">{{ row.orderId }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('txLens.amount')" width="140">
          <template #default="{ row }">{{ row.amount }}</template>
        </el-table-column>
        <el-table-column :label="$t('txLens.direction')" width="110">
          <template #default="{ row }">
            <el-tag :type="row.direction === 'Outgoing' ? 'warning' : 'success'" size="small">
              {{ row.direction }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('txLens.compliance')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.compliance === 'Clear' ? 'success' : 'danger'" size="small">
              {{ row.compliance }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('txLens.travelRule')" width="120">
          <template #default="{ row }">{{ row.travelRule }}</template>
        </el-table-column>
        <el-table-column :label="$t('txLens.onChain')" width="120">
          <template #default="{ row }">{{ row.onChain }}</template>
        </el-table-column>
        <el-table-column :label="$t('txLens.time')" width="160">
          <template #default="{ row }">{{ row.time }}</template>
        </el-table-column>
        <el-table-column :label="$t('txLens.action')" width="100" fixed="right">
          <template #default>
            <el-button size="small" text>{{ $t('txLens.inspect') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'TransactionLens' })

  const filters = reactive({
    merchant: '',
    dateRange: [] as string[],
    keyword: '',
    direction: '',
    compliance: '',
    onChain: ''
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

  const mockTransactions = [
    {
      orderId: 'ORDER-2026-08-25-001',
      amount: '3,500 USDT',
      direction: 'Outgoing',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Settled',
      time: '2026-08-25 10:30'
    },
    {
      orderId: 'ORDER-2026-08-25-002',
      amount: '1,200 USDT',
      direction: 'Incoming',
      compliance: 'Flagged',
      travelRule: 'Pending',
      onChain: 'Confirmed',
      time: '2026-08-25 09:15'
    },
    {
      orderId: 'ORDER-2026-08-24-042',
      amount: '5,000 USDT',
      direction: 'Outgoing',
      compliance: 'In Review',
      travelRule: 'Mismatch',
      onChain: 'Broadcasted',
      time: '2026-08-24 16:45'
    },
    {
      orderId: 'ORDER-2026-08-24-038',
      amount: '800 USDT',
      direction: 'Incoming',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Settled',
      time: '2026-08-24 14:20'
    },
    {
      orderId: 'ORDER-2026-08-24-035',
      amount: '2,100 USDT',
      direction: 'Outgoing',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Failed',
      time: '2026-08-24 11:00'
    }
  ]

  const filteredTransactions = computed(() => {
    return mockTransactions.filter((t) => {
      if (filters.direction && t.direction !== filters.direction) return false
      if (filters.compliance && t.compliance !== filters.compliance) return false
      if (filters.onChain && t.onChain !== filters.onChain) return false
      if (filters.keyword && !t.orderId.toLowerCase().includes(filters.keyword.toLowerCase()))
        return false
      return true
    })
  })
</script>
