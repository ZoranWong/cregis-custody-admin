<!-- Travel Rule Events — Travel Rule 事件 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('travelRule.pageTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('travelRule.pageSubtitle') }}</p>
      </div>
      <el-button type="primary" plain>
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- ═══ Primary filters ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchant"
        :placeholder="$t('travelRule.merchant')"
        clearable
        class="!w-48"
      >
        <el-option :label="$t('travelRule.allMerchants')" value="" />
        <el-option v-for="m in merchantOptions" :key="m" :label="m" :value="m" />
      </el-select>
      <el-date-picker
        v-model="filters.dateFrom"
        type="date"
        :placeholder="$t('travelRule.from')"
        class="!w-36"
      />
      <el-input
        v-model="filters.search"
        :placeholder="$t('travelRule.searchPlaceholder')"
        clearable
        class="!w-64"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
    </div>

    <!-- ═══ Secondary filters (inside card) ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-4">
          <el-select
            v-model="filters.direction"
            :placeholder="$t('travelRule.direction')"
            clearable
            class="!w-36"
          >
            <el-option :label="$t('travelRule.outgoing')" value="outgoing" />
            <el-option :label="$t('travelRule.incoming')" value="incoming" />
          </el-select>
          <el-select
            v-model="filters.status"
            :placeholder="$t('travelRule.status')"
            clearable
            class="!w-52"
          >
            <el-option :label="$t('travelRule.stWaiting')" value="waiting" />
            <el-option :label="$t('travelRule.stApproved')" value="approved" />
            <el-option :label="$t('travelRule.stRejected')" value="rejected" />
            <el-option :label="$t('travelRule.stSettled')" value="settled" />
            <el-option :label="$t('travelRule.stFailed')" value="failed" />
          </el-select>
          <el-select
            v-model="filters.channel"
            :placeholder="$t('travelRule.channel')"
            clearable
            class="!w-44"
          >
            <el-option :label="$t('travelRule.chNetwork')" value="network" />
            <el-option :label="$t('travelRule.chOffNetwork')" value="off-network" />
          </el-select>
        </div>
      </div>

      <!-- ═══ Event Cards ═══ -->
      <div class="p-4">
        <div
          v-for="event in filteredEvents"
          :key="event.orderId"
          class="tx-card mb-4 last:mb-0 cursor-pointer"
          @click="openEvent(event)"
        >
          <!-- Header: Amount + Meta -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <ArtSvgIcon
                  :icon="event.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
                  :class="
                    event.direction === 'outgoing'
                      ? 'text-[var(--el-color-primary)]'
                      : 'text-[var(--el-color-success)]'
                  "
                  class="text-lg"
                />
                <span class="text-lg font-semibold text-g-900">{{ event.amount }}</span>
                <span class="text-sm text-g-400">≈ {{ event.fiatAmount }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-g-500">{{ event.orderId }}</span>
                <span class="text-xs text-g-400">· {{ event.timeAgo }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-tag :type="event.direction === 'outgoing' ? 'warning' : 'success'" size="small">
                {{
                  event.direction === 'outgoing'
                    ? $t('travelRule.outgoing')
                    : $t('travelRule.incoming')
                }}
              </el-tag>
              <el-tag
                :type="event.channel === 'network' ? 'primary' : 'info'"
                size="small"
                effect="light"
              >
                {{
                  event.channel === 'network'
                    ? $t('travelRule.chNetwork')
                    : $t('travelRule.chOffNetwork')
                }}
              </el-tag>
              <el-tag :type="stateTagType(event.status)" size="small">{{
                stateLabel(event.status)
              }}</el-tag>
            </div>
          </div>

          <!-- Parties -->
          <div class="flex items-stretch gap-3 mb-3 py-3">
            <div class="flex-1 min-w-0 rounded-lg p-3 bg-[var(--el-color-primary-light-9)]">
              <div class="text-xs text-g-600 mb-1.5 font-medium">{{
                $t('travelRule.originator')
              }}</div>
              <div class="text-sm font-semibold text-g-900 truncate">{{
                event.originator.name
              }}</div>
              <div class="text-xs text-g-600 mt-1">{{ event.originator.vasp }}</div>
            </div>
            <div class="flex items-center px-2">
              <ArtSvgIcon
                :icon="
                  event.direction === 'outgoing'
                    ? 'ri:arrow-right-long-line'
                    : 'ri:arrow-left-long-line'
                "
                :class="
                  event.direction === 'outgoing'
                    ? 'text-[var(--el-color-primary)]'
                    : 'text-[var(--el-color-success)]'
                "
                class="text-2xl"
              />
            </div>
            <div class="flex-1 min-w-0 rounded-lg p-3 bg-[var(--el-color-success-light-9)]">
              <div class="text-xs text-g-600 mb-1.5 font-medium">{{
                $t('travelRule.beneficiary')
              }}</div>
              <div class="text-sm font-semibold text-g-900 truncate">{{
                event.beneficiary.name
              }}</div>
              <div class="text-xs text-g-600 mt-1">{{ event.beneficiary.vasp }}</div>
            </div>
          </div>

          <!-- Footer: Status text + View Trace -->
          <div
            class="flex items-center justify-between pt-2.5 border-t border-[var(--default-border)]"
          >
            <div class="text-[11px] font-medium" :class="statusTextClass(event.status)">
              {{ event.statusText }}
            </div>
            <el-button size="small" type="primary" plain @click.stop="openEvent(event)">
              {{ $t('travelRule.viewTrace') }} →
            </el-button>
          </div>
        </div>
        <div v-if="filteredEvents.length === 0" class="py-10 text-center text-g-400 text-sm">
          {{ $t('travelRule.noResults') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'TravelRuleEvents' })
  const router = useRouter()

  const filters = reactive({
    merchant: '',
    dateFrom: '',
    search: '',
    direction: '',
    status: '',
    channel: ''
  })

  const merchantOptions = [
    'CryptoVault Ltd',
    'Alpha Capital',
    'BlockTrade Corp',
    'Digital Assets Fund',
    'Nexus Trading',
    'ChainBridge'
  ]

  // ─── Mock Data ───
  interface TrEvent {
    orderId: string
    amount: string
    fiatAmount: string
    timeAgo: string
    direction: 'outgoing' | 'incoming'
    channel: 'network' | 'off-network'
    status: 'waiting' | 'approved' | 'rejected' | 'settled' | 'failed'
    merchant: string
    originator: { name: string; vasp: string }
    beneficiary: { name: string; vasp: string }
    statusText: string
  }

  const mockEvents: TrEvent[] = [
    {
      orderId: 'ORDER-2026-07-28-0042',
      amount: '4,200 USDT',
      fiatAmount: '15,414 AED',
      timeAgo: '2 hours ago',
      direction: 'outgoing',
      channel: 'network',
      status: 'waiting',
      merchant: 'CryptoVault Ltd',
      originator: { name: 'CryptoVault Ltd', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'John Doe', vasp: 'The UCE DMCC' },
      statusText: 'Awaiting beneficiary VASP approval of our PII (2h elapsed)'
    },
    {
      orderId: 'ORDER-2026-07-28-0043',
      amount: '6,500 USDT',
      fiatAmount: '23,855 AED',
      timeAgo: '1 hour ago',
      direction: 'outgoing',
      channel: 'off-network',
      status: 'waiting',
      merchant: 'Alpha Capital',
      originator: { name: 'Alpha Capital', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'Jane Wilson', vasp: 'Unknown VASP — not on network' },
      statusText:
        'Counterparty not on Travel Rule network — share link generated, awaiting response'
    },
    {
      orderId: 'ORDER-2026-07-28-0038',
      amount: '8,500 USDC',
      fiatAmount: '31,195 AED',
      timeAgo: '5 hours ago',
      direction: 'outgoing',
      channel: 'network',
      status: 'approved',
      merchant: 'BlockTrade Corp',
      originator: { name: 'BlockTrade Corp', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'Alice Smith', vasp: 'Coinbase Prime' },
      statusText: 'Counterparty approved — PII exchange complete'
    },
    {
      orderId: 'ORDER-2026-07-27-0029',
      amount: '12,000 USDT',
      fiatAmount: '44,040 AED',
      timeAgo: '1 day ago',
      direction: 'outgoing',
      channel: 'network',
      status: 'settled',
      merchant: 'Digital Assets Fund',
      originator: { name: 'Digital Assets Fund', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'Bob Johnson', vasp: 'Kraken Pro' },
      statusText: 'On-chain transfer confirmed — 12 confirmations'
    },
    {
      orderId: 'ORDER-2026-07-27-0025',
      amount: '5,800 USDC',
      fiatAmount: '21,286 AED',
      timeAgo: '1 day ago',
      direction: 'outgoing',
      channel: 'network',
      status: 'rejected',
      merchant: 'Nexus Trading',
      originator: { name: 'Nexus Trading', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'Charlie Brown', vasp: 'Binance Institutional' },
      statusText: 'Counterparty rejected — reason: sanctions match found on beneficiary address'
    },
    {
      orderId: 'ORDER-2026-07-28-0051',
      amount: '9,300 USDT',
      fiatAmount: '34,131 AED',
      timeAgo: '3 hours ago',
      direction: 'incoming',
      channel: 'network',
      status: 'waiting',
      merchant: 'CryptoVault Ltd',
      originator: { name: 'Sarah Connor', vasp: 'Binance Institutional' },
      beneficiary: { name: 'CryptoVault Ltd', vasp: 'Auto-approved, PII sent' },
      statusText:
        'Auto-approved originator PII, sent beneficiary PII — awaiting counterparty approval (3h elapsed)'
    },
    {
      orderId: 'ORDER-2026-07-27-0044',
      amount: '15,000 USDC',
      fiatAmount: '55,050 AED',
      timeAgo: '1 day ago',
      direction: 'incoming',
      channel: 'network',
      status: 'settled',
      merchant: 'BlockTrade Corp',
      originator: { name: 'Michael Scott', vasp: 'Kraken Pro' },
      beneficiary: { name: 'BlockTrade Corp', vasp: 'Auto-approved, PII exchanged' },
      statusText: 'On-chain transfer confirmed — 24 confirmations'
    },
    {
      orderId: 'ORDER-2026-07-28-0055',
      amount: '7,200 USDT',
      fiatAmount: '26,424 AED',
      timeAgo: '30 minutes ago',
      direction: 'incoming',
      channel: 'off-network',
      status: 'waiting',
      merchant: 'Digital Assets Fund',
      originator: { name: 'Unknown Sender', vasp: 'Unknown VASP — not on network' },
      beneficiary: { name: 'Digital Assets Fund', vasp: 'Auto-approved, PII sent' },
      statusText: 'Originator VASP not on network — share link generated to request PII'
    },
    {
      orderId: 'ORDER-2026-07-26-0019',
      amount: '3,200 USDT',
      fiatAmount: '11,744 AED',
      timeAgo: '2 days ago',
      direction: 'outgoing',
      channel: 'network',
      status: 'failed',
      merchant: 'ChainBridge',
      originator: { name: 'ChainBridge', vasp: 'PII sent via Notabene' },
      beneficiary: { name: 'Sarah Lee', vasp: 'OKX' },
      statusText: 'On-chain transfer failed — insufficient gas, transaction reverted'
    }
  ]

  const filteredEvents = computed(() => {
    let list = [...mockEvents]
    if (filters.direction) {
      list = list.filter((e) => e.direction === filters.direction)
    }
    if (filters.status) {
      list = list.filter((e) => e.status === filters.status)
    }
    if (filters.channel) {
      list = list.filter((e) => e.channel === filters.channel)
    }
    if (filters.merchant) {
      list = list.filter((e) => e.merchant === filters.merchant)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (e) =>
          e.orderId.toLowerCase().includes(q) ||
          e.originator.name.toLowerCase().includes(q) ||
          e.beneficiary.name.toLowerCase().includes(q)
      )
    }
    return list
  })

  function stateTagType(status: string) {
    const map: Record<string, string> = {
      waiting: 'warning',
      approved: 'success',
      rejected: 'danger',
      settled: 'primary',
      failed: 'danger'
    }
    return (map[status] || 'info') as any
  }
  function stateLabel(status: string) {
    const map: Record<string, string> = {
      waiting: 'Waiting for Counterparty',
      approved: 'Counterparty Approved',
      rejected: 'Rejected',
      settled: 'Successful Settlement',
      failed: 'Failed Settlement'
    }
    return map[status] || status
  }
  function statusTextClass(status: string) {
    const map: Record<string, string> = {
      waiting: 'text-[var(--el-color-warning)]',
      approved: 'text-[var(--el-color-success)]',
      rejected: 'text-[var(--el-color-danger)]',
      settled: 'text-[var(--el-color-primary)]',
      failed: 'text-[var(--el-color-danger)]'
    }
    return map[status] || 'text-g-500'
  }

  function openEvent(event: TrEvent) {
    router.push({ name: 'TransactionLensDetail', params: { id: event.orderId } })
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
</style>
